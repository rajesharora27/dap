# DAP Frontend Architecture

**Version:** 3.0.0  
**Last Updated:** December 30, 2025  
**Framework:** React 19 + TypeScript  
**Build Tool:** Vite 6.x

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Feature Modules](#feature-modules)
4. [Shared Components](#shared-components)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [Theming](#theming)
8. [GraphQL Integration](#graphql-integration)
9. [Custom Hooks](#custom-hooks)
10. [Testing](#testing)
11. [Performance](#performance)
12. [Best Practices](#best-practices)

---

## Overview

DAP frontend follows a **Feature-Based Modular Architecture** where:

- Each feature is self-contained with its own components, hooks, and GraphQL operations
- Shared code lives in `shared/` directory
- Pages compose features into full views
- Apollo Client manages server state
- React Context manages UI state

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 6.x | Build Tool |
| Apollo Client | 3.x | GraphQL Client |
| Material-UI | 6.x | Component Library |
| DnD Kit | 6.x | Drag and Drop |
| React Router | 7.x | Routing |

### Statistics

| Metric | Count |
|--------|-------|
| Feature Modules | 22 |
| Shared Components | 20+ |
| Custom Hooks | 30+ |
| Theme Variants | 16 |
| Pages | 6 |

---

## Project Structure

```
frontend/src/
├── main.tsx                    # Application entry point
├── vite-env.d.ts              # Vite type definitions
│
├── config/                     # Application configuration
│   └── frontend.config.ts
│
├── features/                   # Feature modules (22 features)
│   ├── admin/                 # User & role management
│   ├── adoption-plans/        # Customer adoption tracking
│   ├── ai-assistant/          # AI chat integration
│   ├── audit/                 # Audit logs & change tracking
│   ├── auth/                  # Authentication
│   ├── backups/               # Backup management
│   ├── customers/             # Customer management
│   ├── data-management/       # Data import/export
│   ├── dev-tools/             # Development utilities
│   ├── import-wizard/         # Excel import
│   ├── my-diary/              # Personal notes
│   ├── product-licenses/      # License management
│   ├── product-outcomes/      # Outcome management
│   ├── product-releases/      # Release management
│   ├── products/              # Product management
│   ├── search/                # Global search
│   ├── solutions/             # Solution management
│   ├── tags/                  # Tagging system
│   ├── tasks/                 # Task management
│   └── telemetry/             # Telemetry tracking
│
├── pages/                      # Page components
│   ├── App.tsx                # Main app shell
│   ├── DashboardPage.tsx      # Dashboard
│   ├── ProductsPage.tsx       # Products view
│   ├── SolutionsPage.tsx      # Solutions view
│   ├── CustomersPage.tsx      # Customers view
│   └── AboutPage.tsx          # About page
│
├── providers/                  # React context providers
│   └── ApolloClientProvider.tsx
│
├── routes/                     # Routing configuration
│   └── AppRoutes.tsx          # Route definitions with lazy loading
│
├── shared/                     # Shared utilities
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Shared custom hooks
│   ├── services/              # External services
│   ├── theme/                 # Theme utilities
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Utility functions
│   └── validation/            # Form validation
│
├── theme/                      # Theme configuration
│   ├── ThemeProvider.tsx      # Theme context
│   └── themes.ts              # 16 theme definitions
│
├── generated/                  # Auto-generated code
│   └── graphql.ts             # GraphQL types
│
└── __tests__/                  # Test files
    ├── components/
    ├── hooks/
    └── e2e/
```

---

## Feature Modules

### Structure Pattern

Each feature follows a consistent structure:

```
features/products/
├── components/                 # Feature-specific components
│   ├── ProductDialog.tsx      # Product edit dialog
│   ├── ProductCard.tsx        # Product display card
│   ├── ProductsPanel.tsx      # Products list panel
│   └── ...
├── context/                    # Feature context (if needed)
│   └── ProductContext.tsx
├── graphql/                    # GraphQL operations
│   ├── queries.ts             # GraphQL queries
│   ├── mutations.ts           # GraphQL mutations
│   └── index.ts               # Barrel export
├── hooks/                      # Feature-specific hooks
│   ├── useProductData.ts
│   ├── useProductEditing.ts
│   └── useProductMutations.ts
├── types.ts                    # Feature types
└── index.ts                    # Public API (barrel export)
```

### Barrel Exports

Each feature exposes a clean public API via `index.ts`:

```typescript
// features/products/index.ts
export { ProductDialog } from './components/ProductDialog';
export { ProductsPanel } from './components/ProductsPanel';
export { useProductData } from './hooks/useProductData';
export { useProductEditing } from './hooks/useProductEditing';
export type { Product, ProductInput } from './types';
```

### Feature Independence

Features should:
- ✅ Import from `shared/`
- ✅ Import from their own directories
- ✅ Import types from other features
- ❌ NOT import components from other features (use shared)
- ❌ NOT have circular dependencies

---

## Shared Components

### Component Categories

```
shared/components/
├── dialogs/
│   ├── ConfirmDialog.tsx      # Confirmation dialog
│   ├── CustomAttributeDialog.tsx
│   └── HelpDialog.tsx
├── inline-editors/            # Inline editing components
│   ├── InlineEditableText.tsx
│   ├── InlineSelect.tsx
│   └── index.ts
├── custom-attributes/         # Custom attribute editors
├── layout/
│   ├── Breadcrumbs.tsx
│   └── ErrorBoundary.tsx
├── data-display/
│   ├── TimeAgo.tsx
│   └── FAIcon.tsx
├── tables/
│   ├── ResizableTableCell.tsx
│   ├── SortableHandle.tsx
│   └── ColumnVisibilityToggle.tsx
└── loading/
    └── LazyLoad.tsx           # Lazy loading with skeletons
```

### Component Pattern

```tsx
// shared/components/ConfirmDialog.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

## State Management

### State Management Strategy

| State Type | Solution | Example |
|------------|----------|---------|
| Server State | Apollo Client Cache | Products, Customers |
| UI State | React useState/useReducer | Dialog open, tab index |
| Feature State | React Context | Selected product |
| Form State | Controlled components | Input values |
| URL State | React Router | Current page, filters |

### Apollo Client Cache

```typescript
// providers/ApolloClientProvider.tsx
const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Product: {
        keyFields: ['id'],
      },
    },
  }),
});
```

### Feature Context Pattern

```typescript
// features/products/context/ProductContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProductContextValue {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <ProductContext.Provider value={{
      selectedProductId,
      setSelectedProductId,
      isEditing,
      setIsEditing,
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within ProductProvider');
  }
  return context;
};
```

---

## Routing

### Route Configuration

```typescript
// routes/AppRoutes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LazyLoad } from '../shared/components/LazyLoad';

// Lazy-loaded pages
const LazyDashboardPage = () => import('../pages/DashboardPage');
const LazyProductsPage = () => import('../pages/ProductsPage');
const LazySolutionsPage = () => import('../pages/SolutionsPage');
const LazyCustomersPage = () => import('../pages/CustomersPage');

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<LazyLoad component={LazyDashboardPage} type="dashboard" />} />
      <Route path="/products" element={<LazyLoad component={LazyProductsPage} />} />
      <Route path="/solutions" element={<LazyLoad component={LazySolutionsPage} />} />
      <Route path="/customers" element={<LazyLoad component={LazyCustomersPage} />} />
      
      {/* Admin routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
```

### Code Splitting

All pages are lazy-loaded using `React.lazy()` and `Suspense`:

```typescript
// shared/components/LazyLoad.tsx
export const LazyLoad: React.FC<LazyLoadProps> = ({ component, type = 'page' }) => {
  const LazyComponent = lazy(component);
  
  return (
    <Suspense fallback={<LoadingSkeleton type={type} />}>
      <LazyComponent />
    </Suspense>
  );
};
```

---

## Theming

### Theme System

DAP includes 16 professionally designed themes:

```typescript
// theme/themes.ts
export const themes = {
  // Light themes
  light: createLightTheme(),
  ocean: createOceanTheme(),
  forest: createForestTheme(),
  sunset: createSunsetTheme(),
  
  // Dark themes
  dark: createDarkTheme(),
  midnight: createMidnightTheme(),
  cyberpunk: createCyberpunkTheme(),
  
  // ... 9 more themes
};
```

### Theme Provider

```typescript
// theme/ThemeProvider.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { themes } from './themes';

interface ThemeContextValue {
  themeName: string;
  setThemeName: (name: string) => void;
  isDarkMode: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState(() => 
    localStorage.getItem('theme') || 'light'
  );

  const theme = useMemo(() => themes[themeName] || themes.light, [themeName]);
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, isDarkMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
```

### Using Theme

```tsx
import { useTheme } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      borderRadius: theme.shape.borderRadius,
    }}>
      Content
    </Box>
  );
};
```

---

## GraphQL Integration

### Query Pattern

```typescript
// features/products/graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query Products($first: Int, $after: String) {
    products(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          description
          statusPercent
          tags { id name color }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_PRODUCT = gql`
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      description
      tasks { id name weight }
      licenses { id name level }
      outcomes { id name }
      releases { id name level }
    }
  }
`;
```

### Mutation Pattern

```typescript
// features/products/graphql/mutations.ts
import { gql } from '@apollo/client';

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;
```

### Using Queries

```typescript
// features/products/hooks/useProductData.ts
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS, GET_PRODUCT } from '../graphql/queries';

export const useProducts = () => {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    products: data?.products?.edges?.map(e => e.node) ?? [],
    loading,
    error,
    refetch,
  };
};

export const useProduct = (id: string) => {
  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });

  return {
    product: data?.product,
    loading,
    error,
  };
};
```

---

## Custom Hooks

### Common Hook Patterns

```typescript
// features/products/hooks/useProductEditing.ts
import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_PRODUCT, DELETE_PRODUCT } from '../graphql/mutations';
import { GET_PRODUCTS } from '../graphql/queries';

export const useProductEditing = (productId: string) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  });

  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  });

  const handleUpdate = useCallback(async (input: ProductInput) => {
    try {
      await updateProduct({ variables: { id: productId, input } });
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }, [productId, updateProduct]);

  const handleDelete = useCallback(async () => {
    await deleteProduct({ variables: { id: productId } });
  }, [productId, deleteProduct]);

  return {
    isEditing,
    setIsEditing,
    handleUpdate,
    handleDelete,
    updating,
    deleting,
  };
};
```

### Shared Hooks

```typescript
// shared/hooks/useResizableColumns.ts
export const useResizableColumns = (initialWidths: Record<string, number>) => {
  const [columnWidths, setColumnWidths] = useState(initialWidths);

  const handleResize = useCallback((columnId: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [columnId]: width }));
  }, []);

  return { columnWidths, handleResize };
};
```

---

## Testing

### Test Structure

```
__tests__/
├── components/
│   └── shared/
│       └── ConfirmDialog.test.tsx
├── hooks/
│   └── useProductEditing.test.ts
└── e2e/
    └── tags-filtering.test.tsx
```

### Component Testing

```typescript
// __tests__/components/shared/ConfirmDialog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  it('renders title and message', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });
});
```

### Hook Testing

```typescript
// __tests__/hooks/useProductEditing.test.ts
import { renderHook, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useProductEditing } from '../../features/products/hooks/useProductEditing';

const mocks = [/* GraphQL mocks */];

describe('useProductEditing', () => {
  it('handles update correctly', async () => {
    const { result } = renderHook(
      () => useProductEditing('product-1'),
      { wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider> }
    );

    await act(async () => {
      await result.current.handleUpdate({ name: 'Updated' });
    });

    expect(result.current.isEditing).toBe(false);
  });
});
```

---

## Performance

### Code Splitting

Vite manual chunks configuration:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui')) return 'vendor-mui';
            if (id.includes('@apollo')) return 'vendor-apollo';
            if (id.includes('react')) return 'vendor-react';
          }
        },
      },
    },
  },
});
```

### Lazy Loading

All pages and heavy components use `React.lazy()`:

```tsx
const ProductDialog = lazy(() => import('./ProductDialog'));
```

### Memoization

```tsx
// Use React.memo for expensive renders
export const ProductCard = React.memo<ProductCardProps>(({ product }) => {
  return (
    <Card>
      <CardContent>{product.name}</CardContent>
    </Card>
  );
});

// Use useMemo for expensive calculations
const sortedProducts = useMemo(() => 
  products.sort((a, b) => a.name.localeCompare(b.name)),
  [products]
);

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  setSelected(product.id);
}, [product.id]);
```

---

## Best Practices

### Component Guidelines

1. **Single Responsibility**: One component, one purpose
2. **Props Interface**: Always define TypeScript interfaces
3. **Default Props**: Use default values for optional props
4. **Error Boundaries**: Wrap major sections
5. **Loading States**: Always handle loading/error states

### State Guidelines

1. **Lift State Minimally**: Keep state as local as possible
2. **Derive State**: Compute values from state, don't duplicate
3. **Apollo First**: Use Apollo cache for server data
4. **Context Sparingly**: Only for truly global UI state

### Performance Guidelines

1. **Lazy Load Routes**: All pages lazy-loaded
2. **Memoize Expensive**: Use memo/useMemo/useCallback
3. **Virtualize Lists**: Use virtualization for long lists
4. **Optimize Images**: Use appropriate formats and sizes

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductDialog.tsx` |
| Hooks | camelCase, use- prefix | `useProductData.ts` |
| Utilities | camelCase | `progressUtils.ts` |
| Types | PascalCase | `Product`, `ProductInput` |
| Tests | .test.tsx/.test.ts | `ProductDialog.test.tsx` |

---

*For API usage, see [API_REFERENCE.md](API_REFERENCE.md)*  
*For GraphQL schema, see [GRAPHQL_SCHEMA.md](GRAPHQL_SCHEMA.md)*

