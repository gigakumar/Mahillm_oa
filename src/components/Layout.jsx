import Navbar from './Navbar';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <header className="layout-header">
        <div className="container">
          <Navbar />
        </div>
      </header>
      <main className="layout-main container">
        {children}
      </main>
      <footer className="layout-footer">
        <div className="container">
          <p>Built with ☕ for BIT Mesra Mech '26 — <a href="https://github.com" target="_blank" rel="noopener noreferrer">Contribute on GitHub</a></p>
        </div>
      </footer>
    </div>
  );
}
