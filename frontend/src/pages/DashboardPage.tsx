import React from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    LinearProgress,
    useTheme,
    alpha,
    CircularProgress,
    Stack
} from '@mui/material';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../components/AuthContext';
// Flat outlined icons only (Regular style)
import {
    ObjectGroupOutlined,
    LightbulbOutlined,
    BuildingOutlined,
    CheckCircleOutline,
    ClockOutlined,
    IdBadge,
    StarOutlined,
    CommentOutlined,
    Compass
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

// Minimal stat card with outlined icon
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
            }}
        >
            <Box sx={{ color: color, opacity: 0.85 }}>
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

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Stats Row */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        label="Products"
                        value={totalProducts}
                        icon={<ObjectGroupOutlined fontSize="large" />}
                        color={theme.palette.primary.main}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        label="Solutions"
                        value={totalSolutions}
                        icon={<LightbulbOutlined fontSize="large" />}
                        color={theme.palette.warning.main}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        label="Customers"
                        value={totalCustomers}
                        icon={<BuildingOutlined fontSize="large" />}
                        color={theme.palette.success.main}
                    />
                </Grid>
            </Grid>

            {/* About DAP - Key Features */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 3, fontWeight: 600 }}>
                    About DAP
                </Typography>

                <Grid container spacing={3}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ color: theme.palette.primary.main, opacity: 0.8, flexShrink: 0, pt: 0.25 }}>
                                <CheckCircleOutline fontSize="medium" />
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ color: theme.palette.success.main, opacity: 0.8, flexShrink: 0, pt: 0.25 }}>
                                <ClockOutlined fontSize="medium" />
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
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ color: theme.palette.warning.main, opacity: 0.8, flexShrink: 0, pt: 0.25 }}>
                                <Compass fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Dynamic Outcome-Based Plans
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Adoption plans dynamically adjust based on selected business outcomes.
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ color: theme.palette.info.main, opacity: 0.8, flexShrink: 0, pt: 0.25 }}>
                                <IdBadge fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Entitlement-Aware
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Plans respect customer licenses and release versions for accurate task visibility.
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Row 3 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ color: theme.palette.secondary.main, opacity: 0.8, flexShrink: 0, pt: 0.25 }}>
                                <StarOutlined fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Environment Tags
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Customize adoption plans based on customer environment characteristics.
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ color: theme.palette.primary.main, opacity: 0.8, flexShrink: 0, pt: 0.25 }}>
                                <CommentOutlined fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    AI Agent
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Natural language interface to query and navigate adoption data.
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};
