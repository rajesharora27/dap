import * as React from 'react';
import { Box, Typography, Paper, Chip, LinearProgress } from '@mui/material';
import { getProgressColor } from '../../../shared/utils/progressUtils';

interface AdoptionPlanProgressCardProps {
    licenseLevel: string;
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    productsCount?: number;
    color?: string;
}

export const AdoptionPlanProgressCard: React.FC<AdoptionPlanProgressCardProps> = ({
    licenseLevel,
    completedTasks,
    totalTasks,
    percentage,
    productsCount,
    color = '#049FD9' // Default theme color
}) => {
    const dynamicColor = getProgressColor(percentage);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 2,
                border: '1.5px solid',
                borderColor: '#E0E0E0',
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderLeft: `4px solid ${color}`
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600">Overall Progress</Typography>
                    <Chip
                        label={licenseLevel || 'Standard'}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: color,
                            color: '#fff'
                        }}
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
                    sx={{
                        flex: 1,
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: dynamicColor,
                            borderRadius: 5
                        }
                    }}
                />
                <Typography variant="body1" fontWeight="700" sx={{ minWidth: 50, textAlign: 'right', color: dynamicColor }}>
                    {Math.round(percentage)}%
                </Typography>
            </Box>
        </Paper>
    );
};
