import React, { useMemo } from 'react';
import { Product } from '../types';
import { Box, Paper, Typography, LinearProgress, Chip, useTheme, alpha, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Speed as SpeedIcon, CheckCircle as CheckCircleIcon, Task as TaskIcon, Description as DocIcon, OndemandVideo as VideoIcon } from '@mui/icons-material'; // Fallback to MUI icons for better consistency if needed, or keep FAIcon
import { getProgressColor } from '../../../shared/utils/progressUtils';

interface ProductSummaryDashboardProps {
    product: Product;
    tasks: any[];
    onOutcomeClick?: (outcomeName: string) => void;
}

// Enterprise Palette for Outcomes
const OUTCOME_COLORS = [
    '#3B82F6', // Blue 500
    '#10B981', // Emerald 500
    '#6366F1', // Indigo 500
    '#F59E0B', // Amber 500
    '#8B5CF6', // Violet 500
    '#14B8A6', // Teal 500
    '#EC4899', // Pink 500
    '#06B6D4', // Cyan 500
];

// Premium Circular Gauge Component for Ribbon
const CircularGauge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    return (
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="42" height="42" viewBox="0 0 36 36">
                <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3"
                />
                <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={`${value}, 100`}
                    strokeLinecap="round"
                    className="circular-chart-path"
                />
            </svg>
            <Box sx={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography
                    variant="caption"
                    fontFamily="Inter, sans-serif"
                    fontWeight={700}
                    sx={{ color: 'text.primary', fontSize: '0.7rem' }}
                >
                    {value}%
                </Typography>
            </Box>
        </Box>
    );
};

export const ProductSummaryDashboard: React.FC<ProductSummaryDashboardProps> = ({ product, tasks, onOutcomeClick }) => {
    const theme = useTheme();
    const totalTasks = tasks.length;

    const metrics = useMemo(() => {
        if (totalTasks === 0) {
            return {
                telemetryCoverage: 0,
                docsCount: 0,
                videosCount: 0,
                outcomeDistribution: {} as Record<string, number>
            };
        }

        let tasksWithTelemetry = 0;
        let docsCount = 0;
        let videosCount = 0;
        let allOutcomesCount = 0; // Count of tasks with empty outcomes
        const outcomeCount: Record<string, number> = {};

        // First pass: count specific outcomes and "All Outcomes" tasks
        tasks.forEach(task => {
            if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
                tasksWithTelemetry++;
            }

            if (task.howToDoc && task.howToDoc.length > 0) docsCount++;
            if (task.howToVideo && task.howToVideo.length > 0) videosCount++;

            if (task.outcomes && task.outcomes.length > 0) {
                task.outcomes.forEach((o: any) => {
                    outcomeCount[o.name] = (outcomeCount[o.name] || 0) + 1;
                });
            } else {
                allOutcomesCount++;
            }
        });

        // Add "All Outcomes" tasks to each specific outcome count
        Object.keys(outcomeCount).forEach(key => {
            outcomeCount[key] += allOutcomesCount;
        });

        // Add the "All Outcomes" row (shows tasks that apply to all)
        if (allOutcomesCount > 0) {
            outcomeCount['All Outcomes'] = allOutcomesCount;
        }

        return {
            telemetryCoverage: Math.round((tasksWithTelemetry / totalTasks) * 100),
            docsCount,
            videosCount,
            outcomeDistribution: outcomeCount
        };
    }, [tasks, totalTasks]);

    const sortedOutcomes = useMemo(() => {
        return Object.entries(metrics.outcomeDistribution)
            .sort(([, a], [, b]) => b - a);
    }, [metrics.outcomeDistribution]);

    const maxOutcomeCount = sortedOutcomes.length > 0 ? sortedOutcomes[0][1] : 0;

    const activeLicenses = useMemo(() => {
        return (product.licenses || []).filter(license => license.isActive);
    }, [product.licenses]);

    const outcomesCount = product.outcomes?.length || 0;
    const releasesCount = product.releases?.length || 0;

    const colors = {
        primary: '#0F172A',
        secondary: '#64748B',
        accentGreen: '#10B981',
        vibrantCyan: '#06B6D4',
        solidGreen: '#10B981',
        ciscoBlue: '#3B82F6',
        divider: '#E2E8F0',
        bg: '#F1F5F9', // Light Gray-Blue
        headerBg: '#F8FAFC'
    };

    const telemetryColor = getProgressColor(metrics.telemetryCoverage);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, bgcolor: colors.bg, minHeight: '100%', p: 0 }}>

            {/* === 1. Stats Ribbon (90px Fixed, Divided) === */}
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 90,
                    borderRadius: 1,
                    border: `1px solid ${colors.divider}`,
                    bgcolor: 'common.white',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
            >
                {/* Section 1: Total Tasks */}
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <TaskIcon sx={{ color: colors.secondary, fontSize: 16, mb: 0.5 }} />
                        <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                            {totalTasks}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', mt: 0.25 }}>
                        Total Tasks
                    </Typography>
                </Box>

                {/* Section 2: Telemetry */}
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularGauge value={metrics.telemetryCoverage} color={telemetryColor} />
                        <Box>
                            <Typography variant="body2" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.85rem' }}>
                                Telemetry
                            </Typography>
                            <Typography variant="caption" color={colors.secondary} sx={{ fontSize: '0.7rem' }}>
                                Coverage
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Section 3: Docs */}
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <DocIcon sx={{ color: colors.secondary, fontSize: 16, mb: 0.25 }} />
                        <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                            {metrics.docsCount}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', mt: 0.25 }}>
                        Docs
                    </Typography>
                </Box>

                {/* Section 4: Videos */}
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <VideoIcon sx={{ color: colors.secondary, fontSize: 16, mb: 0.25 }} />
                        <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                            {metrics.videosCount}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', mt: 0.25 }}>
                        Videos
                    </Typography>
                </Box>

                {/* Section 5: Outcomes */}
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                        {outcomesCount}
                    </Typography>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', mt: 0.25 }}>
                        Outcomes
                    </Typography>
                </Box>

                {/* Section 6: Releases */}
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                        {releasesCount}
                    </Typography>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', mt: 0.25 }}>
                        Releases
                    </Typography>
                </Box>
            </Paper>

            {/* === 2. Main Data Grid (60% / 20% / 20%) with Equal Height & Tight Gap === */}
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'stretch' }}>

                {/* === LEFT PANEL: Tasks by Outcome (Data Table) === */}
                <Paper
                    elevation={0}
                    sx={{
                        flex: '0 0 55%',
                        border: `1px solid ${colors.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg }}>
                        <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                            Tasks by Outcome
                        </Typography>
                    </Box>

                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: colors.headerBg }}>
                                <TableRow sx={{ height: 32 }}>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', borderBottom: `1px solid ${colors.divider}`, py: 0.5, pl: 3 }}>OUTCOME NAME</TableCell>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', borderBottom: `1px solid ${colors.divider}`, py: 0.5, width: '40%' }}>DISTRIBUTION</TableCell>
                                    <TableCell align="right" sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', borderBottom: `1px solid ${colors.divider}`, py: 0.5, pr: 3 }}>TASKS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedOutcomes.length > 0 ? (
                                    sortedOutcomes.slice(0, 8).map(([name, count], index) => {
                                        const isAllOutcomes = name === 'All Outcomes';
                                        const percentage = (count / maxOutcomeCount) * 100;
                                        // Cycle through palette
                                        const barColor = isAllOutcomes ? colors.primary : OUTCOME_COLORS[index % OUTCOME_COLORS.length];

                                        return (
                                            <TableRow
                                                key={name}
                                                hover
                                                onClick={() => onOutcomeClick?.(name)}
                                                sx={{
                                                    cursor: onOutcomeClick ? 'pointer' : 'default',
                                                    height: 50 // Strict 50px height
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        py: 0,
                                                        borderBottom: `1px solid ${colors.divider}`,
                                                        fontSize: '0.8125rem', // 13px
                                                        color: colors.primary,
                                                        fontWeight: 500,
                                                        pl: 3
                                                    }}
                                                >
                                                    {name}
                                                </TableCell>
                                                <TableCell sx={{ py: 0, borderBottom: `1px solid ${colors.divider}` }}>
                                                    <Box sx={{ height: 12, bgcolor: '#E2E8F0', borderRadius: 0.5, overflow: 'hidden', width: '100%' }}>
                                                        <Box
                                                            sx={{
                                                                width: `${percentage}%`,
                                                                height: '100%',
                                                                bgcolor: barColor,
                                                                transition: 'width 0.5s ease'
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        py: 0,
                                                        borderBottom: `1px solid ${colors.divider}`,
                                                        fontSize: '0.8125rem', // 13px
                                                        fontWeight: 700,
                                                        color: colors.primary,
                                                        pr: 3
                                                    }}
                                                >
                                                    {count}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 4, color: colors.secondary, fontStyle: 'italic' }}>
                                            No outcomes defined
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* === MIDDLE PANEL: Releases === */}
                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        border: `1px solid ${colors.divider}`,
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg }}>
                        <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                            Releases
                        </Typography>
                    </Box>

                    <TableContainer sx={{ flex: 1 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: colors.headerBg }}>
                                <TableRow sx={{ height: 32 }}>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', borderBottom: `1px solid ${colors.divider}`, py: 0.5, pl: 2 }}>NAME</TableCell>
                                    <TableCell align="right" sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', borderBottom: `1px solid ${colors.divider}`, py: 0.5, pr: 2 }}>VERSION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {product.releases && product.releases.length > 0 ? (
                                    product.releases.map(release => {
                                        // Include tasks with empty releases (applies to all) OR explicitly linked
                                        const taskCount = tasks.filter(t => !t.releases?.length || t.releases.some((r: any) => r.id === release.id)).length;
                                        return (
                                            <TableRow key={release.id} sx={{ height: 44 }}>
                                                <TableCell sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, fontSize: '0.8125rem', color: colors.primary, pl: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
                                                    {release.name}
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, pr: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Chip
                                                            label={taskCount}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                height: 22,
                                                                fontSize: '0.7rem',
                                                                color: colors.secondary,
                                                                borderColor: colors.divider,
                                                                minWidth: 24
                                                            }}
                                                        />
                                                        <Chip
                                                            label={`v${release.level}`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#0EA5E9', // Solid Sky Blue
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                borderRadius: '4px',
                                                                height: 22,
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ py: 1.5, color: colors.secondary, fontSize: '0.75rem', fontStyle: 'italic', borderBottom: `1px solid ${colors.divider}`, pl: 2 }}>No releases</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* === RIGHT PANEL: Licenses === */}
                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        border: `1px solid ${colors.divider}`,
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg }}>
                        <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                            License
                        </Typography>
                    </Box>

                    <TableContainer sx={{ flex: 1 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: colors.headerBg }}>
                                <TableRow sx={{ height: 32 }}>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', borderBottom: `1px solid ${colors.divider}`, py: 0.5, pl: 2 }}>TIER</TableCell>
                                    <TableCell align="right" sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', borderBottom: `1px solid ${colors.divider}`, py: 0.5, pr: 2 }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activeLicenses.length > 0 ? (
                                    activeLicenses.map(license => {
                                        // Cumulative: count tasks from same or lower license levels
                                        const currentLevel = license.level || 0;
                                        const taskCount = tasks.filter(t => t.license && (t.license.level || 0) <= currentLevel).length;
                                        return (
                                            <TableRow key={license.id} sx={{ height: 44 }}>
                                                <TableCell colSpan={2} sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, pl: 2, pr: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                        <Chip
                                                            label={license.name}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#F1F5F9', // Light Gray Pill (Subtle)
                                                                color: '#0F172A', // Dark Text
                                                                fontWeight: 500,
                                                                borderRadius: '12px', // Fully rounded pill
                                                                height: 24,
                                                                fontSize: '0.75rem',
                                                                justifyContent: 'flex-start',
                                                                '& .MuiChip-label': { paddingLeft: 1.5 },
                                                                mr: 'auto'
                                                            }}
                                                        />
                                                        <Chip
                                                            label={taskCount}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                height: 22,
                                                                fontSize: '0.7rem',
                                                                color: colors.secondary,
                                                                borderColor: colors.divider,
                                                                minWidth: 24
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{ py: 1.5, color: colors.secondary, fontSize: '0.75rem', fontStyle: 'italic', borderBottom: `1px solid ${colors.divider}`, pl: 2 }}>No active licenses</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

            </Box>

            {/* === 3. Resources Panel (Top 3) === */}
            {product.resources && product.resources.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                >
                    <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                            Resources
                        </Typography>
                        {product.resources.length > 3 && (
                            <Typography variant="caption" color={colors.secondary}>
                                Showing 3 of {product.resources.length}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
                        {product.resources.slice(0, 3).map((resource, index) => (
                            <Box
                                key={index}
                                component="a"
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    p: 2,
                                    bgcolor: alpha(colors.ciscoBlue, 0.05),
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(colors.ciscoBlue, 0.2)}`,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: alpha(colors.ciscoBlue, 0.1),
                                        borderColor: colors.ciscoBlue,
                                        transform: 'translateY(-1px)'
                                    }
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} color={colors.ciscoBlue} sx={{ fontSize: '0.85rem' }}>
                                    {resource.label}
                                </Typography>
                                <Typography variant="caption" color={colors.secondary} sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {resource.url.length > 40 ? resource.url.slice(0, 40) + '...' : resource.url}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};
