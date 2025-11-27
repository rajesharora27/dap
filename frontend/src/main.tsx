import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './pages/App';
import { AuthProvider } from './components/AuthContext';
import { ApolloClientWrapper } from './components/ApolloClientProvider';
import { AppThemeProvider } from './theme/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ApolloClientWrapper>
        <AppThemeProvider>
        <App />
        </AppThemeProvider>
      </ApolloClientWrapper>
    </AuthProvider>
  </React.StrictMode>
);
