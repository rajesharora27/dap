import * as React from 'react';
import { Box, Typography, Paper, Chip, LinearProgress } from '@mui/material';

interface AdoptionPlanProgressCardProps {
    licenseLevel: string;
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    productsCount?: number;
}

export const AdoptionPlanProgressCard: React.FC<AdoptionPlanProgressCardProps> = ({
    licenseLevel,
    completedTasks,
    totalTasks,
    percentage,
    productsCount
}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 2,
                border: '1.5px solid',
                borderColor: '#E0E0E0',
                borderRadius: 2,
                bgcolor: 'background.paper'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600">Overall Progress</Typography>
                    <Chip
                        label={licenseLevel || 'Standard'}
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>{completedTasks}</strong> of <strong>{totalTasks}</strong> tasks
                    </Typography>
                    {productsCount !== undefined && (
                        <>
                            <Typography variant="body2" color="text.secondary">•</Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{productsCount}</strong> products
                            </Typography>
                        </>
                    )}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{ flex: 1, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body1" fontWeight="700" color="primary" sx={{ minWidth: 50, textAlign: 'right' }}>
                    {Math.round(percentage)}%
                </Typography>
            </Box>
        </Paper>
    );
};
