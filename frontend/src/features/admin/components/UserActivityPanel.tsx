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
    }
  }
`;

const GET_ENTITY_CHANGE_LOGS = gql`
  query EntityChangeLogs($period: String!, $userId: String) {
    entityChangeLogs(period: $period, userId: $userId) {
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

const LoginStatsTab: React.FC<{ userId?: string }> = ({ userId }) => {
    const [period, setPeriod] = useState<string>('week');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    const { data, loading, error, refetch } = useQuery(GET_LOGIN_STATS, {
        variables: { period, userId }
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error.message}</Alert>;

    const filteredStats = data.loginStats
        .filter((stat: any) => roleFilter === 'ALL' || stat.roles.includes(roleFilter));

    const uniqueRoles = Array.from(new Set(data.loginStats.flatMap((s: any) => s.roles))) as string[];

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Period</InputLabel>
                    <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="day">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="year">This Year</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Role</InputLabel>
                    <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
                        <MenuItem value="ALL">All Roles</MenuItem>
                        {uniqueRoles.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                    </Select>
                </FormControl>
                <IconButton onClick={() => refetch()}><RefreshIcon /></IconButton>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Login Count</TableCell>
                            <TableCell>Roles Active</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredStats.map((stat: any) => (
                            <TableRow key={stat.date}>
                                <TableCell>{stat.date}</TableCell>
                                <TableCell>{stat.count}</TableCell>
                                <TableCell>
                                    {stat.roles.map((r: string) => <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

const EntityChangesTab: React.FC<{ userId?: string }> = ({ userId }) => {
    const [period, setPeriod] = useState<string>('week');
    const { data, loading, error, refetch } = useQuery(GET_ENTITY_CHANGE_LOGS, {
        variables: { period, userId }
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error.message}</Alert>;

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Period</InputLabel>
                    <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="day">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="year">This Year</MenuItem>
                    </Select>
                </FormControl>
                <IconButton onClick={() => refetch()}><RefreshIcon /></IconButton>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Entity</TableCell>
                            <TableCell>Entity Name</TableCell>
                            <TableCell>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.entityChangeLogs.map((log: any) => (
                            <TableRow key={log.id}>
                                <TableCell>{format(new Date(log.createdAt), 'MM/dd HH:mm')}</TableCell>
                                <TableCell>{log.username}</TableCell>
                                <TableCell><Chip label={log.action} size="small" color={log.action === 'delete' ? 'error' : 'primary'} /></TableCell>
                                <TableCell>{log.entity}</TableCell>
                                <TableCell>{log.entityName}</TableCell>
                                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Tooltip title={log.details}>
                                        <Typography variant="caption">{log.details}</Typography>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
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

                {(tabValue === 1 || tabValue === 2) && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by User</InputLabel>
                        <Select
                            value={selectedUserId}
                            label="Filter by User"
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <MenuItem value="ALL">All Users</MenuItem>
                            {users.map((u: any) => (
                                <MenuItem key={u.id} value={u.id}>
                                    {u.fullName || u.username} ({u.username})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
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
                    <LoginStatsTab userId={selectedUserId === 'ALL' ? undefined : selectedUserId} />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <EntityChangesTab userId={selectedUserId === 'ALL' ? undefined : selectedUserId} />
                </TabPanel>
            </Paper>
        </Box>
    );
};
