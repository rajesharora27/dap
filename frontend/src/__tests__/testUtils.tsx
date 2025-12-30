/**
 * Test Utilities for Frontend Tests
 * 
 * Provides common test helpers, wrappers, and mock providers.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';

// Create a default theme for tests
const defaultTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Create a mock Apollo client
const createMockApolloClient = () => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  });
};

interface WrapperProps {
  children: ReactNode;
}

/**
 * All providers wrapper for tests
 */
const AllProviders: React.FC<WrapperProps> = ({ children }) => {
  const apolloClient = createMockApolloClient();

  return (
    <BrowserRouter>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={defaultTheme}>
          {children}
        </ThemeProvider>
      </ApolloProvider>
    </BrowserRouter>
  );
};

/**
 * Custom render function that wraps components with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Render with custom Apollo mocks
 */
interface RenderWithApolloOptions extends Omit<RenderOptions, 'wrapper'> {
  mocks?: any[];
}

const renderWithApollo = (
  ui: ReactElement,
  options?: RenderWithApolloOptions
): RenderResult => {
  return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Wait for async operations
 */
const waitForLoadingToFinish = async () => {
  // Wait for any pending microtasks
  await new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * Mock user for authentication tests
 */
const mockUser = {
  userId: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN',
  isAdmin: true,
};

/**
 * Mock product for tests
 */
const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  description: 'A test product description',
  customAttrs: {},
  tags: [],
  outcomes: [],
  releases: [],
  licenses: [],
  tasks: [],
};

/**
 * Mock solution for tests
 */
const mockSolution = {
  id: 'sol-1',
  name: 'Test Solution',
  description: 'A test solution description',
  customAttrs: {},
  tags: [],
  outcomes: [],
  releases: [],
  licenses: [],
  products: [],
};

/**
 * Mock customer for tests
 */
const mockCustomer = {
  id: 'cust-1',
  name: 'Test Customer',
  description: 'A test customer description',
  products: [],
  solutions: [],
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Export custom utilities
export {
  customRender as render,
  renderWithApollo,
  AllProviders,
  waitForLoadingToFinish,
  mockUser,
  mockProduct,
  mockSolution,
  mockCustomer,
  createMockApolloClient,
};

