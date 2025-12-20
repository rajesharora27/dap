/**
 * QueryResultDisplay Component
 * 
 * Smart container for displaying AI query results.
 * Automatically chooses the best display format based on data type:
 * - Arrays -> DataTable
 * - Objects -> Key-value display
 * - Primitives -> Simple text
 * - Markdown -> Rendered markdown
 * 
 * @version 1.0.0
 * @created 2025-12-06
 */

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Collapse,
    Chip,
    Button,
    Divider,
    useTheme,
    alpha,
} from '@mui/material';
import {
    ContentCopy,
    Check,
    ExpandMore,
    ExpandLess,
    Code,
    TableChart,
    DataObject,
    TextFields,
    Download,
} from '../../components/common/FAIcon';
import DataTable, { DataTableColumn } from './DataTable';

export interface QueryResultDisplayProps {
    /** The data to display */
    data: any;
    /** Optional title for the results section */
    title?: string;
    /** Force a specific display mode */
    displayMode?: 'auto' | 'table' | 'json' | 'text';
    /** Maximum height before scrolling */
    maxHeight?: number;
    /** Show raw JSON toggle */
    showRawToggle?: boolean;
    /** Custom table columns */
    columns?: DataTableColumn[];
    /** Enable export functionality */
    enableExport?: boolean;
    /** Compact display */
    compact?: boolean;
    /** Row click handler for table display */
    onRowClick?: (row: any, index: number) => void;
}

type DisplayType = 'table' | 'json' | 'keyvalue' | 'text' | 'count' | 'empty';

/**
 * Determine the best display type for data
 */
function detectDisplayType(data: any): DisplayType {
    if (data === null || data === undefined) {
        return 'empty';
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return 'empty';
        // Check if array contains objects (table display)
        if (typeof data[0] === 'object' && data[0] !== null) {
            return 'table';
        }
        // Primitive array
        return 'text';
    }

    if (typeof data === 'object') {
        // Check for count/aggregate result
        const keys = Object.keys(data);
        if (keys.length === 1 && typeof data[keys[0]] === 'number') {
            return 'count';
        }
        // Object with multiple keys
        if (keys.length <= 10 && !keys.some(k => typeof data[k] === 'object')) {
            return 'keyvalue';
        }
        return 'json';
    }

    if (typeof data === 'number') {
        return 'count';
    }

    return 'text';
}

/**
 * Format large numbers with commas
 */
function formatNumber(num: number): string {
    return num.toLocaleString();
}

/**
 * Export data as CSV
 */
function exportToCSV(data: any[], filename: string = 'export.csv') {
    if (!Array.isArray(data) || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
                if (typeof val === 'object') return `"${JSON.stringify(val)}"`;
                return String(val);
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Export data as JSON
 */
function exportToJSON(data: any, filename: string = 'export.json') {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
    URL.revokeObjectURL(url);
}

export const QueryResultDisplay: React.FC<QueryResultDisplayProps> = ({
    data,
    title,
    displayMode = 'auto',
    maxHeight = 400,
    showRawToggle = true,
    columns,
    enableExport = true,
    compact = false,
    onRowClick,
}) => {
    const theme = useTheme();
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);

    const detectedType = displayMode === 'auto' ? detectDisplayType(data) : displayMode as DisplayType;

    const handleCopy = async () => {
        const textValue = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        await navigator.clipboard.writeText(textValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getIcon = () => {
        switch (detectedType) {
            case 'table': return <TableChart sx={{ fontSize: 16 }} />;
            case 'json': return <DataObject sx={{ fontSize: 16 }} />;
            case 'count': return <TextFields sx={{ fontSize: 16 }} />;
            default: return <TextFields sx={{ fontSize: 16 }} />;
        }
    };

    // Empty state
    if (detectedType === 'empty') {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.grey[500], 0.05),
                }}
            >
                <Typography color="text.secondary">No data to display</Typography>
            </Paper>
        );
    }

    // Count display (single number)
    if (detectedType === 'count') {
        const value = typeof data === 'object' ? Object.values(data)[0] : data;
        const label = typeof data === 'object' ? Object.keys(data)[0] : 'Result';

        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                }}
            >
                <Typography variant="h2" color="primary.main" fontWeight={700}>
                    {formatNumber(value as number)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {label.charAt(0).toUpperCase() + label.slice(1).replace(/([A-Z])/g, ' $1')}
                </Typography>
            </Paper>
        );
    }

    // Key-Value display
    if (detectedType === 'keyvalue') {
        return (
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                {title && (
                    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
                    </Box>
                )}
                <Box sx={{ p: 2 }}>
                    {Object.entries(data).map(([key, value], idx) => (
                        <Box
                            key={key}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 1,
                                borderBottom: idx < Object.keys(data).length - 1 ? 1 : 0,
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                                {typeof value === 'boolean' ? (
                                    <Chip
                                        size="small"
                                        label={value ? 'Yes' : 'No'}
                                        color={value ? 'success' : 'default'}
                                    />
                                ) : (
                                    String(value)
                                )}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Paper>
        );
    }

    return (
        <Box>
            {/* Header with controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {title && (
                        <Typography variant="subtitle2" fontWeight={600}>
                            {title}
                        </Typography>
                    )}
                    <Chip
                        size="small"
                        icon={getIcon()}
                        label={Array.isArray(data) ? `${data.length} items` : detectedType}
                        sx={{ height: 24 }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {showRawToggle && (
                        <Tooltip title={showRaw ? 'Show formatted' : 'Show raw JSON'}>
                            <IconButton size="small" onClick={() => setShowRaw(!showRaw)}>
                                <Code sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                        <IconButton size="small" onClick={handleCopy}>
                            {copied ? (
                                <Check sx={{ fontSize: 18, color: 'success.main' }} />
                            ) : (
                                <ContentCopy sx={{ fontSize: 18 }} />
                            )}
                        </IconButton>
                    </Tooltip>

                    {enableExport && Array.isArray(data) && (
                        <>
                            <Tooltip title="Export as CSV">
                                <IconButton size="small" onClick={() => exportToCSV(data)}>
                                    <Download sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            </Box>

            {/* Content */}
            {showRaw ? (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        bgcolor: '#1e1e1e',
                        maxHeight: maxHeight,
                        overflow: 'auto',
                    }}
                >
                    <Typography
                        component="pre"
                        sx={{
                            m: 0,
                            color: '#d4d4d4',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {JSON.stringify(data, null, 2)}
                    </Typography>
                </Paper>
            ) : detectedType === 'table' ? (
                <DataTable
                    data={data}
                    columns={columns}
                    maxHeight={maxHeight}
                    compact={compact}
                    enableCopy
                    onRowClick={onRowClick}
                />
            ) : detectedType === 'json' ? (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        bgcolor: '#1e1e1e',
                        maxHeight: maxHeight,
                        overflow: 'auto',
                    }}
                >
                    <Typography
                        component="pre"
                        sx={{
                            m: 0,
                            color: '#d4d4d4',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {JSON.stringify(data, null, 2)}
                    </Typography>
                </Paper>
            ) : (
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                        {Array.isArray(data) ? data.join(', ') : String(data)}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default QueryResultDisplay;
