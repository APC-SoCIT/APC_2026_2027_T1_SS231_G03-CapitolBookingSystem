import { Component } from "react";
import type { ReactNode } from "react";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-shell">
        <header className="site-header">
          <div className="site-header__inner">
            <a className="brand" href="/" aria-label="Capitol Restaurant home">
              <img
                className="brand__logo"
                src="/brand/wordmark-beige-600.png"
                alt="Capitol"
              />
              <span className="brand__meta">Since 1940 · Pasay City</span>
            </a>
          </div>
        </header>
        <main className="app-main">
          <div className="placeholder-page" role="alert">
            <h1>Something went wrong on our end</h1>
            <p>We're working on it. Please try again in a few minutes.</p>
            <div className="error-actions">
              <button
                type="button"
                className="button button--red"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
              <a className="button button--red" href="/">
                Back to home
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
