import React, { useMemo } from 'react';
import { Box, Paper, Typography, Chip, useTheme, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Task as TaskIcon, Description as DocIcon, OndemandVideo as VideoIcon } from '@mui/icons-material';
import { getProgressColor } from '../../../shared/utils/progressUtils';

// Define minimal interface compatible with component usage
interface PersonalProduct {
    id: string;
    name: string;
    description?: string;
    resources?: any[];
    outcomes: any[];
    releases: any[];
    tasks: any[];
}

interface ProductSummaryDashboardProps {
    product: PersonalProduct;
    tasks: any[];
    onOutcomeClick?: (outcomeName: string) => void;
}

// Enterprise Palette for Outcomes
const OUTCOME_COLORS = [
    '#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#8B5CF6', '#14B8A6', '#EC4899', '#06B6D4',
];

// Circular Gauge Component
const CircularGauge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    return (
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="42" height="42" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${value}, 100`} strokeLinecap="round" className="circular-chart-path" />
            </svg>
            <Box sx={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" fontFamily="Inter, sans-serif" fontWeight={700} sx={{ color: 'text.primary', fontSize: '0.7rem' }}>{value}%</Typography>
            </Box>
        </Box>
    );
};

export const PersonalProductSummary: React.FC<ProductSummaryDashboardProps> = ({ product, tasks, onOutcomeClick }) => {
    const theme = useTheme();
    const totalTasks = tasks.length;

    const metrics = useMemo(() => {
        if (totalTasks === 0) return { telemetryCoverage: 0, docsCount: 0, videosCount: 0, outcomeDistribution: {} as Record<string, number> };

        let tasksWithTelemetry = 0;
        let docsCount = 0;
        let videosCount = 0;
        let allOutcomesCount = 0;
        const outcomeCount: Record<string, number> = {};

        tasks.forEach(task => {
            // Check telemetry logic
            if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
                tasksWithTelemetry++;
            }

            if (task.howToDoc && task.howToDoc.length > 0) docsCount++;
            if (task.howToVideo && task.howToVideo.length > 0) videosCount++;

            if (task.outcomes && task.outcomes.length > 0) {
                task.outcomes.forEach((o: any) => {
                    const name = o.personalOutcome?.name || o.name; // Handle nested structure
                    if (name) outcomeCount[name] = (outcomeCount[name] || 0) + 1;
                });
            } else {
                allOutcomesCount++;
            }
        });

        Object.keys(outcomeCount).forEach(key => { outcomeCount[key] += allOutcomesCount; });
        if (allOutcomesCount > 0) outcomeCount['All Outcomes'] = allOutcomesCount;

        return {
            telemetryCoverage: totalTasks > 0 ? Math.round((tasksWithTelemetry / totalTasks) * 100) : 0,
            docsCount,
            videosCount,
            outcomeDistribution: outcomeCount
        };
    }, [tasks, totalTasks]);

    const sortedOutcomes = useMemo(() => Object.entries(metrics.outcomeDistribution).sort(([, a], [, b]) => b - a), [metrics.outcomeDistribution]);
    const maxOutcomeCount = sortedOutcomes.length > 0 ? sortedOutcomes[0][1] : 0;
    const outcomesCount = product.outcomes?.length || 0;
    const releasesCount = product.releases?.length || 0;

    const colors = {
        primary: '#0F172A', secondary: '#64748B', divider: '#E2E8F0', bg: '#F1F5F9', headerBg: '#F8FAFC', ciscoBlue: '#3B82F6'
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, bgcolor: colors.bg, minHeight: '100%', p: 0 }}>
            <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', height: 90, borderRadius: 1, border: `1px solid ${colors.divider}`, bgcolor: 'common.white', overflow: 'hidden' }}>
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <TaskIcon sx={{ color: colors.secondary, fontSize: 16, mb: 0.5 }} />
                        <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{totalTasks}</Typography>
                    </Box>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Total Tasks</Typography>
                </Box>
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <CircularGauge value={metrics.telemetryCoverage} color="#10B981" />
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', mt: 0.5 }}>Telemetry</Typography>
                </Box>
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <DocIcon sx={{ color: colors.secondary, fontSize: 16, mb: 0.25 }} />
                        <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{metrics.docsCount}</Typography>
                    </Box>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Docs</Typography>
                </Box>
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <VideoIcon sx={{ color: colors.secondary, fontSize: 16, mb: 0.25 }} />
                        <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{metrics.videosCount}</Typography>
                    </Box>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Videos</Typography>
                </Box>
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${colors.divider}` }}>
                    <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{outcomesCount}</Typography>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Outcomes</Typography>
                </Box>
                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h3" fontWeight={700} color={colors.primary} sx={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{releasesCount}</Typography>
                    <Typography variant="caption" color={colors.secondary} fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Releases</Typography>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'stretch' }}>
                {/* Outcomes Table */}
                <Paper elevation={0} sx={{ flex: '0 0 55%', border: `1px solid ${colors.divider}`, borderRadius: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg }}>
                        <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem' }}>Tasks by Outcome</Typography>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: colors.headerBg }}>
                                <TableRow sx={{ height: 32 }}>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', pl: 3 }}>OUTCOME NAME</TableCell>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', width: '40%' }}>DISTRIBUTION</TableCell>
                                    <TableCell align="right" sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', pr: 3 }}>TASKS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedOutcomes.length > 0 ? (
                                    sortedOutcomes.slice(0, 8).map(([name, count], index) => {
                                        const isAll = name === 'All Outcomes';
                                        const percentage = (count / maxOutcomeCount) * 100;
                                        const barColor = isAll ? colors.primary : OUTCOME_COLORS[index % OUTCOME_COLORS.length];
                                        return (
                                            <TableRow key={name} hover onClick={() => onOutcomeClick?.(name)} sx={{ cursor: onOutcomeClick ? 'pointer' : 'default', height: 50 }}>
                                                <TableCell sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, fontSize: '0.8125rem', color: colors.primary, fontWeight: 500, pl: 3 }}>{name}</TableCell>
                                                <TableCell sx={{ py: 0, borderBottom: `1px solid ${colors.divider}` }}>
                                                    <Box sx={{ height: 12, bgcolor: '#E2E8F0', borderRadius: 0.5, overflow: 'hidden', width: '100%' }}>
                                                        <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: barColor, transition: 'width 0.5s ease' }} />
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, fontSize: '0.8125rem', fontWeight: 700, color: colors.primary, pr: 3 }}>{count}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: colors.secondary }}>No outcomes defined</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Releases Table */}
                <Paper elevation={0} sx={{ flex: 1, border: `1px solid ${colors.divider}`, borderRadius: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg }}>
                        <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem' }}>Releases</Typography>
                    </Box>
                    <TableContainer sx={{ flex: 1 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: colors.headerBg }}>
                                <TableRow sx={{ height: 32 }}>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', pl: 2 }}>NAME</TableCell>
                                    <TableCell align="right" sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', pr: 2 }}>VERSION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {product.releases && product.releases.length > 0 ? (
                                    product.releases.map(release => {
                                        const taskCount = tasks.filter(t => !t.releases?.length || t.releases.some((r: any) => (r.personalRelease?.id || r.id) === release.id)).length;
                                        return (
                                            <TableRow key={release.id} sx={{ height: 44 }}>
                                                <TableCell sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, fontSize: '0.8125rem', color: colors.primary, pl: 2 }}>{release.name}</TableCell>
                                                <TableCell align="right" sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, pr: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Chip label={taskCount} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                                                        <Chip label={`v${release.version || '?'}`} size="small" sx={{ bgcolor: '#0EA5E9', color: 'white', fontWeight: 600, height: 22, fontSize: '0.7rem' }} />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={2} sx={{ py: 1.5, color: colors.secondary, fontSize: '0.75rem', fontStyle: 'italic', pl: 2 }}>No releases</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Licenses Table */}
                <Paper elevation={0} sx={{ flex: 1, border: `1px solid ${colors.divider}`, borderRadius: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg }}>
                        <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem' }}>License</Typography>
                    </Box>
                    <TableContainer sx={{ flex: 1 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: colors.headerBg }}>
                                <TableRow sx={{ height: 32 }}>
                                    <TableCell sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', pl: 2 }}>TIER</TableCell>
                                    <TableCell align="right" sx={{ color: colors.secondary, fontWeight: 600, fontSize: '0.75rem', pr: 2 }}>TASKS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(product as any).licenses && (product as any).licenses.length > 0 ? (
                                    (product as any).licenses.map((license: any) => {
                                        return (
                                            <TableRow key={license.id} sx={{ height: 44 }}>
                                                <TableCell sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, fontSize: '0.8125rem', color: colors.primary, pl: 2 }}>{license.name}</TableCell>
                                                <TableCell align="right" sx={{ py: 0, borderBottom: `1px solid ${colors.divider}`, pr: 2 }}>{license.taskCount ?? '-'}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={2} sx={{ py: 1.5, color: colors.secondary, fontSize: '0.75rem', fontStyle: 'italic', pl: 2 }}>No active licenses</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>

            {/* Resources Panel */}
            {
                product.resources && product.resources.length > 0 && (
                    <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.divider}`, bgcolor: colors.headerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={700} color={colors.primary} sx={{ fontSize: '0.9rem' }}>Resources</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
                            {product.resources.slice(0, 3).map((resource: any, index: number) => {
                                // Resources are stored as array or specific object? Schema says Json. 
                                // Assuming { label, url }
                                return (
                                    <Box key={index} component="a" href={resource.url} target="_blank" rel="noopener noreferrer" sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, bgcolor: alpha(colors.ciscoBlue, 0.05), borderRadius: 1, border: `1px solid ${alpha(colors.ciscoBlue, 0.2)}`, textDecoration: 'none', '&:hover': { bgcolor: alpha(colors.ciscoBlue, 0.1) } }}>
                                        <Typography variant="body2" fontWeight={600} color={colors.ciscoBlue} sx={{ fontSize: '0.85rem' }}>{resource.label}</Typography>
                                        <Typography variant="caption" color={colors.secondary} sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.url}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Paper>
                )
            }
        </Box >
    );
};
