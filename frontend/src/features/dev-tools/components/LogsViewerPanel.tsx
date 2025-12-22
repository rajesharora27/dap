import React, { useState, useEffect, useRef } from 'react';
import { getDevApiBaseUrl } from '@/config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Article as LogIcon,
    Delete as ClearIcon,
    Download as DownloadIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Pause as PauseIcon,
    PlayArrow as PlayIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    BugReport as DebugIcon,
    Info as InfoIconOutlined
} from '@shared/components/FAIcon';

interface LogEntry {
    timestamp: string;
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    meta?: any;
}

export const LogsViewerPanel: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState<string[]>(['error', 'warn', 'info', 'debug']);
    const [autoScroll, setAutoScroll] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchLogs = async () => {
        if (isPaused) return;

        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/logs`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        }
    };

    useEffect(() => {
        fetchLogs();
        intervalRef.current = setInterval(fetchLogs, 2000); // Refresh every 2 seconds

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPaused]);

    useEffect(() => {
        const filtered = logs.filter(log => {
            const matchesLevel = levelFilter.includes(log.level);
            const matchesSearch = searchTerm === '' ||
                log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                JSON.stringify(log.meta || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesLevel && matchesSearch;
        });
        setFilteredLogs(filtered);
    }, [logs, searchTerm, levelFilter]);

    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredLogs, autoScroll]);

    const handleLevelFilterChange = (event: React.MouseEvent<HTMLElement>, newFilters: string[]) => {
        if (newFilters.length > 0) {
            setLevelFilter(newFilters);
        }
    };

    const clearLogs = async () => {
        try {
            await fetch(`${getDevApiBaseUrl()}/api/dev/logs/clear`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setLogs([]);
        } catch (error) {
            console.error('Failed to clear logs', error);
        }
    };

    const exportLogs = () => {
        const logsText = filteredLogs.map(log =>
            `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${log.meta ? '\n' + JSON.stringify(log.meta, null, 2) : ''}`
        ).join('\n\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error':
                return <ErrorIcon color="error" fontSize="small" />;
            case 'warn':
                return <WarningIcon color="warning" fontSize="small" />;
            case 'info':
                return <InfoIcon color="info" fontSize="small" />;
            case 'debug':
                return <DebugIcon color="action" fontSize="small" />;
            default:
                return <InfoIcon fontSize="small" />;
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error':
                return '#f44336';
            case 'warn':
                return '#ff9800';
            case 'info':
                return '#2196f3';
            case 'debug':
                return '#9e9e9e';
            default:
                return '#000';
        }
    };

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIconOutlined color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Live Logs Viewer Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Monitor real-time application logs from the backend server. View errors, warnings, info messages, and debug output.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Features:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Real-time Updates:</strong> Auto-refreshes every 2 seconds</li>
                                <li><strong>Level Filtering:</strong> Filter by Error, Warn, Info, or Debug</li>
                                <li><strong>Search:</strong> Search within log messages and metadata</li>
                                <li><strong>Export:</strong> Download logs as text file</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> Backend server must be running. Logs are kept in memory (last 1000 entries).
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> Logs update automatically. Use filters to narrow results. Pause to inspect specific entries.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LogIcon /> Live Logs Viewer
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={isPaused ? "Resume automatic log updates" : "Pause automatic log updates to inspect entries"} arrow>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={isPaused ? <PlayIcon /> : <PauseIcon />}
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                    </Tooltip>
                    <Tooltip title="Manually refresh logs from server" arrow>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={fetchLogs}
                        >
                            Refresh
                        </Button>
                    </Tooltip>
                    <Tooltip title="Download filtered logs as a text file" arrow>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={exportLogs}
                        >
                            Export
                        </Button>
                    </Tooltip>
                    <Tooltip title="Clear all logs from server memory (cannot be undone)" arrow>
                        <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<ClearIcon />}
                            onClick={clearLogs}
                        >
                            Clear
                        </Button>
                    </Tooltip>
                </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                        Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> log entries
                        {isPaused && <Chip label="PAUSED" color="warning" size="small" sx={{ ml: 2 }} />}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">Auto-scroll:</Typography>
                        <ToggleButton
                            value="autoScroll"
                            selected={autoScroll}
                            onChange={() => setAutoScroll(!autoScroll)}
                            size="small"
                        >
                            {autoScroll ? 'ON' : 'OFF'}
                        </ToggleButton>
                    </Box>
                </Box>
            </Alert>

            {/* Filters */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    <ToggleButtonGroup
                        value={levelFilter}
                        onChange={handleLevelFilterChange}
                        size="small"
                        color="primary"
                    >
                        <ToggleButton value="error">
                            <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Error
                        </ToggleButton>
                        <ToggleButton value="warn">
                            <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Warn
                        </ToggleButton>
                        <ToggleButton value="info">
                            <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Info
                        </ToggleButton>
                        <ToggleButton value="debug">
                            <DebugIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Debug
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            {/* Logs Display */}
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    bgcolor: '#1e1e1e',
                    maxHeight: '60vh',
                    overflow: 'auto',
                    fontFamily: 'monospace'
                }}
            >
                {filteredLogs.length === 0 ? (
                    <Typography color="grey.500" align="center" sx={{ py: 4 }}>
                        No logs to display
                    </Typography>
                ) : (
                    filteredLogs.map((log, index) => (
                        <Box
                            key={index}
                            sx={{
                                py: 0.5,
                                px: 1,
                                borderLeft: `3px solid ${getLevelColor(log.level)}`,
                                mb: 0.5,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.06)'
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                {getLevelIcon(log.level)}
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'grey.500', minWidth: 180, fontFamily: 'monospace' }}
                                >
                                    {new Date(log.timestamp).toLocaleString()}
                                </Typography>
                                <Chip
                                    label={log.level.toUpperCase()}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: getLevelColor(log.level),
                                        color: 'white'
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flex: 1,
                                        color: 'grey.300',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {log.message}
                                </Typography>
                            </Box>
                            {log.meta && (
                                <Box sx={{ ml: 25, mt: 0.5 }}>
                                    <Typography
                                        variant="caption"
                                        component="pre"
                                        sx={{
                                            color: 'grey.600',
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        {JSON.stringify(log.meta, null, 2)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ))
                )}
                <div ref={logsEndRef} />
            </Paper>
        </Box>
    );
};
