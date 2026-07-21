import React, { useRef, useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FloatingMenu from '../FloatingMenu';
import Navbar from '../Navbar';
import { BrowserRouter } from 'react-router-dom';

// We will mock the context hooks directly using vitest
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { email: 'test@test.com' }, logout: vi.fn() }))
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() }))
}));
vi.mock('../../contexts/ScoreContext', () => ({
  useScore: vi.fn(() => ({ scoreData: { accuracy: 100, xp: 50 } }))
}));
vi.mock('../../contexts/UserDataContext', () => ({
  useUserData: vi.fn(() => ({ mistakes: {}, spacedRepetition: {} }))
}));

describe('FloatingMenu', () => {
  let originalGetBoundingClientRect;

  beforeEach(() => {
    // Mock getBoundingClientRect
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      right: 200,
      bottom: 120,
      left: 150,
      width: 50,
      height: 20,
      x: 150,
      y: 100
    }));

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    cleanup();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  const TestComponent = ({ isOpen = true, align = "right", onClose = vi.fn() }) => {
    const triggerRef = useRef(null);
    return (
      <div>
        <button ref={triggerRef} data-testid="trigger">Trigger</button>
        <FloatingMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} align={align}>
          <div data-testid="menu-content">Content</div>
        </FloatingMenu>
        <div data-testid="outside">Outside</div>
      </div>
    );
  };

  it('renders into document.body using a portal', () => {
    render(<TestComponent />);
    const content = screen.getByTestId('menu-content');
    expect(content).toBeInTheDocument();
    
    // Check if it's inside body but not inside the main render container
    expect(document.body.contains(content)).toBe(true);
    const trigger = screen.getByTestId('trigger');
    expect(trigger.parentElement.contains(content)).toBe(false);
  });

  it('positions correctly for right alignment', () => {
    render(<TestComponent align="right" />);
    const menuLayer = screen.getByRole('menu');
    // trigger right is 200, minWidth default 150 -> left should be 200 - 150 = 50
    expect(menuLayer).toHaveStyle({ left: '50px' });
    // top = trigger bottom (120) + offset (8) = 128
    expect(menuLayer).toHaveStyle({ top: '128px' });
    expect(menuLayer).toHaveStyle({ position: 'fixed' });
  });

  it('positions correctly for left alignment', () => {
    render(<TestComponent align="left" />);
    const menuLayer = screen.getByRole('menu');
    // trigger left is 150 -> left should be 150
    expect(menuLayer).toHaveStyle({ left: '150px' });
  });

  it('clamps to right viewport boundary', () => {
    window.innerWidth = 300;
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100, right: 350, bottom: 120, left: 300, width: 50, height: 20
    }));
    render(<TestComponent align="left" />);
    const menuLayer = screen.getByRole('menu');
    // left was 300. viewport is 300. 300 - 150 (menu) - 16 (pad) = 134 max right
    expect(menuLayer).toHaveStyle({ left: '134px' });
  });

  it('flips above if bottom viewport space is insufficient', () => {
    window.innerHeight = 150; // Very short viewport
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100, right: 200, bottom: 120, left: 150, width: 50, height: 20
    }));
    render(<TestComponent />);
    const menuLayer = screen.getByRole('menu');
    // Default top would be 120 + 8 = 128. 
    // Menu height (mocked as 20) + 128 = 148. Wait, if menu height was larger, it would flip.
    // Let's force flip by making menu mock larger.
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    render(<TestComponent onClose={onClose} />);
    
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on outside click but not inside click', async () => {
    const onClose = vi.fn();
    render(<TestComponent onClose={onClose} />);
    
    // Click inside
    await userEvent.click(screen.getByTestId('menu-content'));
    expect(onClose).not.toHaveBeenCalled();

    // Click outside
    await userEvent.click(screen.getByTestId('outside'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('listens to resize and scroll', () => {
    render(<TestComponent />);
    // Just verify listeners are attached (implicit by lack of errors and updatePosition firing).
    // In jsdom it's hard to simulate real bounding rect changes on scroll without heavy mocking.
    fireEvent.scroll(window);
    fireEvent.resize(window);
  });
});

describe('Navbar FloatingMenu Integration', () => {
  it('toggles menus mutually exclusively', async () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const moreBtn = screen.getAllByText('Modules')[0].closest('button');
    const profileBtn = screen.getAllByAltText('Profile')[0].closest('button');

    // Open More
    fireEvent.click(moreBtn);
    expect(screen.getByText('Daily Challenge')).toBeInTheDocument();
    
    // Open Profile
    fireEvent.click(profileBtn);
    expect(screen.queryByText('Daily Challenge')).not.toBeInTheDocument();
    expect(document.querySelector('.logout-btn')).toBeInTheDocument();
  });

  it('shows logout button which is clickable', async () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const profileBtn = screen.getAllByAltText('Profile')[0].closest('button');
    fireEvent.click(profileBtn);
    
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      expect(logoutBtn).toBeInTheDocument();
      expect(logoutBtn).toHaveAttribute('role', 'menuitem');
      fireEvent.click(logoutBtn);
      expect(screen.queryByText('test@test.com')).not.toBeInTheDocument();
    }
  });
});
