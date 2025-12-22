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
import { useAuth } from '@features/auth';
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
    Compass,
    AISparkle
} from '@shared/components/FAIcon';

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
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dynamic Adoption Platform
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Centralized logic for product and solution adoption.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.04), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ color: theme.palette.primary.main, flexShrink: 0, pt: 0.5 }}>
                                    <CheckCircleOutline fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.primary }}>
                                        Single Source of Truth
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Centrally define all adoption components for products and solutions.
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, height: '100%', bgcolor: alpha(theme.palette.success.main, 0.04), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ color: theme.palette.success.main, flexShrink: 0, pt: 0.5 }}>
                                    <ClockOutlined fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.primary }}>
                                        Accelerated Time-to-Value
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Streamline implementation methodology for predictable outcomes.
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, height: '100%', bgcolor: alpha(theme.palette.warning.main, 0.04), border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ color: theme.palette.warning.main, flexShrink: 0, pt: 0.5 }}>
                                    <Compass fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.primary }}>
                                        Dynamic Outcome-Based Plans
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Adoption plans dynamically adjust based on selected business outcomes.
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, height: '100%', bgcolor: alpha(theme.palette.info.main, 0.04), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ color: theme.palette.info.main, flexShrink: 0, pt: 0.5 }}>
                                    <IdBadge fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.primary }}>
                                        Context-Aware
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Plans automatically adjust to current licenses, software versions, and deployment constraints.
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, height: '100%', bgcolor: alpha(theme.palette.secondary.main, 0.04), border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ color: theme.palette.secondary.main, flexShrink: 0, pt: 0.5 }}>
                                    <StarOutlined fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.primary }}>
                                        Environment Tags
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Customize adoption plans based on customer environment characteristics.
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.04), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ color: theme.palette.primary.main, flexShrink: 0, pt: 0.5 }}>
                                    <AISparkle fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.primary }}>
                                        AI Agent
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Query and navigate adoption data using natural language.
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};
