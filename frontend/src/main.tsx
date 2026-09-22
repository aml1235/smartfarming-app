import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { LanguageProvider } from './i18n'

const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && 'url' in input) {
    url = (input as Request).url;
  }

  if (url.includes('/api/') && !url.includes('/login') && !url.includes('/forgot-password') && !url.includes('/reset-password')) {
    const token = localStorage.getItem('token');
    if (token) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Convert Headers object or Record back to what fetch accepts, usually Headers is fine.
      init.headers = headers;
    }
  }
  return originalFetch(input, init);
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: 'white' }}>
          <h1>React Error:</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

