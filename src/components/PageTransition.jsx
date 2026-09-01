import { useEffect } from 'react';

export default function PageTransition({ children }) {
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="page-transition-wrapper">
      {children}
    </div>
  );
}
