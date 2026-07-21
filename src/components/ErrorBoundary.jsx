import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#ef4444', marginTop: 0 }}>Application Error</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Something went wrong while rendering this page.
            </p>
            <pre style={{
              backgroundColor: '#0f172a',
              color: '#f87171',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
              fontSize: '0.8rem',
              textAlign: 'left',
              marginBottom: '1.5rem'
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              style={{
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
