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
    console.error('Uncaught UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-base, #0f172a)',
          color: 'var(--text-primary, #f8fafc)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{
            background: 'var(--bg-elevated, #1e293b)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '24px',
            padding: '2.5rem',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Error icon */}
            <div style={{
              width: '64px', height: '64px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '1.75rem',
            }}>
              ⚡
            </div>

            <h2 style={{
              color: '#f87171',
              fontSize: '1.4rem',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              marginBottom: '0.5rem',
            }}>
              Something Broke
            </h2>
            <p style={{
              color: 'var(--text-secondary, #cbd5e1)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              lineHeight: 1.6,
            }}>
              A rendering error occurred. This is likely a temporary issue.
              Your progress is safe — just reload the page.
            </p>

            {this.state.error && (
              <details style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #94a3b8)',
                  userSelect: 'none',
                  marginBottom: '0.5rem',
                }}>
                  Error details
                </summary>
                <pre style={{
                  background: 'var(--bg-base, #0f172a)',
                  color: '#fca5a5',
                  padding: '1rem',
                  borderRadius: '12px',
                  overflowX: 'auto',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, var(--accent, #3b82f6), #60a5fa)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                style={{
                  background: 'var(--bg-card, #1e293b)',
                  color: 'var(--text-secondary, #cbd5e1)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
