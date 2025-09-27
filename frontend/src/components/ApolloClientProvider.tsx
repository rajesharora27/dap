import * as React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

interface WrapperProps { children: React.ReactNode }
export const ApolloClientWrapper: React.FC<WrapperProps> = ({ children }) => {
  // Use Vite proxy to avoid CORS issues
  const httpUrl = '/graphql'; // Use proxy instead of direct connection

  console.log('🚀 Enhanced Apollo Client with debugging (proxy connection) v3:', {
    httpUrl,
    timestamp: new Date().toISOString()
  });

  // Create auth link to add Authorization header
  const authLink = setContext((operation, { headers }) => {
    // Always use 'admin' token for fallback auth
    const token = 'admin';

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
        authorization: token || ''
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
        console.error('🚨 Fetch Error:', error);
        throw error;
      });
    }
  });

  const client = React.useMemo(() => {
    const apolloClient = new ApolloClient({
      link: from([authLink, httpLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all'
        },
        query: {
          errorPolicy: 'all'
        }
      }
    });

    console.log('✅ Enhanced Apollo Client created with auth and logging');
    return apolloClient;
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
