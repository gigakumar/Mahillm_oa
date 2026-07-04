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
    </div>
  );
}
