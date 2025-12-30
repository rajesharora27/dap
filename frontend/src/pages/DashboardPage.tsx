import React from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Chip,
    Button,
    useTheme,
    Divider,
    IconButton,
    CircularProgress,
    alpha,
    Tooltip
} from '@mui/material';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '@features/auth';
import {
    AdminPanelSettings as ShieldIcon,
    Inventory2 as ProductIcon,
    Lightbulb as SolutionIcon,
    Business as CustomerIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Person as PersonIcon,
    Handshake as SupportIcon
} from '@shared/components/FAIcon';

// GraphQL Queries (Expanded for Real Data)
const DASHBOARD_DATA = gql`
  query DashboardData {
    products {
      edges {
        node {
          id
          name
          statusPercent
          tasks(first: 50) {
            edges {
              node {
                id
                name
                customAttrs
                telemetryAttributes {
                    id
                }
              }
            }
          }
        }
      }
    }
    customers {
        id
        name
        # status removed as it is not in schema
        overviewMetrics {
            adoption
            totalTasks
        }
        products {
            selectedOutcomes {
                name
            }
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

// Helper for Progress Bar
const SimpleLinearProgress: React.FC<{ value: number; color?: string }> = ({ value, color = '#3B82F6' }) => (
    <Box sx={{ width: '100%', height: 6, bgcolor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', bgcolor: color, borderRadius: 3, transition: 'width 0.5s ease-in-out' }} />
    </Box>
);

// 0. Context Ribbon Item
const ContextRibbonItem: React.FC<{
    label: string;
    value: number | string;
    icon: React.ReactNode;
    tooltip?: string;
    isLast?: boolean;
}> = ({ label, value, icon, tooltip, isLast }) => {
    const theme = useTheme();
    return (
        <Tooltip title={tooltip || ""} arrow placement="top">
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                borderRight: isLast ? 'none' : `1px solid ${theme.palette.divider}`,
                height: '100%',
                cursor: 'help'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{ color: 'text.secondary', display: 'flex', opacity: 0.8 }}>
                        {React.cloneElement(icon as React.ReactElement, { fontSize: 'medium' })}
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                        {value}
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </Typography>
            </Box>
        </Tooltip>
    );
};

// === Charts Components ===

// 1. Simple Donut Chart (SVG)
const DonutChart: React.FC<{
    data: { value: number; color: string }[];
    size?: number;
    strokeWidth?: number;
}> = ({ data, size = 120, strokeWidth = 12 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((item, index) => {
                const percentage = total > 0 ? item.value / total : 0;
                const dashArray = `${percentage * circumference} ${circumference}`;
                const offset = accumulatedOffset;
                accumulatedOffset -= percentage * circumference;

                return (
                    <circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                        strokeDashoffset={offset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                );
            })}
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="0.75rem"
                fontWeight="600"
            >
            </text>
        </svg>
    );
};

// 2. Horizontal Bar Chart
const HorizontalBarChart: React.FC<{
    data: { label: string; value: number; color: string }[];
}> = ({ data }) => {
    const max = Math.max(...data.map(d => d.value), 1); // Prevent div by zero
    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {data.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ width: 120, fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                    </Typography>
                    <Box sx={{ flex: 1, height: 8, bgcolor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{
                            width: `${(item.value / max) * 100}%`,
                            height: '100%',
                            bgcolor: item.color,
                            borderRadius: 4
                        }} />
                    </Box>
                    <Typography variant="caption" sx={{ width: 30, textAlign: 'right', fontWeight: 700 }}>
                        {item.value}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

// 3. Status Bar (Segmented / Gauge)
const StatusBar: React.FC<{
    data: { label: string; value: number; color: string }[];
    contextText?: string;
}> = ({ data, contextText }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', mb: 2 }}>
                {data.map((item, index) => (
                    <Box
                        key={index}
                        sx={{
                            width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                            bgcolor: item.color,
                            height: '100%'
                        }}
                    />
                ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                {data.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {total > 0 ? Math.round((item.value / total) * 100) : 0}% {item.label}
                        </Typography>
                    </Box>
                ))}
            </Box>
            {contextText && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontStyle: 'italic' }}>
                    {contextText}
                </Typography>
            )}
        </Box>
    );
};

// 4. Insight Card Wrapper
const InsightCard: React.FC<{
    title: string;
    tooltip?: string;
    children: React.ReactNode;
}> = ({ title, tooltip, children }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            height: '100%',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'common.white',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            position: 'relative'
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {title}
            </Typography>
            {tooltip && (
                <Tooltip title={tooltip} arrow placement="top">
                    <InfoIcon sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help', '&:hover': { color: 'primary.main' } }} />
                </Tooltip>
            )}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {children}
        </Box>
    </Paper>
);

export const DashboardPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const { loading, data, error } = useQuery(DASHBOARD_DATA, {
        skip: !user,
        // Remove aggressive cache-and-network to prevent loops on error
    });

    // Raw Data Access
    const products = data?.products?.edges?.map((e: any) => e.node) || [];
    const customers = data?.customers || [];
    const solutions = data?.solutions?.edges?.map((e: any) => e.node) || [];

    // --- REAL DATA AGGREGATION ---

    // 1. Adoption Progress (Replaces Pipeline Donut)
    const adoptionProgressData = React.useMemo(() => {
        if (customers.length === 0) return [];
        return customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            progress: c.overviewMetrics?.adoption || 0,
            status: c.overviewMetrics?.adoption >= 90 ? 'Completed' : c.overviewMetrics?.adoption > 20 ? 'In-Progress' : 'Onboarding',
            color: c.overviewMetrics?.adoption >= 90 ? '#1E3A8A' : c.overviewMetrics?.adoption > 20 ? '#10B981' : '#3B82F6'
        })).sort((a: any, b: any) => b.progress - a.progress).slice(0, 5); // Top 5
    }, [customers]);

    // 2. Top Selected Outcomes (Aggregated from Customer Products)
    const outcomeData = React.useMemo(() => {
        const counts: Record<string, number> = {};
        let totalCount = 0;

        customers.forEach((c: any) => {
            c.products?.forEach((cp: any) => {
                cp.selectedOutcomes?.forEach((o: any) => {
                    counts[o.name] = (counts[o.name] || 0) + 1;
                    totalCount++;
                });
            });
        });

        const sorted = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .map(([label, value]) => ({ label, value, color: '#3B82F6' }))
            .slice(0, 3); // Top 3

        const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];
        const result = sorted.map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }));

        // Fallback if no outcomes found yet
        if (result.length === 0) {
            return [
                { label: 'No Outcomes Selected', value: 1, color: '#E2E8F0' }
            ];
        }
        return result;
    }, [customers]);

    // 3. Telemetry Coverage (Derived from Product Tasks)
    const telemetryData = React.useMemo(() => {
        let autoVerified = 0;
        let manual = 0;

        products.forEach((p: any) => {
            p.tasks?.edges?.forEach((te: any) => {
                const task = te.node;
                // Check if task has telemetry flag in customAttrs OR 'telemetry' in name OR has attributes defined
                const hasTelemetry =
                    task.customAttrs?.telemetry === true ||
                    (task.name && task.name.toLowerCase().includes('telemetry')) ||
                    (task.telemetryAttributes && task.telemetryAttributes.length > 0);

                if (hasTelemetry) autoVerified++;
                else manual++;
            });
        });

        const total = autoVerified + manual;

        // Fallback for demo/empty
        if (total === 0) {
            return {
                data: [
                    { label: 'Auto-Verified', value: 0, color: '#10B981' },
                    { label: 'Manual', value: 1, color: '#E2E8F0' },
                ],
                text: "No tasks found."
            };
        }

        return {
            data: [
                { label: 'Auto-Verified', value: autoVerified, color: '#10B981' },
                { label: 'Manual', value: manual, color: '#E2E8F0' },
            ],
            text: `${total} Tasks tracked.`
        };
    }, [products]);

    // --- RBAC & Visibility ---

    // Role Logic
    const isSME = user?.role === 'SME';
    const isCSS = user?.role === 'CSS';
    // Admin sees everything

    const showProductOutcomes = !isCSS; // SME & Admin
    const showDeployment = !isSME;      // CSS & Admin
    const showTelemetry = !isCSS;       // SME & Admin (Technical Metric)


    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#F1F5F9' }}>
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3, color: 'error.main', bgcolor: '#FEF2F2', borderRadius: 2 }}>
            <Typography variant="h6">Error Loading Dashboard</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{error.message}</Typography>
        </Box>
    );

    const getRoleBadge = () => {
        if (isSME) return { label: 'SME ACCOUNT', icon: <PersonIcon style={{ fontSize: 12, color: 'white' }} /> };
        if (isCSS) return { label: 'CUSTOMER SUCCESS', icon: <SupportIcon style={{ fontSize: 12, color: 'white' }} /> };
        if (user?.isAdmin || user?.role === 'ADMIN') return { label: 'ADMINISTRATOR', icon: <ShieldIcon style={{ fontSize: 12, color: 'white' }} /> };
        return { label: 'STANDARD ACCOUNT', icon: <PersonIcon style={{ fontSize: 12, color: 'white' }} /> };
    };

    const roleBadge = getRoleBadge();

    return (
        <Box sx={{
            p: { xs: 2, md: 3 },
            bgcolor: '#F1F5F9', // Light Gray Background
            minHeight: '100vh',
            maxWidth: 1600,
            mx: 'auto'
        }}>

            {/* === 1. Top Context Ribbon === */}
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 90,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'common.white',
                    mb: 3,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
            >
                {!isCSS && (
                    <ContextRibbonItem
                        value={products.length || 0}
                        label="Products"
                        icon={<ProductIcon />}
                        tooltip="Total number of active products currently managed in the portfolio."
                        isLast={!(!isCSS) && !(!isSME)}
                    />
                )}
                {!isCSS && (
                    <ContextRibbonItem
                        value={solutions.length || 0}
                        label="Solutions"
                        icon={<SolutionIcon />}
                        tooltip="Number of defined solutions."
                        isLast={!(!isSME)}
                    />
                )}
                {!isSME && (
                    <ContextRibbonItem
                        value={customers.length || 0}
                        label="Customers"
                        icon={<CustomerIcon />}
                        tooltip="Count of active customers."
                        isLast
                    />
                )}
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* === Middle Section: Strategic Metrics (Using Real Data) === */}
                <Grid container spacing={3}>
                    {/* Card 1: Adoption Progress (Detailed List) */}
                    {showDeployment && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <InsightCard
                                title="Adoption Progress"
                                tooltip="Progress of individual customer adoption plans."
                            >
                                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {adoptionProgressData.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                                            <Typography variant="body2">No active plans found.</Typography>
                                        </Box>
                                    ) : (
                                        adoptionProgressData.map((item: any) => (
                                            <Box key={item.id}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                        {item.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: item.color }}>
                                                        {Math.round(item.progress)}%
                                                    </Typography>
                                                </Box>
                                                <SimpleLinearProgress value={item.progress} color={item.color} />
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </InsightCard>
                        </Grid>
                    )}

                    {/* Card 2: Top Selected Outcomes (Bar) */}
                    {showProductOutcomes && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <InsightCard
                                title="Top Selected Outcomes"
                                tooltip="Strategic business outcomes driving adoption based on customer selection."
                            >
                                <HorizontalBarChart
                                    data={outcomeData}
                                />
                            </InsightCard>
                        </Grid>
                    )}

                    {/* Card 3: Telemetry Coverage (Gauge/Status) */}
                    {showTelemetry && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <InsightCard
                                title="Telemetry Coverage"
                                tooltip="Percentage of tasks verified via telemetry signals (Auto-Verified)."
                            >
                                <StatusBar
                                    data={telemetryData.data}
                                    contextText={telemetryData.text}
                                />
                            </InsightCard>
                        </Grid>
                    )}
                </Grid>

                {/* === Bottom Section: Platform Capabilities === */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 0,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: 'common.white',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: '#F8FAFC' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Platform Capabilities
                        </Typography>
                    </Box>
                    <Grid container sx={{ '& > div': { borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child, &:nth-last-child(2)': { borderBottom: 'none' } } }}>
                        {[
                            { title: 'Single Source of Truth', desc: 'Centrally define all adoption components for products and solutions.', icon: <CheckCircleIcon /> },
                            { title: 'Accelerated Time-to-Value', desc: 'Streamline implementation methodology for predictable outcomes.', icon: <ArrowForwardIcon /> },
                            { title: 'Dynamic Outcome Plans', desc: 'Adoption plans dynamically adjust based on selected business outcomes.', icon: <WarningIcon /> },
                            { title: 'Context-Aware', desc: 'Plans automatically adjust to current licenses and software versions.', icon: <CheckCircleIcon /> },
                            { title: 'Environment Tags', desc: 'Customize adoption plans based on customer environment characteristics.', icon: <CheckCircleIcon /> },
                            { title: 'AI Agent', desc: 'Query and navigate adoption data using natural language.', icon: <ArrowForwardIcon /> }
                        ].map((feature, index) => (
                            <Grid key={index} size={{ xs: 12, md: 6 }} sx={{
                                p: 3,
                                borderRight: { md: index % 2 === 0 ? `1px solid ${theme.palette.divider}` : 'none' },
                                display: 'flex',
                                alignItems: 'start',
                                gap: 2,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                            }}>
                                <Box sx={{
                                    minWidth: 4,
                                    height: 40,
                                    bgcolor: theme.palette.primary.main,
                                    borderRadius: 1,
                                    opacity: 0.8,
                                    alignSelf: 'center',
                                    mr: 1
                                }} />
                                <div>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                        {feature.desc}
                                    </Typography>
                                </div>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
};
