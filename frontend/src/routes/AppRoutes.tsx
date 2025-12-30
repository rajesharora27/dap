/**
 * Application Routes
 * 
 * Implements code-splitting with React.lazy() for optimal bundle sizes.
 * All page components are lazy-loaded to reduce initial bundle size.
 * 
 * @module routes/AppRoutes
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

// Lazy load skeletons for suspense fallbacks
import { 
    PageSkeleton, 
    DashboardSkeleton, 
    LoadingSpinner 
} from '../shared/components/LazyLoad';

// Lazy-loaded Pages - Main Routes
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('../pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const SolutionsPage = lazy(() => import('../pages/SolutionsPage').then(m => ({ default: m.SolutionsPage })));
const CustomersPage = lazy(() => import('../pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const DiaryPage = lazy(() => import('../features/my-diary').then(m => ({ default: m.DiaryPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then(m => ({ default: m.AboutPage })));

// Lazy-loaded Admin Features
const UserManagement = lazy(() => import('../features/admin/components/UserManagement').then(m => ({ default: m.UserManagement })));
const RoleManagement = lazy(() => import('../features/admin/components/RoleManagement').then(m => ({ default: m.RoleManagement })));
const BackupManagementPanel = lazy(() => import('../features/backups/components/BackupManagementPanel').then(m => ({ default: m.BackupManagementPanel })));
const ThemeSelector = lazy(() => import('../shared/components/ThemeSelector').then(m => ({ default: m.ThemeSelector })));

// Lazy-loaded Development Features
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

import { useAuth } from '../features/auth';

/**
 * Suspense wrapper component for consistent lazy loading
 */
const SuspenseRoute: React.FC<{ 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
}> = ({ children, fallback = <PageSkeleton /> }) => (
    <Suspense fallback={fallback}>{children}</Suspense>
);

export const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    // Check dev mode
    const devToolsEnabled =
        typeof import.meta !== 'undefined' &&
        typeof import.meta.env !== 'undefined' &&
        import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

    const isDevelopmentMode =
        devToolsEnabled &&
        import.meta.env.MODE !== 'production' &&
        (import.meta.env.DEV || import.meta.env.MODE === 'development');

    const isAdminUser = user?.isAdmin || user?.role === 'ADMIN';

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Main Routes - Lazy Loaded with Suspense */}
            <Route 
                path="/dashboard" 
                element={
                    <SuspenseRoute fallback={<DashboardSkeleton />}>
                        <DashboardPage />
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

            {/* Admin Routes - Lazy Loaded */}
            {user?.isAdmin && (
                <Route path="/admin/*" element={
                    <Routes>
                        <Route path="users" element={
                            <SuspenseRoute>
                                <UserManagement />
                            </SuspenseRoute>
                        } />
                        <Route path="roles" element={
                            <SuspenseRoute>
                                <RoleManagement />
                            </SuspenseRoute>
                        } />
                        <Route path="backup" element={
                            <SuspenseRoute>
                                <BackupManagementPanel />
                            </SuspenseRoute>
                        } />
                        <Route path="theme" element={
                            <SuspenseRoute fallback={<LoadingSpinner message="Loading themes..." />}>
                                <ThemeSelector />
                            </SuspenseRoute>
                        } />
                        <Route path="about" element={
                            <SuspenseRoute>
                                <AboutPage />
                            </SuspenseRoute>
                        } />
                    </Routes>
                } />
            )}

            {/* Development Routes - Lazy Loaded */}
            {isDevelopmentMode && isAdminUser && (
                <Route path="/dev/*" element={
                    <Box sx={{ p: 3 }}>
                        <Routes>
                            <Route path="tests" element={
                                <SuspenseRoute fallback={<LoadingSpinner message="Loading test panel..." />}>
                                    <TestPanelNew />
                                </SuspenseRoute>
                            } />
                            <Route path="cicd" element={
                                <SuspenseRoute>
                                    <DevelopmentCICDPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="docs" element={
                                <SuspenseRoute>
                                    <DevelopmentDocsPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="database" element={
                                <SuspenseRoute>
                                    <DatabaseManagementPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="logs" element={
                                <SuspenseRoute>
                                    <LogsViewerPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="build" element={
                                <SuspenseRoute>
                                    <BuildDeployPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="env" element={
                                <SuspenseRoute>
                                    <EnvironmentPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="api" element={
                                <SuspenseRoute>
                                    <APITestingPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="quality" element={
                                <SuspenseRoute>
                                    <CodeQualityPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="performance" element={
                                <SuspenseRoute>
                                    <PerformancePanel />
                                </SuspenseRoute>
                            } />
                            <Route path="git" element={
                                <SuspenseRoute>
                                    <GitPanel />
                                </SuspenseRoute>
                            } />
                            <Route path="tasks" element={
                                <SuspenseRoute>
                                    <TaskRunnerPanel />
                                </SuspenseRoute>
                            } />
                        </Routes>
                    </Box>
                } />
            )}

            {/* Fallback route */}
            <Route path="*" element={
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h4">404 - Page Not Found</Typography>
                    <Button onClick={() => window.location.href = '/dashboard'} sx={{ mt: 2 }}>
                        Go to Dashboard
                    </Button>
                </Box>
            } />
        </Routes>
    );
};
