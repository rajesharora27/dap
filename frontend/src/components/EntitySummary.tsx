import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Divider, LinearProgress } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

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
    const theme = useTheme();

    return (
        <Card
            elevation={2}
            sx={{
                mb: 3,
                borderLeft: `5px solid ${theme.palette.primary.main}`,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${theme.palette.background.paper} 100%)`
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography
                            variant="h5"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 'bold',
                                color: theme.palette.text.primary
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: theme.palette.text.secondary,
                                lineHeight: 1.6
                            }}
                        >
                            {description}
                        </Typography>

                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {badges?.map((badge, index) => (
                                <Chip
                                    key={index}
                                    label={badge}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.dark,
                                        fontWeight: 500,
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                    }}
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Stats */}
                    {stats.length > 0 && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Grid container spacing={2}>
                                {stats.map((stat, index) => {
                                    // Determine the color to use - either provided or use theme colors
                                    const statColor = stat.color || theme.palette.primary.main;

                                    return (
                                        <Grid size={{ xs: 6 }} key={index}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    textAlign: 'center',
                                                    bgcolor: alpha(statColor, 0.08),
                                                    borderRadius: 2,
                                                    border: `1px solid ${alpha(statColor, 0.2)}`,
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 4px 12px ${alpha(statColor, 0.15)}`
                                                    }
                                                }}
                                            >
                                                <Typography
                                                    variant="h4"
                                                    sx={{
                                                        color: statColor,
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {stat.value}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Grid>
                    )}

                    {/* Custom Attributes (if any) */}
                    {attributes && Object.keys(attributes).length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    sx={{ color: theme.palette.secondary.dark, fontWeight: 600 }}
                                >
                                    Additional Details
                                </Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(attributes).map(([key, val]) => (
                                        <Grid size={{ xs: 6, sm: 4 }} key={key}>
                                            <Typography
                                                variant="caption"
                                                display="block"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                {key}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500 }}
                                            >
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
