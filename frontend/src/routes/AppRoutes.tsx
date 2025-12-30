import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

// Pages
import { DashboardPage } from '../pages/DashboardPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SolutionsPage } from '../pages/SolutionsPage';
import { CustomersPage } from '../pages/CustomersPage';
import { DiaryPage } from '../features/my-diary'; // Imported from feature barrel
import { AboutPage } from '../pages/AboutPage';

// Admin Features
import { UserManagement } from '../features/admin/components/UserManagement'; // Assuming standard structure
import { RoleManagement } from '../features/admin/components/RoleManagement'; // Assuming standard structure
import { BackupManagementPanel } from '../features/backups/components/BackupManagementPanel';
import { ThemeSelector } from '../shared/components/ThemeSelector';

// Development Features - Barrel Import
import {
    TestPanelNew,
    DevelopmentCICDPanel,
    DevelopmentDocsPanel,
    DatabaseManagementPanel,
    LogsViewerPanel,
    BuildDeployPanel,
    EnvironmentPanel,
    APITestingPanel,
    CodeQualityPanel,
    PerformancePanel,
    GitPanel,
    TaskRunnerPanel
} from '../features/dev-tools';

import { useAuth } from '../features/auth';

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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/diary" element={<DiaryPage />} />

            {/* Products Page - Self-contained */}
            <Route path="/products" element={<ProductsPage />} />

            {/* Solutions Page */}
            <Route path="/solutions" element={<SolutionsPage />} />

            {/* Customers Page */}
            <Route path="/customers" element={<CustomersPage />} />

            {/* Admin Routes */}
            {user?.isAdmin && (
                <Route path="/admin/*" element={
                    <Routes>
                        <Route path="users" element={<UserManagement />} />
                        <Route path="roles" element={<RoleManagement />} />
                        <Route path="backup" element={<BackupManagementPanel />} />
                        <Route path="theme" element={<ThemeSelector />} />
                        <Route path="about" element={<AboutPage />} />
                    </Routes>
                } />
            )}

            {/* Development Routes */}
            {isDevelopmentMode && isAdminUser && (
                <Route path="/dev/*" element={
                    <Box sx={{ p: 3 }}>
                        <Routes>
                            <Route path="tests" element={<TestPanelNew />} />
                            <Route path="cicd" element={<DevelopmentCICDPanel />} />
                            <Route path="docs" element={<DevelopmentDocsPanel />} />
                            <Route path="database" element={<DatabaseManagementPanel />} />
                            <Route path="logs" element={<LogsViewerPanel />} />
                            <Route path="build" element={<BuildDeployPanel />} />
                            <Route path="env" element={<EnvironmentPanel />} />
                            <Route path="api" element={<APITestingPanel />} />
                            <Route path="quality" element={<CodeQualityPanel />} />
                            <Route path="performance" element={<PerformancePanel />} />
                            <Route path="git" element={<GitPanel />} />
                            <Route path="tasks" element={<TaskRunnerPanel />} />
                        </Routes>
                    </Box>
                } />
            )}

            {/* Fallback route */}
            {/* Fallback route - use simpler 404 or redirect */}
            <Route path="*" element={<Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4">404 - Page Not Found</Typography>
                <Button onClick={() => window.location.href = '/dashboard'} sx={{ mt: 2 }}>Go to Dashboard</Button>
            </Box>} />
        </Routes>
    );
};
