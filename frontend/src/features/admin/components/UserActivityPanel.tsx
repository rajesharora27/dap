import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import {
    History as HistoryIcon,
    Login as LoginIcon,
    Devices as SessionsIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useQuery, gql } from '@apollo/client';
import { format } from 'date-fns';

const GET_USERS = gql`
  query Users {
    users {
      id
      username
      fullName
    }
  }
`;

const GET_ACTIVE_SESSIONS = gql`
  query ActiveSessions {
    activeSessions {
      id
      userId
      username
      createdAt
      expiresAt
    }
  }
`;

const GET_LOGIN_STATS = gql`
  query LoginStats($period: String!, $userId: String) {
    loginStats(period: $period, userId: $userId) {
      date
      count
      roles
      users {
        id
        username
        roles
        loginTime
      }
    }
  }
`;

const GET_ENTITY_CHANGE_LOGS = gql`
  query EntityChangeLogs($period: String!, $userId: String, $entity: String) {
    entityChangeLogs(period: $period, userId: $userId, entity: $entity) {
      id
      action
      entity
      entityId
      entityName
      createdAt
      userId
      username
      details
    }
  }
`;

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const ActiveSessionsTab: React.FC = () => {
    const { data, loading, error, refetch } = useQuery(GET_ACTIVE_SESSIONS, {
        pollInterval: 30000
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error.message}</Alert>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Active Sessions</Typography>
                <IconButton onClick={() => refetch()}><RefreshIcon /></IconButton>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Login Time</TableCell>
                            <TableCell>Expires At</TableCell>
                            <TableCell>Session ID</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.activeSessions.map((session: any) => (
                            <TableRow key={session.id}>
                                <TableCell>{session.username}</TableCell>
                                <TableCell>{format(new Date(session.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                                <TableCell>{format(new Date(session.expiresAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                                <TableCell><Typography variant="caption">{session.id}</Typography></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

const LoginStatsTab: React.FC<{ users: any[] }> = ({ users }) => {
    const [period, setPeriod] = useState<string>('week');
    const [userId, setUserId] = useState<string>('ALL');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const { data, loading, error, refetch } = useQuery(GET_LOGIN_STATS, {
        variables: { period, userId: userId === 'ALL' ? undefined : userId }
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error.message}</Alert>;

    const filteredStats = data.loginStats
        .filter((stat: any) => roleFilter === 'ALL' || stat.roles.includes(roleFilter))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const uniqueRoles = Array.from(new Set(data.loginStats.flatMap((s: any) => s.roles))) as string[];

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Period</InputLabel>
                    <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="day">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="year">This Year</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>User</InputLabel>
                    <Select value={userId} label="User" onChange={(e) => setUserId(e.target.value)}>
                        <MenuItem value="ALL">All Users</MenuItem>
                        {users.map(u => (
                            <MenuItem key={u.id} value={u.id}>
                                {u.fullName || u.username} ({u.username})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Role</InputLabel>
                    <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
                        <MenuItem value="ALL">All Roles</MenuItem>
                        {uniqueRoles.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                    </Select>
                </FormControl>
                <IconButton onClick={() => refetch()}><RefreshIcon /></IconButton>
            </Box>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Login Count</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredStats.map((stat: any) => (
                            <React.Fragment key={stat.date}>
                                <TableRow
                                    hover
                                    onClick={() => setSelectedDate(selectedDate === stat.date ? null : stat.date)}
                                    selected={selectedDate === stat.date}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{stat.date}</TableCell>
                                    <TableCell>{stat.count}</TableCell>
                                </TableRow>
                                {selectedDate === stat.date && (
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell colSpan={2}>
                                            <Box sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                                                    Users Logged In on {stat.date}
                                                </Typography>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>User ID</TableCell>
                                                            <TableCell>Username</TableCell>
                                                            <TableCell>Roles</TableCell>
                                                            <TableCell>Login Time</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {stat.users?.map((u: any, idx: number) => (
                                                            <TableRow key={`${u.id}-${idx}`}>
                                                                <TableCell>
                                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                                        {u.id}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 500 }}>{u.username}</TableCell>
                                                                <TableCell>
                                                                    {u.roles?.map((r: string) => (
                                                                        <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />
                                                                    ))}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {new Date(u.loginTime).toLocaleTimeString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

// Helper to check if a string looks like a database ID (cuid or uuid)
const looksLikeId = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    // CUID pattern: starts with 'c' and is ~25 chars of lowercase alphanumeric
    const cuidPattern = /^c[a-z0-9]{20,30}$/;
    // UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return cuidPattern.test(str) || uuidPattern.test(str);
};

// Helper to format a value, hiding IDs
const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '(empty)';
    if (typeof val === 'string' && looksLikeId(val)) return '(reference)';
    if (typeof val === 'object') {
        // For arrays and objects, stringify but skip ID fields
        const cleaned = JSON.parse(JSON.stringify(val, (key, v) => {
            if (key.endsWith('Id') || key === 'id') return undefined;
            return v;
        }));
        return JSON.stringify(cleaned);
    }
    return String(val);
};

// Helper to format change details in a user-friendly way
const formatChangeDetails = (details: string, entityName: string, action: string) => {
    try {
        const parsed = JSON.parse(details);
        const lines: string[] = [];
        
        // Extract name from various places in the details
        const extractedName = parsed.name || parsed.input?.name || parsed.before?.name || parsed.after?.name || parsed.key;
        const displayName = extractedName || (looksLikeId(entityName) ? '(deleted entity)' : entityName);
        
        // Show name prominently
        if (displayName && displayName !== '(deleted entity)') {
            lines.push(`📌 ${displayName}`);
        }
        
        // Handle different detail formats
        if (parsed.changes && typeof parsed.changes === 'object') {
            const changeEntries = Object.entries(parsed.changes as Record<string, any>)
                .filter(([field]) => !field.endsWith('Id') && field !== 'id' && field !== 'updatedAt' && field !== 'createdAt');
            
            if (changeEntries.length > 0) {
                lines.push('📝 Changes:');
                for (const [field, change] of changeEntries) {
                    const from = formatValue((change as any).from);
                    const to = formatValue((change as any).to);
                    lines.push(`  • ${field}: ${from} → ${to}`);
                }
            }
        }
        
        if (parsed.before && parsed.after) {
            const changedFields = Object.keys(parsed.after)
                .filter(key => !key.endsWith('Id') && key !== 'id' && key !== 'updatedAt' && key !== 'createdAt')
                .filter(key => JSON.stringify(parsed.before[key]) !== JSON.stringify(parsed.after[key]));
            
            if (changedFields.length > 0) {
                lines.push('📝 Field Changes:');
                for (const key of changedFields) {
                    lines.push(`  • ${key}: ${formatValue(parsed.before[key])} → ${formatValue(parsed.after[key])}`);
                }
            }
        }
        
        // For simple input objects (create operations)
        if (parsed.input && !parsed.changes && !parsed.before) {
            const inputFields = Object.entries(parsed.input)
                .filter(([key]) => !key.endsWith('Id') && key !== 'id' && key !== 'name');
            
            if (inputFields.length > 0) {
                lines.push('📝 Created with:');
                for (const [key, val] of inputFields) {
                    lines.push(`  • ${key}: ${formatValue(val)}`);
                }
            }
        }
        
        // Show action-specific info
        if (action.toLowerCase().includes('delete')) {
            lines.push(`🗑️ Deleted: ${displayName}`);
        }
        
        // If nothing meaningful was extracted, show a simple summary
        if (lines.length === 0) {
            if (displayName) lines.push(`📌 ${displayName}`);
            lines.push(`Action: ${action}`);
        }
        
        return lines.join('\n');
    } catch (e) {
        return details;
    }
};

// Format entity name for display
const formatEntityName = (name: string): string => {
    if (!name) return '(unknown)';
    if (looksLikeId(name)) return '(deleted entity)';
    return name;
};

const EntityChangesTab: React.FC<{ users: any[] }> = ({ users }) => {
    const [period, setPeriod] = useState<string>('week');
    const [userId, setUserId] = useState<string>('ALL');
    const [entityFilter, setEntityFilter] = useState<string>('ALL');
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

    const { data, loading, error, refetch } = useQuery(GET_ENTITY_CHANGE_LOGS, {
        variables: {
            period,
            userId: userId === 'ALL' ? undefined : userId,
            entity: entityFilter === 'ALL' ? undefined : entityFilter
        }
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error.message}</Alert>;

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Period</InputLabel>
                    <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="day">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="year">This Year</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>User</InputLabel>
                    <Select value={userId} label="User" onChange={(e) => setUserId(e.target.value)}>
                        <MenuItem value="ALL">All Users</MenuItem>
                        {users.map(u => (
                            <MenuItem key={u.id} value={u.id}>
                                {u.fullName || u.username} ({u.username})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Entity Type</InputLabel>
                    <Select value={entityFilter} label="Entity Type" onChange={(e) => setEntityFilter(e.target.value)}>
                        <MenuItem value="ALL">All Entities</MenuItem>
                        <MenuItem value="Product">Product</MenuItem>
                        <MenuItem value="Solution">Solution</MenuItem>
                        <MenuItem value="Customer">Customer</MenuItem>
                        <MenuItem value="Task">Task</MenuItem>
                        <MenuItem value="Outcome">Outcome</MenuItem>
                        <MenuItem value="Release">Release</MenuItem>
                        <MenuItem value="License">License</MenuItem>
                        <MenuItem value="Tag">Tag</MenuItem>
                        <MenuItem value="User">User</MenuItem>
                        <MenuItem value="Role">Role</MenuItem>
                        <MenuItem value="AppSetting">Settings</MenuItem>
                    </Select>
                </FormControl>
                <IconButton onClick={() => refetch()}><RefreshIcon /></IconButton>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Entity</TableCell>
                            <TableCell>Name</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.entityChangeLogs.map((log: any) => (
                            <React.Fragment key={log.id}>
                                <TableRow
                                    hover
                                    onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                                    selected={selectedLogId === log.id}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{format(new Date(log.createdAt), 'MM/dd HH:mm')}</TableCell>
                                    <TableCell>{log.username}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.action}
                                            size="small"
                                            color={log.action.includes('DELETE') || log.action === 'delete' ? 'error' : 'primary'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{log.entity}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, fontStyle: looksLikeId(log.entityName) ? 'italic' : 'normal', color: looksLikeId(log.entityName) ? 'text.secondary' : 'text.primary' }}>
                                        {formatEntityName(log.entityName)}
                                    </TableCell>
                                </TableRow>
                                {selectedLogId === log.id && (
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell colSpan={5}>
                                            <Box sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <HistoryIcon fontSize="small" /> Change Details - {log.entityName}
                                                </Typography>
                                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                                                    <Typography
                                                        variant="body2"
                                                        component="pre"
                                                        sx={{
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            fontFamily: 'system-ui, -apple-system, sans-serif',
                                                            color: 'text.primary',
                                                            lineHeight: 1.8
                                                        }}
                                                    >
                                                        {formatChangeDetails(log.details, log.entityName, log.action)}
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export const UserActivityPanel: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [selectedUserId, setSelectedUserId] = useState<string>('ALL');

    const { data: userData } = useQuery(GET_USERS);
    const users = userData?.users || [];

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon sx={{ mr: 2, fontSize: '2.5rem', color: 'primary.main' }} />
                    User Activity Tracking
                </Typography>
            </Box>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<SessionsIcon />} label="Active Sessions" iconPosition="start" />
                    <Tab icon={<LoginIcon />} label="Login Statistics" iconPosition="start" />
                    <Tab icon={<HistoryIcon />} label="Entity Changes" iconPosition="start" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <ActiveSessionsTab />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <LoginStatsTab users={users} />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <EntityChangesTab users={users} />
                </TabPanel>
            </Paper>
        </Box>
    );
};
