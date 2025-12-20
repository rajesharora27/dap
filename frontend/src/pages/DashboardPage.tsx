import React from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    LinearProgress,
    Chip,
    useTheme,
    alpha,
    CircularProgress
} from '@mui/material';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../components/AuthContext';
import {
    People as CustomerIcon,
    Inventory2 as ProductIcon,
    Lightbulb as SolutionIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as checkIcon,
    Warning as warningIcon
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

    // Calculate Stats
    const totalCustomers = customers.length;
    const totalProducts = products.length;
    const totalSolutions = solutions.length;

    // Calculate Average Adoption
    const avgProductReadiness = products.reduce((acc: number, p: any) => acc + (p.statusPercent || 0), 0) / (totalProducts || 1);

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
                Executive Dashboard
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 4, color: theme.palette.text.secondary }}>
                System Overview & Adoption Metrics
            </Typography>

            {/* Strategy & Value Cards */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card elevation={8} sx={{
                        height: '100%',
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${theme.palette.background.paper} 100%)`,
                        borderLeft: `8px solid ${theme.palette.primary.main}`,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: '800' }}>
                                The Single Source of Truth for Adoption
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                                DAP centrally defines all adoption components of a product and solution.
                            </Typography>
                            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                                <strong>Problem it solves:</strong> Lack of clarity on necessary steps and inconsistent adoption of products.
                            </Typography>
                            <Typography variant="body1" sx={{ fontStyle: 'italic', color: theme.palette.primary.dark, bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2, borderRadius: 1, borderLeft: `4px solid ${theme.palette.primary.light}` }}>
                                Value: Provides a unified, authoritative reference for all stakeholders to ensure consistent, repeatable adoption success.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card elevation={8} sx={{
                        height: '100%',
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.1)} 0%, ${theme.palette.background.paper} 100%)`,
                        borderLeft: `8px solid ${theme.palette.secondary.main}`,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" gutterBottom sx={{ color: theme.palette.secondary.main, fontWeight: '800' }}>
                                Accelerated Adoption
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                                Purpose: Streamline the path to value for customers and delivery teams.
                            </Typography>
                            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                                <strong>Solution:</strong> A dedicated platform for defining "How" to implement, not "What" to build.
                            </Typography>
                            <Typography variant="body1" sx={{ fontStyle: 'italic', color: theme.palette.secondary.dark, bgcolor: alpha(theme.palette.secondary.main, 0.05), p: 2, borderRadius: 1, borderLeft: `4px solid ${theme.palette.secondary.light}` }}>
                                Value: Drives predictable outcomes and faster time-to-value by standardizing the implementation methodology for all delivery stakeholders.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* KPI Cards - Product Focus */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary, mb: 3 }}>
                Portfolio Health
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" variant="overline" sx={{ fontSize: '0.85rem' }}>Active Products</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>{totalProducts}</Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, width: 64, height: 64 }}>
                                <ProductIcon fontSize="large" />
                            </Avatar>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" variant="overline" sx={{ fontSize: '0.85rem' }}>Solutions Deployed</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>{totalSolutions}</Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, width: 64, height: 64 }}>
                                <SolutionIcon fontSize="large" />
                            </Avatar>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" variant="overline" sx={{ fontSize: '0.85rem' }}>Customers</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>{totalCustomers}</Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 64, height: 64 }}>
                                <CustomerIcon fontSize="large" />
                            </Avatar>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Detail Section */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card elevation={1} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                        <CardHeader title="Recent Activity" subheader="Latest system updates" />
                        <Divider />
                        <CardContent>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="System Backup Completed"
                                        secondary="Today at 1:00 AM"
                                    />
                                    <Chip label="System" size="small" />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemText
                                        primary="Product 'Cisco Secure Access' Updated"
                                        secondary="Yesterday at 4:30 PM by admin"
                                    />
                                    <Chip label="Product" size="small" color="primary" />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemText
                                        primary="New Customer 'Acme Corp' Onboarded"
                                        secondary="2 days ago by cssuser"
                                    />
                                    <Chip label="Customer" size="small" color="success" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Card elevation={1} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                        <CardHeader title="Quick Actions" subheader="Common tasks" />
                        <Divider />
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Use the sidebar to navigate to specific modules.
                            </Typography>
                            <List>
                                <ListItemButton component="a" href="/customers">
                                    <ListItemText primary="View Customer Adoption" secondary="Go to Customers page" />
                                </ListItemButton>
                                <ListItemButton component="a" href="/products">
                                    <ListItemText primary="Configure Products" secondary="Go to Products page" />
                                </ListItemButton>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

