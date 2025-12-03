import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './pages/App';
import { AuthProvider } from './components/AuthContext';
import { ApolloClientWrapper } from './components/ApolloClientProvider';
import { AppThemeProvider } from './theme/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
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
