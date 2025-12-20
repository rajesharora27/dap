import React from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    LinearProgress,
    Chip,
    useTheme,
    alpha,
    CircularProgress,
    Stack
} from '@mui/material';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../components/AuthContext';
// Flat icons from Font Awesome
import {
    Inventory2 as ProductIcon,
    Lightbulb as SolutionIcon,
    Business as CustomerIcon,
    CheckCircle,
    Schedule,
    TrendingUp,
    Assignment,
    Folder,
    Star
} from '../components/common/FAIcon';

// GraphQL Queries
const DASHBOARD_DATA = gql`
  query DashboardData {
    products {
      edges {
        node {
          id
          name
          statusPercent
        }
      }
    }
    customers {
      id
      name
      products {
        id
      }
      solutions {
        id
      }
    }
    solutions {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

// Minimal stat card component
interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'box-shadow 0.2s',
                '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(color, 0.15)}`
                }
            }}
        >
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color, 0.1),
                    color: color,
                }}
            >
                {icon}
            </Box>
            <Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.7rem'
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        lineHeight: 1.2
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </Paper>
    );
};

export const DashboardPage = () => {
    const theme = useTheme();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { loading, error, data } = useQuery(DASHBOARD_DATA, {
        skip: !isAuthenticated,
        fetchPolicy: 'cache-and-network'
    });

    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (loading) return <LinearProgress />;
    if (error) return <Typography color="error">Error loading dashboard: {error.message}</Typography>;

    const products = data?.products?.edges?.map((e: any) => e.node) || [];
    const customers = data?.customers || [];
    const solutions = data?.solutions?.edges?.map((e: any) => e.node) || [];

    const totalCustomers = customers.length;
    const totalProducts = products.length;
    const totalSolutions = solutions.length;
    const avgReadiness = Math.round(products.reduce((acc: number, p: any) => acc + (p.statusPercent || 0), 0) / (totalProducts || 1));

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Stats Row */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        label="Products"
                        value={totalProducts}
                        icon={<ProductIcon fontSize="medium" />}
                        color={theme.palette.primary.main}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        label="Solutions"
                        value={totalSolutions}
                        icon={<SolutionIcon fontSize="medium" />}
                        color={theme.palette.warning.main}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        label="Customers"
                        value={totalCustomers}
                        icon={<CustomerIcon fontSize="medium" />}
                        color={theme.palette.success.main}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        label="Avg Readiness"
                        value={`${avgReadiness}%`}
                        icon={<TrendingUp fontSize="medium" />}
                        color={theme.palette.info.main}
                    />
                </Grid>
            </Grid>

            {/* Main Content */}
            <Grid container spacing={3}>
                {/* Value Proposition */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            height: '100%'
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
                            About DAP
                        </Typography>

                        <Stack spacing={2.5}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Assignment sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Single Source of Truth
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Centrally define all adoption components for products and solutions.
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Consistent Adoption
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Provides a unified reference for all stakeholders to ensure repeatable success.
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <TrendingUp sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Accelerated Time-to-Value
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Streamline implementation methodology for predictable outcomes.
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Quick Links */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            height: '100%'
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
                            Quick Access
                        </Typography>

                        <Stack spacing={1}>
                            <Paper
                                component="a"
                                href="/products"
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 1.5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    transition: 'background-color 0.15s',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.08)
                                    }
                                }}
                            >
                                <ProductIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Products</Typography>
                                    <Typography variant="caption" color="text.secondary">Configure adoption tasks</Typography>
                                </Box>
                            </Paper>

                            <Paper
                                component="a"
                                href="/solutions"
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 1.5,
                                    bgcolor: alpha(theme.palette.warning.main, 0.04),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    transition: 'background-color 0.15s',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.warning.main, 0.08)
                                    }
                                }}
                            >
                                <SolutionIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Solutions</Typography>
                                    <Typography variant="caption" color="text.secondary">Manage solution bundles</Typography>
                                </Box>
                            </Paper>

                            <Paper
                                component="a"
                                href="/customers"
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 1.5,
                                    bgcolor: alpha(theme.palette.success.main, 0.04),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    transition: 'background-color 0.15s',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.success.main, 0.08)
                                    }
                                }}
                            >
                                <CustomerIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Customers</Typography>
                                    <Typography variant="caption" color="text.secondary">View adoption plans</Typography>
                                </Box>
                            </Paper>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
