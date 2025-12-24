import React, { useMemo } from 'react';
import { Solution } from '../types';
import { Box, Paper, Typography, LinearProgress, Chip, useTheme, alpha } from '@mui/material';
import { Speed as SpeedIcon, Category as CategoryIcon, Flag as FlagIcon, CheckCircle as CheckCircleIcon } from '@shared/components/FAIcon';

interface SolutionSummaryDashboardProps {
    solution: Solution;
    onOutcomeClick?: (outcomeName: string) => void;
}

// Reusable Metric Card Component
interface MetricCardProps {
    title: string;
    icon: React.ReactNode;
    iconBgColor: string;
    iconColor: string;
    children: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, icon, iconBgColor, iconColor, children }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 2.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.6)
                    : theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark'
                    ? `0 2px 8px ${alpha(theme.palette.common.black, 0.2)}`
                    : `0 2px 8px ${alpha(theme.palette.grey[500], 0.08)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: theme.palette.mode === 'dark'
                        ? `0 4px 16px ${alpha(theme.palette.common.black, 0.3)}`
                        : `0 4px 16px ${alpha(theme.palette.grey[500], 0.12)}`,
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.8rem'
                    }}
                >
                    {title}
                </Typography>
                <Box
                    sx={{
                        p: 0.75,
                        borderRadius: 1.5,
                        backgroundColor: iconBgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& > span': { fontSize: 16, color: iconColor }
                    }}
                >
                    {icon}
                </Box>
            </Box>
            {children}
        </Paper>
    );
};

// Circular Progress Component
interface CircularMetricProps {
    value: number;
    label: string;
    sublabel: string;
    colorScheme: 'success' | 'warning' | 'error';
}

const CircularMetric: React.FC<CircularMetricProps> = ({ value, label, sublabel, colorScheme }) => {
    const theme = useTheme();

    const colors = {
        success: { main: theme.palette.success.main },
        warning: { main: theme.palette.warning.main },
        error: { main: theme.palette.error.main }
    };

    const strokeColor = colors[colorScheme].main;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.grey[300], 0.5)}
                        strokeWidth="3"
                    />
                    <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${value * 0.88}, 100`}
                        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                </svg>
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        {value}%
                    </Typography>
                </Box>
            </Box>
            <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.8rem', mb: 0.25 }}>
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {sublabel}
                </Typography>
            </Box>
        </Box>
    );
};

export const SolutionSummaryDashboard: React.FC<SolutionSummaryDashboardProps> = ({ solution, onOutcomeClick }) => {
    const theme = useTheme();
    const tasks = useMemo(() => solution.tasks?.edges?.map(e => e.node) || [], [solution.tasks]);
    const totalTasks = tasks.length;

    const metrics = useMemo(() => {
        if (totalTasks === 0) {
            return {
                telemetryCoverage: 0,
                resourceGaps: 0,
                documentedPercent: 100,
                outcomeDistribution: {} as Record<string, number>
            };
        }

        let tasksWithTelemetry = 0;
        let tasksWithResourceGaps = 0;
        const outcomeCount: Record<string, number> = {};

        tasks.forEach(task => {
            if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
                tasksWithTelemetry++;
            }

            const hasDocs = task.howToDoc && task.howToDoc.length > 0;
            const hasVideo = task.howToVideo && task.howToVideo.length > 0;
            if (!hasDocs && !hasVideo) {
                tasksWithResourceGaps++;
            }

            if (task.outcomes && task.outcomes.length > 0) {
                // Task has specific outcomes - count towards those
                task.outcomes.forEach((o: any) => {
                    outcomeCount[o.name] = (outcomeCount[o.name] || 0) + 1;
                });
            } else {
                // Task has NO specific outcomes = applies to ALL outcomes
                outcomeCount['All Outcomes'] = (outcomeCount['All Outcomes'] || 0) + 1;
            }
        });

        const documentedPercent = Math.round(((totalTasks - tasksWithResourceGaps) / totalTasks) * 100);

        return {
            telemetryCoverage: Math.round((tasksWithTelemetry / totalTasks) * 100),
            resourceGaps: tasksWithResourceGaps,
            documentedPercent,
            outcomeDistribution: outcomeCount
        };
    }, [tasks, totalTasks]);

    const sortedOutcomes = useMemo(() => {
        return Object.entries(metrics.outcomeDistribution)
            .sort(([, a], [, b]) => b - a);
    }, [metrics.outcomeDistribution]);

    const maxOutcomeCount = sortedOutcomes.length > 0 ? sortedOutcomes[0][1] : 0;

    const telemetryColor = metrics.telemetryCoverage > 70 ? 'success' : metrics.telemetryCoverage > 40 ? 'warning' : 'error';

    // Get only active licenses
    const activeLicenses = useMemo(() => {
        return (solution.licenses || []).filter((license: any) => license.isActive);
    }, [solution.licenses]);

    // Determine if fully documented
    const isFullyDocumented = metrics.resourceGaps === 0;
    const documentationColor = isFullyDocumented ? 'success' : 'warning';

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2.5,
            }}
        >
            {/* Card 1: Plan Health */}
            <MetricCard
                title="Plan Health"
                icon={<SpeedIcon />}
                iconBgColor={alpha(theme.palette.info.main, 0.1)}
                iconColor={theme.palette.info.main}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <CircularMetric
                        value={metrics.telemetryCoverage}
                        label="Telemetry Coverage"
                        sublabel="Tasks with telemetry"
                        colorScheme={telemetryColor}
                    />

                    <Box sx={{ height: '1px', bgcolor: 'divider', opacity: 0.4, mx: -0.5 }} />

                    {/* Documentation Status - Dynamic based on gaps */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                flexShrink: 0,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(theme.palette[documentationColor].main, 0.1),
                            }}
                        >
                            {isFullyDocumented ? (
                                <CheckCircleIcon sx={{ fontSize: 24, color: `${documentationColor}.main` }} />
                            ) : (
                                <Typography variant="body1" fontWeight={700} color={`${documentationColor}.main`}>
                                    {metrics.resourceGaps}
                                </Typography>
                            )}
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.8rem', mb: 0.25 }}>
                                {isFullyDocumented ? 'Fully Documented' : 'Resource Gaps'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {isFullyDocumented
                                    ? 'All tasks have docs or video'
                                    : `${metrics.resourceGaps} task${metrics.resourceGaps > 1 ? 's' : ''} missing resources`
                                }
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </MetricCard>

            {/* Card 2: Outcome Distribution */}
            <MetricCard
                title="Outcome Distribution"
                icon={<FlagIcon />}
                iconBgColor={alpha(theme.palette.success.main, 0.1)}
                iconColor={theme.palette.success.main}
            >
                {sortedOutcomes.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {sortedOutcomes.slice(0, 5).map(([name, count]) => {
                            const isAllOutcomes = name === 'All Outcomes';
                            const barColor = isAllOutcomes
                                ? theme.palette.info.main  // Blue for "All Outcomes"
                                : theme.palette.success.main;  // Green for specific outcomes

                            return (
                                <Box
                                    key={name}
                                    onClick={() => onOutcomeClick?.(name)}
                                    sx={{
                                        cursor: onOutcomeClick ? 'pointer' : 'default',
                                        p: 0.75,
                                        mx: -0.75,
                                        borderRadius: 1,
                                        transition: 'background-color 0.15s ease',
                                        '&:hover': onOutcomeClick ? {
                                            bgcolor: alpha(theme.palette.action.hover, 0.5),
                                        } : {}
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography
                                            variant="caption"
                                            fontWeight={500}
                                            color={isAllOutcomes ? 'info.main' : 'text.secondary'}
                                            sx={{
                                                maxWidth: '75%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.7rem',
                                                fontStyle: isAllOutcomes ? 'italic' : 'normal'
                                            }}
                                            title={isAllOutcomes ? 'Tasks that apply to all outcomes' : name}
                                        >
                                            {name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            fontWeight={600}
                                            color={isAllOutcomes ? 'info.main' : 'text.primary'}
                                            sx={{ fontSize: '0.7rem' }}
                                        >
                                            {count}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(count / maxOutcomeCount) * 100}
                                        sx={{
                                            height: 5,
                                            borderRadius: 2.5,
                                            bgcolor: alpha(barColor, 0.12),
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 2.5,
                                                bgcolor: barColor,
                                                transition: 'transform 0.6s ease-out'
                                            }
                                        }}
                                    />
                                </Box>
                            );
                        })}
                        {sortedOutcomes.length > 5 && (
                            <Typography variant="caption" color="text.disabled" textAlign="center" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                                +{sortedOutcomes.length - 5} more
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            height: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.disabled'
                        }}
                    >
                        <FlagIcon sx={{ fontSize: 28, opacity: 0.3, mb: 0.75 }} />
                        <Typography variant="caption" fontStyle="italic" sx={{ fontSize: '0.7rem' }}>
                            No outcome data
                        </Typography>
                    </Box>
                )}
            </MetricCard>

            {/* Card 3: Scope & Constraints */}
            <MetricCard
                title="Scope & Constraints"
                icon={<CategoryIcon />}
                iconBgColor={alpha(theme.palette.primary.main, 0.1)}
                iconColor={theme.palette.primary.main}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Releases */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>
                                Releases
                            </Typography>
                            <Typography variant="caption" fontWeight={600} color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                {solution.releases?.length || 0}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {solution.releases && solution.releases.length > 0 ? (
                                solution.releases.map((release: any) => (
                                    <Chip
                                        key={release.id}
                                        label={`v${release.level} ${release.name}`}
                                        size="small"
                                        sx={{
                                            height: 24,
                                            fontSize: '0.68rem',
                                            fontWeight: 500,
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            color: 'primary.main',
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                            '& .MuiChip-label': { px: 1 }
                                        }}
                                    />
                                ))
                            ) : (
                                <Typography variant="caption" color="text.disabled" fontStyle="italic" sx={{ fontSize: '0.7rem' }}>
                                    No releases defined
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Licenses - Show only active, as chips like releases */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>
                                License Tiers
                            </Typography>
                            <Typography variant="caption" fontWeight={600} color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                {activeLicenses.length}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {activeLicenses.length > 0 ? (
                                activeLicenses.map((license: any) => (
                                    <Chip
                                        key={license.id}
                                        label={license.name}
                                        size="small"
                                        sx={{
                                            height: 24,
                                            fontSize: '0.68rem',
                                            fontWeight: 500,
                                            bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                            color: 'secondary.main',
                                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                                            '& .MuiChip-label': { px: 1 }
                                        }}
                                    />
                                ))
                            ) : (
                                <Typography variant="caption" color="text.disabled" fontStyle="italic" sx={{ fontSize: '0.7rem' }}>
                                    No active licenses
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </MetricCard>
        </Box>
    );
};
