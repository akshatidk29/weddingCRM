import { Component } from 'react';

/**
 * Global React Error Boundary
 * Catches render-phase crashes and shows a styled fallback UI
 * instead of a white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf9f7',
          fontFamily: "'Inter', sans-serif",
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#1c1917',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#faf9f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2rem',
              fontWeight: 500,
              color: '#1c1917',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}>
              Something went wrong
            </h1>

            <p style={{
              color: '#78716c',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              An unexpected error occurred. Don't worry — your data is safe.
              Please try reloading the page.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#1c1917',
                  color: '#faf9f7',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => e.target.style.backgroundColor = '#292524'}
                onMouseOut={e => e.target.style.backgroundColor = '#1c1917'}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'transparent',
                  color: '#78716c',
                  border: '1px solid #d6d3d1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.target.style.borderColor = '#a8a29e'; e.target.style.color = '#1c1917'; }}
                onMouseOut={e => { e.target.style.borderColor = '#d6d3d1'; e.target.style.color = '#78716c'; }}
              >
                Go to Dashboard
              </button>
            </div>

            {/* Debug info (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '32px',
                textAlign: 'left',
                padding: '12px',
                backgroundColor: '#f5f5f4',
                borderRadius: '8px',
                border: '1px solid #e7e5e4',
              }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#a8a29e', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Error Details
                </summary>
                <pre style={{ fontSize: '11px', color: '#78716c', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '8px' }}>
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
