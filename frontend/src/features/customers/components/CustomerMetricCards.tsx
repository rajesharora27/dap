import * as React from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress as MuiCircularProgress,
    LinearProgress,
    Divider,
    useTheme,
    alpha
} from '@mui/material';
import { Assessment, BoxIconOutlined as ProductIcon, LightbulbOutlined as SolutionIcon } from '@shared/components/FAIcon';
import { getProgressColor } from '@shared/utils/progressUtils';

interface OverviewMetrics {
    adoption: number;
    velocity: number;
    totalTasks: number;
    completedTasks: number;
    productsCount: number;
    solutionsCount: number;
    directProductsCount: number;
    solutionProductsCount: number;
}

interface CustomerMetricCardsProps {
    overviewMetrics: OverviewMetrics;
}

export function CustomerMetricCards({ overviewMetrics }: CustomerMetricCardsProps) {
    const theme = useTheme();

    // Standard Colors
    const colors = {
        solution: '#3B82F6', // Blue
        product: '#10B981',  // Green
        task: theme.palette.primary.main
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {/* Overall Adoption */}
            <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <MuiCircularProgress
                        variant="determinate"
                        value={100}
                        size={56}
                        sx={{ color: 'grey.200', position: 'absolute' }}
                    />
                    <MuiCircularProgress
                        variant="determinate"
                        value={overviewMetrics.adoption}
                        size={56}
                        sx={{
                            color: getProgressColor(overviewMetrics.adoption)
                        }}
                    />
                    <Box
                        sx={{
                            top: 0, left: 0, bottom: 0, right: 0,
                            position: 'absolute', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Typography variant="body2" fontWeight={700} sx={{
                            color: getProgressColor(overviewMetrics.adoption)
                        }}>
                            {Math.round(overviewMetrics.adoption)}%
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary">Overall Adoption</Typography>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                        {overviewMetrics.adoption >= 66 ? 'Healthy' : overviewMetrics.adoption >= 33 ? 'At Risk' : 'Critical'}
                    </Typography>
                </Box>
            </Paper>

            {/* Tasks Summary Progress Bar */}
            <Paper elevation={0} sx={{ flex: 1.2, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ fontSize: 32, color: getProgressColor(overviewMetrics.totalTasks > 0 ? (overviewMetrics.completedTasks / overviewMetrics.totalTasks) * 100 : 0) }} />
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>Tasks Progress</Typography>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                            {overviewMetrics.completedTasks} <Typography component="span" variant="caption" color="text.secondary">/ {overviewMetrics.totalTasks}</Typography>
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={overviewMetrics.totalTasks > 0 ? (overviewMetrics.completedTasks / overviewMetrics.totalTasks) * 100 : 0}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(getProgressColor(overviewMetrics.totalTasks > 0 ? (overviewMetrics.completedTasks / overviewMetrics.totalTasks) * 100 : 0), 0.1),
                            '& .MuiLinearProgress-bar': {
                                bgcolor: getProgressColor(overviewMetrics.totalTasks > 0 ? (overviewMetrics.completedTasks / overviewMetrics.totalTasks) * 100 : 0),
                                borderRadius: 3
                            }
                        }}
                    />
                </Box>
            </Paper>

            {/* Portfolio Split */}
            <Paper elevation={0} sx={{ flex: 1.5, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.5 }}>
                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center' }}>
                        <SolutionIcon sx={{ fontSize: 16, color: colors.solution }} />
                    </Box>
                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center' }}>
                        <ProductIcon sx={{ fontSize: 16, color: colors.product }} />
                    </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Portfolio</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: colors.solution, lineHeight: 1 }}>
                                {overviewMetrics.solutionsCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>SOLUTIONS</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: colors.product, lineHeight: 1 }}>
                                {overviewMetrics.directProductsCount}<Typography component="span" variant="h6" fontWeight={400} sx={{ color: 'text.secondary', mx: 0.2 }}>+</Typography>{overviewMetrics.solutionProductsCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>PRODUCTS</Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
