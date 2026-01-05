/**
 * Application Routes
 * 
 * Implements URL-based routing with React Router v6.
 * Uses code-splitting with React.lazy() for optimal bundle sizes.
 * All page components are lazy-loaded to reduce initial bundle size.
 * 
 * Route Structure:
 * - /dashboard         - Main dashboard (default)
 * - /products          - Products management
 * - /solutions         - Solutions management  
 * - /customers         - Customers management
 * - /diary             - Personal diary
 * - /admin/*           - Admin routes (protected)
 * - /dev/*             - Development tools (dev mode only)
 * 
 * @module routes/AppRoutes
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

// Lazy load skeletons for suspense fallbacks
import {
    PageSkeleton,
    DashboardSkeleton,
    LoadingSpinner
} from '../shared/components/LazyLoad';

import { useAuth } from '../features/auth';

// =============================================================================
// LAZY-LOADED PAGE COMPONENTS
// =============================================================================

// Main Routes
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('../pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const SolutionsPage = lazy(() => import('../pages/SolutionsPage').then(m => ({ default: m.SolutionsPage })));
const CustomersPage = lazy(() => import('../pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const DiaryPage = lazy(() => import('../features/my-diary').then(m => ({ default: m.DiaryPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then(m => ({ default: m.AboutPage })));

// Admin Features
const UserManagement = lazy(() => import('../features/admin/components/UserManagement').then(m => ({ default: m.UserManagement })));
const RoleManagement = lazy(() => import('../features/admin/components/RoleManagement').then(m => ({ default: m.RoleManagement })));
const BackupManagementPanel = lazy(() => import('../features/backups/components/BackupManagementPanel').then(m => ({ default: m.BackupManagementPanel })));
const ThemeSelector = lazy(() => import('../shared/components/ThemeSelector').then(m => ({ default: m.ThemeSelector })));

// Development Features
const TestPanelNew = lazy(() => import('../features/dev-tools').then(m => ({ default: m.TestPanelNew })));
const DevelopmentCICDPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.DevelopmentCICDPanel })));
const DevelopmentDocsPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.DevelopmentDocsPanel })));
const DatabaseManagementPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.DatabaseManagementPanel })));
const LogsViewerPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.LogsViewerPanel })));
const BuildDeployPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.BuildDeployPanel })));
const EnvironmentPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.EnvironmentPanel })));
const APITestingPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.APITestingPanel })));
const CodeQualityPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.CodeQualityPanel })));
const PerformancePanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.PerformancePanel })));
const GitPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.GitPanel })));
const TaskRunnerPanel = lazy(() => import('../features/dev-tools').then(m => ({ default: m.TaskRunnerPanel })));

// =============================================================================
// ROUTE GUARD COMPONENTS
// =============================================================================

/**
 * Suspense wrapper for consistent lazy loading with fallback
 */
const SuspenseRoute: React.FC<{
    children: React.ReactNode;
    fallback?: React.ReactNode;
}> = ({ children, fallback = <PageSkeleton /> }) => (
    <Suspense fallback={fallback}>{children}</Suspense>
);

/**
 * Protected route wrapper that redirects non-admin users
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const isAdmin = user?.isAdmin || user?.role === 'ADMIN';
    
    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
};

/**
 * Development route wrapper that only renders in dev mode
 */
const DevRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    
    const devToolsEnabled =
        typeof import.meta !== 'undefined' &&
        typeof import.meta.env !== 'undefined' &&
        import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

    const isDevelopmentMode =
        devToolsEnabled &&
        import.meta.env.MODE !== 'production' &&
        (import.meta.env.DEV || import.meta.env.MODE === 'development');

    const isAdminUser = user?.isAdmin || user?.role === 'ADMIN';

    if (!isDevelopmentMode || !isAdminUser) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

/**
 * 404 Not Found page component
 * Uses React Router navigation to respect basename
 */
const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();
    
    return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>404 - Page Not Found</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                The page you're looking for doesn't exist or you don't have access to it.
            </Typography>
            <Button 
                variant="contained" 
                onClick={() => navigate('/dashboard')}
            >
                Go to Dashboard
            </Button>
        </Box>
    );
};

// =============================================================================
// SCROLL RESTORATION
// =============================================================================

/**
 * Scroll position storage keyed by pathname
 * Preserves scroll position when navigating back to a page
 */
const scrollPositions = new Map<string, number>();

/**
 * ScrollRestoration Component
 * 
 * Handles scroll behavior on route changes:
 * - Saves scroll position before leaving a page
 * - Restores scroll position when returning to a page (via back button)
 * - Scrolls to top for new forward navigations
 * 
 * Uses sessionStorage-like in-memory storage for scroll positions
 */
const ScrollRestoration: React.FC = () => {
    const location = useLocation();
    const prevPathRef = React.useRef<string>(location.pathname);
    
    useEffect(() => {
        // Save scroll position of previous page before route change
        const prevPath = prevPathRef.current;
        if (prevPath !== location.pathname) {
            scrollPositions.set(prevPath, window.scrollY);
        }
        
        // Check if we have a saved position for this route (back navigation)
        const savedPosition = scrollPositions.get(location.pathname);
        
        // Small delay to let DOM render before scrolling
        const timeoutId = setTimeout(() => {
            if (savedPosition !== undefined && window.history.state?.idx !== undefined) {
                // Returning to a previously visited page - restore scroll
                window.scrollTo(0, savedPosition);
            } else {
                // New navigation - scroll to top
                window.scrollTo(0, 0);
            }
        }, 0);
        
        // Update ref for next navigation
        prevPathRef.current = location.pathname;
        
        return () => clearTimeout(timeoutId);
    }, [location.pathname]);
    
    return null;
};

// =============================================================================
// MAIN ROUTES COMPONENT
// =============================================================================

/**
 * Main application routes.
 * 
 * Uses flat route structure with guard wrappers for protected routes.
 * All routes are lazy-loaded for optimal bundle splitting.
 */
export const AppRoutes: React.FC = () => {
    return (
        <>
            {/* Scroll Restoration - preserves scroll position on back navigation */}
            <ScrollRestoration />
            
            <Routes>
            {/* Default redirect: / -> /dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* =================================================================
                MAIN ROUTES - Available to all authenticated users
            ================================================================= */}
            
            <Route
                path="/dashboard"
                element={
                    <SuspenseRoute fallback={<DashboardSkeleton />}>
                        <DashboardPage />
                    </SuspenseRoute>
                }
            />

            <Route
                path="/products"
                element={
                    <SuspenseRoute>
                        <ProductsPage />
                    </SuspenseRoute>
                }
            />

            <Route
                path="/solutions"
                element={
                    <SuspenseRoute>
                        <SolutionsPage />
                    </SuspenseRoute>
                }
            />

            <Route
                path="/customers"
                element={
                    <SuspenseRoute>
                        <CustomersPage />
                    </SuspenseRoute>
                }
            />

            <Route
                path="/diary"
                element={
                    <SuspenseRoute>
                        <DiaryPage />
                    </SuspenseRoute>
                }
            />

            {/* =================================================================
                ADMIN ROUTES - Protected, requires admin role
            ================================================================= */}
            
            <Route
                path="/admin/users"
                element={
                    <AdminRoute>
                        <SuspenseRoute>
                            <UserManagement />
                        </SuspenseRoute>
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/roles"
                element={
                    <AdminRoute>
                        <SuspenseRoute>
                            <RoleManagement />
                        </SuspenseRoute>
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/backup"
                element={
                    <AdminRoute>
                        <SuspenseRoute>
                            <BackupManagementPanel />
                        </SuspenseRoute>
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/theme"
                element={
                    <AdminRoute>
                        <SuspenseRoute fallback={<LoadingSpinner message="Loading themes..." />}>
                            <ThemeSelector />
                        </SuspenseRoute>
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/about"
                element={
                    <AdminRoute>
                        <SuspenseRoute>
                            <AboutPage />
                        </SuspenseRoute>
                    </AdminRoute>
                }
            />

            {/* Admin default redirect */}
            <Route 
                path="/admin" 
                element={<Navigate to="/admin/users" replace />} 
            />

            {/* =================================================================
                DEVELOPMENT ROUTES - Dev mode only, requires admin
            ================================================================= */}

            <Route
                path="/dev/tests"
                element={
                    <DevRoute>
                        <SuspenseRoute fallback={<LoadingSpinner message="Loading test panel..." />}>
                            <TestPanelNew />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/cicd"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <DevelopmentCICDPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/docs"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <DevelopmentDocsPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/database"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <DatabaseManagementPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/logs"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <LogsViewerPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/build"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <BuildDeployPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/env"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <EnvironmentPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/api"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <APITestingPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/quality"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <CodeQualityPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/performance"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <PerformancePanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/git"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <GitPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            <Route
                path="/dev/tasks"
                element={
                    <DevRoute>
                        <SuspenseRoute>
                            <TaskRunnerPanel />
                        </SuspenseRoute>
                    </DevRoute>
                }
            />

            {/* Dev default redirect */}
            <Route 
                path="/dev" 
                element={<Navigate to="/dev/tests" replace />} 
            />

            {/* =================================================================
                FALLBACK - 404 Not Found
            ================================================================= */}
            
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </>
    );
};
