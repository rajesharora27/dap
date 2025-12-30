/**
 * Lazy Loading Components
 * 
 * Provides React.Suspense wrappers with skeleton loaders for
 * code-splitting and improved initial load performance.
 * 
 * @module shared/components/LazyLoad
 */

import React, { Suspense, ComponentType } from 'react';
import { Box, Skeleton, CircularProgress, Typography } from '@mui/material';

/**
 * Page skeleton loader for lazy-loaded pages.
 * Mimics the typical page layout while content loads.
 */
export const PageSkeleton: React.FC<{ title?: string }> = ({ title }) => (
  <Box sx={{ p: 3, width: '100%', maxWidth: 1400, mx: 'auto' }}>
    {/* Header skeleton */}
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="30%" height={32} />
        <Skeleton variant="text" width="50%" height={20} />
      </Box>
    </Box>

    {/* Tabs skeleton */}
    <Box sx={{ display: 'flex', gap: 2, mb: 3, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
      <Skeleton variant="rounded" width={80} height={36} />
      <Skeleton variant="rounded" width={100} height={36} />
      <Skeleton variant="rounded" width={90} height={36} />
      <Skeleton variant="rounded" width={110} height={36} />
    </Box>

    {/* Content skeleton */}
    <Box sx={{ display: 'flex', gap: 3 }}>
      {/* Sidebar skeleton */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
        <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={48} />
      </Box>

      {/* Main content skeleton */}
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={150} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={100} />
      </Box>
    </Box>
  </Box>
);

/**
 * Dashboard skeleton loader
 */
export const DashboardSkeleton: React.FC = () => (
  <Box sx={{ p: 3, width: '100%', maxWidth: 1400, mx: 'auto' }}>
    {/* Title */}
    <Skeleton variant="text" width="25%" height={40} sx={{ mb: 3 }} />

    {/* Stats cards */}
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="rounded" height={120} />
      ))}
    </Box>

    {/* Charts */}
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      <Skeleton variant="rounded" height={300} />
      <Skeleton variant="rounded" height={300} />
    </Box>
  </Box>
);

/**
 * Table skeleton loader
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Box>
    {/* Table header */}
    <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Skeleton variant="text" width="20%" height={24} />
      <Skeleton variant="text" width="30%" height={24} />
      <Skeleton variant="text" width="25%" height={24} />
      <Skeleton variant="text" width="15%" height={24} />
    </Box>

    {/* Table rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1, p: 1 }}>
        <Skeleton variant="text" width="20%" height={20} />
        <Skeleton variant="text" width="30%" height={20} />
        <Skeleton variant="text" width="25%" height={20} />
        <Skeleton variant="text" width="15%" height={20} />
      </Box>
    ))}
  </Box>
);

/**
 * Simple loading spinner with optional message
 */
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

/**
 * HOC to wrap a lazy-loaded component with Suspense and a fallback.
 * 
 * @example
 * ```tsx
 * const LazyProductsPage = withSuspense(
 *   lazy(() => import('../pages/ProductsPage')),
 *   <PageSkeleton />
 * );
 * ```
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = <PageSkeleton />
): React.FC<P> {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy component wrapper that provides consistent suspense handling.
 */
export const LazyComponent: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <PageSkeleton /> }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
);

