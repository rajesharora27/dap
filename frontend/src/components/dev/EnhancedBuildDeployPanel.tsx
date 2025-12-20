import React, { useState, useEffect, useRef } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Alert,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Build,
    PlayArrow,
    Refresh,
    CloudUpload,
    CheckCircle,
    Error as ErrorIcon,
    Code,
    Timeline
} from '../../components/common/FAIcon';

interface BuildResult {
    success: boolean;
    output: string;
    duration?: number;
    target?: string;
}

interface BuildHistory {
    hash: string;
    message: string;
    author: string;
    date: string;
    type: 'build' | 'deploy';
}

export const EnhancedBuildDeployPanel: React.FC = () => {
    const [buildTarget, setBuildTarget] = useState<'frontend' | 'backend'>('frontend');
    const [building, setBuilding] = useState(false);
    const [currentOperation, setCurrentOperation] = useState<string>('');
    const [output, setOutput] = useState<string>('');
    const [result, setResult] = useState<BuildResult | null>(null);
    const [history, setHistory] = useState<BuildHistory[]>([]);

    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/build/history`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setHistory(data.history || []);
        } catch (error) {
            console.error('Failed to fetch build history:', error);
        }
    };

    const runBuildStream = async (endpoint: string, body: any) => {
        const startTime = Date.now();

        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(body)
            });

            if (!response.body) throw new Error('ReadableStream not supported');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'start') {
                                setOutput(prev => prev + `▶ ${data.message}\n`);
                            } else if (data.type === 'output') {
                                setOutput(prev => prev + data.data);
                            } else if (data.type === 'complete') {
                                setResult({
                                    success: data.success,
                                    output: 'Detailed output above',
                                    duration: Date.now() - startTime,
                                    target: data.target || 'build'
                                });
                                setOutput(prev => prev + `\n✅ Process completed successfully!\n`);
                                if (data.success) setTimeout(fetchHistory, 1000);
                            } else if (data.type === 'error') {
                                setOutput(prev => prev + `\n❌ Error: ${data.message}\n`);
                                setResult({
                                    success: false,
                                    output: 'Detailed output above', // We typically have the output in the state anyway
                                    duration: Date.now() - startTime
                                });
                            }
                        } catch (e) {
                            // Partial chunk
                        }
                    }
                }
            }
        } catch (error: any) {
            setOutput(prev => prev + `\n❌ System Error: ${error.message}\n`);
            setResult({
                success: false,
                output: '',
                duration: Date.now() - startTime
            });
        } finally {
            setBuilding(false);
            setCurrentOperation('');
        }
    };

    const runBuild = async (target: 'frontend' | 'backend') => {
        setBuilding(true);
        setCurrentOperation(`Building ${target}...`);
        setOutput(`🚀 Starting ${target} build (streaming)...\n\n`);
        setResult(null);

        await runBuildStream('/build/stream', { target });
    };

    const runFullRebuild = async () => {
        setBuilding(true);
        setCurrentOperation('Full rebuild in progress...');
        setOutput('🔧 Starting full rebuild (./dap rebuild) in streaming mode...\nThis WILL NOT wipe your database.\n\n');
        setResult(null);

        await runBuildStream('/build/rebuild', {});
    };

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build /> Build & Deploy
                </Typography>

                {/* Quick Guide */}
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Build Options:
                    </Typography>
                    <Typography variant="caption" component="div">
                        • <strong>Build:</strong> Compile selected target (frontend or backend)<br />
                        • <strong>Full Rebuild:</strong> Clean build + restart all services<br />
                        • <strong>Deploy:</strong> Instructions for production deployment
                    </Typography>
                </Alert>

                <Divider sx={{ my: 2 }} />

                {/* Build Target Selection */}
                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>Build Target</InputLabel>
                        <Select
                            value={buildTarget}
                            label="Build Target"
                            onChange={(e) => setBuildTarget(e.target.value as 'frontend' | 'backend')}
                            disabled={building}
                        >
                            <MenuItem value="frontend">Frontend Only (Vite build ~30s)</MenuItem>
                            <MenuItem value="backend">Backend Only (TypeScript compile ~10s)</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
                    <Tooltip title={`Build ${buildTarget} using npm run build`}>
                        <Button
                            variant="contained"
                            startIcon={building ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                            onClick={() => runBuild(buildTarget)}
                            disabled={building}
                        >
                            {building ? currentOperation || 'Building...' : 'Build'}
                        </Button>
                    </Tooltip>

                    <Tooltip title="Full rebuild: stop, clean build, restart">
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={runFullRebuild}
                            disabled={building}
                        >
                            Full Rebuild
                        </Button>
                    </Tooltip>

                    <Tooltip title="View deployment instructions">
                        <Button
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            onClick={() => {
                                setOutput(`📦 Production Deployment Instructions

To deploy to production:

1. From /data/dap directory:
   ./deploy/deploy-to-production.sh

2. Or manually:
   • Build: npm run build (frontend & backend)
   • Copy files to production server
   • Run migrations: npx prisma migrate deploy
   • Restart services

3. Automated deployment requires:
   • DEPLOY_PROD_HOST environment variable
   • SSH access configured
   • Production server ready

See /data/dap/deploy/ for deployment scripts.
`);
                            }}
                            disabled={building}
                        >
                            Deploy Instructions
                        </Button>
                    </Tooltip>

                    <Box sx={{ flexGrow: 1 }} />

                    {result && (
                        <Chip
                            icon={result.success ? <CheckCircle /> : <ErrorIcon />}
                            label={result.duration ? `${formatDuration(result.duration)}` : 'Complete'}
                            color={result.success ? 'success' : 'error'}
                            variant="outlined"
                        />
                    )}
                </Stack>

                {/* Progress */}
                {building && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {currentOperation}
                        </Typography>
                    </Box>
                )}

                {/* Result Summary */}
                {result && (
                    <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                        {result.success ? (
                            <>
                                ✅ Build completed successfully for <strong>{result.target}</strong>
                                {result.duration && ` in ${formatDuration(result.duration)}`}
                            </>
                        ) : (
                            <>
                                ❌ Build failed for <strong>{result.target}</strong>. Check output below.
                            </>
                        )}
                    </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Build Output */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Build Output
                    </Typography>
                    <Paper
                        ref={outputRef}
                        elevation={0}
                        sx={{
                            p: 2,
                            bgcolor: '#1e1e1e',
                            color: '#d4d4d4',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            maxHeight: '400px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}
                    >
                        {output || (
                            <Typography variant="caption" color="text.secondary">
                                Select a build target and click "Build" to start...
                            </Typography>
                        )}
                    </Paper>
                </Box>

                {/* Build History */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timeline /> Recent Activity
                    </Typography>
                    {history.length === 0 ? (
                        <Alert severity="info">No recent build or deploy history available</Alert>
                    ) : (
                        <List dense sx={{ maxHeight: '300px', overflow: 'auto' }}>
                            {history.map((item, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        {item.type === 'build' ? <Build color="primary" /> : <CloudUpload color="secondary" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.message}
                                        secondary={`${item.author} • ${formatDate(item.date)} • ${item.hash.substring(0, 7)}`}
                                    />
                                    <Chip
                                        label={item.type}
                                        size="small"
                                        color={item.type === 'build' ? 'primary' : 'secondary'}
                                        variant="outlined"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Note */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Note:</strong> Build processes run in streaming mode. Output appears in real-time.
                        Full Rebuild runs <code>./dap rebuild</code> which preserves your database.
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
};
