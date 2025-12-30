import * as React from 'react';
import { Breadcrumbs as MUIBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { ChevronRight } from '@mui/icons-material';

const breadcrumbNameMap: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/solutions': 'Solutions',
    '/customers': 'Customers',
    '/diary': 'My Diary',
    '/admin': 'Admin',
    '/admin/users': 'Users',
    '/admin/roles': 'Roles',
    '/admin/backup': 'Backup & Restore',
    '/admin/theme': 'Theme',
    '/admin/about': 'About',
    '/dev': 'Development Tools',
    '/dev/tests': 'Tests',
    '/dev/cicd': 'CI/CD',
    '/dev/docs': 'Docs',
    '/dev/database': 'Database',
    '/dev/logs': 'Logs',
    '/dev/build': 'Build',
    '/dev/env': 'Environment',
    '/dev/api': 'API',
    '/dev/quality': 'Code Quality',
    '/dev/performance': 'Performance',
    '/dev/git': 'Git',
    '/dev/tasks': 'Tasks',
};

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on dashboard home if it's just "Home"
    if (location.pathname === '/' || location.pathname === '/dashboard') {
        return null;
    }

    return (
        <Box sx={{ mb: 2 }}>
            <MUIBreadcrumbs
                separator={<ChevronRight fontSize="inherit" sx={{ opacity: 0.5 }} />}
                aria-label="breadcrumb"
                sx={{
                    '& .MuiBreadcrumbs-li': { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05rem' },
                    '& .MuiTypography-root': { fontSize: '0.75rem', fontWeight: 700 }
                }}
            >
                <Link
                    component={RouterLink}
                    underline="hover"
                    color="inherit"
                    to="/"
                    sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}
                >
                    HOME
                </Link>
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const name = breadcrumbNameMap[to] || value;

                    return last ? (
                        <Typography color="primary" key={to} sx={{ color: 'primary.main' }}>
                            {name.toUpperCase()}
                        </Typography>
                    ) : (
                        <Link
                            component={RouterLink}
                            underline="hover"
                            color="inherit"
                            to={to}
                            key={to}
                            sx={{ opacity: 0.7 }}
                        >
                            {name.toUpperCase()}
                        </Link>
                    );
                })}
            </MUIBreadcrumbs>
        </Box>
    );
};
