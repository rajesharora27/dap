import * as React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getApiUrl, isDevelopment } from '../config/frontend.config';

interface WrapperProps { children: React.ReactNode }
export const ApolloClientWrapper: React.FC<WrapperProps> = ({ children }) => {
  // Use configuration system for API URL
  const configApiUrl = getApiUrl();
  
  // For development/localhost, use the proxy. For production, use direct URL
  const httpUrl = (isDevelopment() && configApiUrl.includes('localhost')) 
    ? '/graphql' 
    : configApiUrl;

  console.log('🚀 Enhanced Apollo Client with debugging (configured connection) v4:', {
    configApiUrl,
    httpUrl,
    isDevelopment: isDevelopment(),
    timestamp: new Date().toISOString()
  });

  const client = React.useMemo(() => {
    // Error link to handle network errors and aborts gracefully
    const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
      // Ignore AbortErrors - these are expected when navigating away or logging out
      if (networkError && networkError.name === 'AbortError') {
        console.log('🔄 Request aborted (expected during navigation):', operation.operationName);
        return;
      }

      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          );
          
          // Check for authentication errors
          if (message.includes('Authentication required') || 
              message.includes('Not authenticated') ||
              message.includes('Invalid token') ||
              message.includes('User not found') ||
              message.includes('prisma.user.findUnique') && message.includes('undefined')) {
            console.warn('🔒 Authentication error detected - clearing session');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            // Reload to trigger login page
            setTimeout(() => window.location.href = '/', 100);
          }
        });
      }

      if (networkError && networkError.name !== 'AbortError') {
        console.error(`[Network error]: ${networkError}`);
      }
    });

    // Create auth link to add Authorization header
    const authLink = setContext((operation, { headers }) => {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      console.log('🔍 Apollo Request Details:', {
        operationName: operation.operationName,
        variables: operation.variables,
        query: operation.query.loc?.source.body,
        authToken: token ? 'Set' : 'Not set',
        headers: headers,
        targetUrl: httpUrl
      });

      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : ''
        }
      };
    });

    const httpLink = new HttpLink({
      uri: httpUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      fetchOptions: {
        mode: 'cors',
      },
      fetch: (uri, options) => {
        console.log('🌐 Raw Fetch Call:', {
          uri,
          method: options?.method,
          headers: options?.headers,
          body: options?.body,
          timestamp: new Date().toISOString()
        });

        return fetch(uri, options).then(async response => {
          console.log('📡 Fetch Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: [...response.headers.entries()],
            timestamp: new Date().toISOString()
          });

          if (!response.ok) {
            console.error('❌ HTTP Error Response:', {
              status: response.status,
              statusText: response.statusText,
              url: response.url
            });

            // For 400 errors, try to get the response body for debugging
            if (response.status === 400) {
              try {
                const errorBody = await response.clone().text();
                console.error('🔍 400 Error Response Body:', errorBody);
              } catch (e) {
                console.error('Could not read 400 error response body:', e);
              }
            }
          }

          return response;
        }).catch(error => {
          // Ignore AbortErrors - these are expected during navigation/logout
          if (error.name === 'AbortError') {
            console.log('🔄 Fetch aborted (expected during navigation)');
            throw error; // Still throw it so Apollo can handle it
          }
          
          console.error('🚨 Fetch Error:', error);
          throw error;
        });
      }
    });

    const apolloClient = new ApolloClient({
      link: from([errorLink, authLink, httpLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
          fetchPolicy: 'network-only' // Prevent cache issues during auth changes
        },
        query: {
          errorPolicy: 'all',
          fetchPolicy: 'network-only'
        }
      }
    });

    // Clear cache to remove any stale data (especially licenseLevel in customAttrs)
    apolloClient.clearStore().catch(err => console.warn('Cache clear warning:', err));

    console.log('✅ Enhanced Apollo Client created with auth, logging, and fresh cache');
    return apolloClient;
  }, [httpUrl]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
