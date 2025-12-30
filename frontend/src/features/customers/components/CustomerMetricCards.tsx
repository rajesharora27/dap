import * as React from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress as MuiCircularProgress,
} from '@mui/material';
import { Assessment, Inventory as ProductIcon, Extension as SolutionIcon } from '@shared/components/FAIcon';

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
                            color: overviewMetrics.adoption >= 70 ? 'success.main' :
                                overviewMetrics.adoption >= 40 ? 'warning.main' : 'error.main'
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
                            color: overviewMetrics.adoption >= 70 ? 'success.main' :
                                overviewMetrics.adoption >= 40 ? 'warning.main' : 'error.main'
                        }}>
                            {Math.round(overviewMetrics.adoption)}%
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary">Overall Adoption</Typography>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                        {overviewMetrics.adoption >= 70 ? 'Healthy' : overviewMetrics.adoption >= 40 ? 'At Risk' : 'Critical'}
                    </Typography>
                </Box>
            </Paper>

            {/* Tasks */}
            <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="body2" color="text.secondary">Tasks</Typography>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                        {overviewMetrics.completedTasks}/{overviewMetrics.totalTasks}
                    </Typography>
                </Box>
            </Paper>

            {/* Portfolio */}
            <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.5 }}>
                    <SolutionIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <ProductIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary">Portfolio</Typography>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                        <Box component="span" sx={{ color: 'primary.main' }}>{overviewMetrics.solutionsCount}</Box>
                        {' Sol.'}, {' '}
                        <Box component="span" sx={{ color: 'success.main' }}>{overviewMetrics.directProductsCount + overviewMetrics.solutionProductsCount}</Box>
                        {' Prod.'}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
