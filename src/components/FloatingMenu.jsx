import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import './FloatingMenu.css';

export default function FloatingMenu({ 
  isOpen, 
  onClose, 
  triggerRef, 
  children, 
  minWidth = 150,
  align = "right",
  offset = 8 
}) {
  const [position, setPosition] = useState(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current || !menuRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    
    const menuWidth = Math.max(minWidth, menuRect.width || minWidth);
    const menuHeight = menuRect.height;
    
    const VIEWPORT_PADDING = 16;
    
    // Calculate initial left based on alignment
    let left;
    if (align === "right") {
      left = triggerRect.right - menuWidth;
    } else {
      left = triggerRect.left;
    }
    
    // Clamp horizontal position
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        left,
        window.innerWidth - menuWidth - VIEWPORT_PADDING
      )
    );
    
    // Calculate vertical position
    let top = triggerRect.bottom + offset;
    
    // Flip if exceeds bottom viewport
    if (top + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
      // Check if we have more space above than below (or if it fits above)
      const topSpace = triggerRect.top - offset - VIEWPORT_PADDING;
      const bottomSpace = window.innerHeight - triggerRect.bottom - offset - VIEWPORT_PADDING;
      
      if (topSpace > bottomSpace || triggerRect.top - menuHeight - offset >= VIEWPORT_PADDING) {
        top = triggerRect.top - menuHeight - offset;
      }
    }
    
    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    // Need a slight delay to allow menu to render so we can get its height
    // But since we want to avoid flicker, we'll run updatePosition immediately
    // and then requestAnimationFrame for when the DOM is fully painted
    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, align, offset, minWidth]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="floating-menu-layer"
      role="menu"
      style={{
        position: "fixed",
        top: position ? `${position.top}px` : '-9999px',
        left: position ? `${position.left}px` : '-9999px',
        minWidth: `${minWidth}px`,
        opacity: position ? 1 : 0, // hide while measuring
      }}
    >
      {children}
    </div>,
    document.body
  );
}
