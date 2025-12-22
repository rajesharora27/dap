import * as React from 'react';

// Polyfill for crypto.randomUUID in insecure contexts
if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.randomUUID)) {
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  // Simple UUID v4 polyfill
  window.crypto.randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    ) as `${string}-${string}-${string}-${string}-${string}`;
  };
  console.log('[Polyfill] Added window.crypto.randomUUID support for insecure context');
}

import * as ReactDOM from 'react-dom/client';
import App from './pages/App';
import { AuthProvider } from './components/AuthContext';
import { ApolloClientWrapper } from './components/ApolloClientProvider';
import { AppThemeProvider } from './theme/ThemeProvider';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { initSentry } from './lib/sentry';

// Initialize Sentry for error tracking
initSentry();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ApolloClientWrapper>
          <AppThemeProvider>
            <App />
          </AppThemeProvider>
        </ApolloClientWrapper>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
