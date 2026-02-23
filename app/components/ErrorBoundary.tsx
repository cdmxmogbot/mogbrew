/**
 * ErrorBoundary — catches React tree crashes and reports them to /api/errors.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 *   // Custom fallback:
 *   <ErrorBoundary fallback={<p>Something broke.</p>}>
 *     <App />
 *   </ErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportClientError({
      type: 'react',
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              padding: '2rem',
              fontFamily: 'monospace',
              maxWidth: '600px',
              margin: '4rem auto',
            }}
          >
            <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong.</h2>
            <pre
              style={{
                fontSize: '0.75rem',
                opacity: 0.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ marginTop: '1rem', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────
// Global unhandled error capture (call once in main.tsx)
// ─────────────────────────────────────────────

export function installGlobalErrorHandlers(): void {
  window.onerror = (_msg, src, line, col, err) => {
    reportClientError({
      type: 'uncaught',
      message: String(_msg),
      source: src,
      line,
      col,
      stack: err?.stack,
    });
  };

  window.onunhandledrejection = (event) => {
    const err = event.reason;
    reportClientError({
      type: 'unhandledrejection',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  };
}

// ─────────────────────────────────────────────
// Fire-and-forget POST to /api/errors
// ─────────────────────────────────────────────

interface ClientErrorPayload {
  type: 'react' | 'uncaught' | 'unhandledrejection' | 'manual';
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  line?: number;
  col?: number;
  [key: string]: unknown;
}

export function reportClientError(payload: ClientErrorPayload): void {
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, ts: Date.now(), ua: navigator.userAgent }),
    keepalive: true,
  }).catch(() => {
    // swallow — error reporting must never throw
  });
}
