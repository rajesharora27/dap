import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Divider, LinearProgress } from '@mui/material';

interface StatItem {
    label: string;
    value: string | number;
    color?: string;
}

interface EntitySummaryProps {
    title: string;
    description: string;
    stats: StatItem[];
    badges?: string[];
    attributes?: Record<string, any>; // Optional custom attributes
}

export const EntitySummary: React.FC<EntitySummaryProps> = ({ title, description, stats, badges, attributes }) => {
    return (
        <Card elevation={1} sx={{ mb: 3, borderLeft: '4px solid #1976d2', borderRadius: 2 }}>
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {description}
                        </Typography>

                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {badges?.map((badge, index) => (
                                <Chip key={index} label={badge} size="small" variant="outlined" />
                            ))}
                        </Box>
                    </Grid>

                    {/* Stats */}
                    {stats.length > 0 && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Grid container spacing={2}>
                                {stats.map((stat, index) => (
                                    <Grid size={{ xs: 6 }} key={index}>
                                        <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="h4" color={stat.color || 'primary.main'} sx={{ fontWeight: 'bold' }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {stat.label}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    )}

                    {/* Custom Attributes (if any) */}
                    {attributes && Object.keys(attributes).length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>Additional Details</Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(attributes).map(([key, val]) => (
                                        <Grid size={{ xs: 6, sm: 4 }} key={key}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {key}
                                            </Typography>
                                            <Typography variant="body2">
                                                {String(val)}
                                            </Typography>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};
