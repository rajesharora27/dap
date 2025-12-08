/**
 * DataTable Component
 * 
 * A flexible table component for displaying AI query results.
 * Supports sorting, pagination, and copy-to-clipboard functionality.
 * 
 * @version 1.0.0
 * @created 2025-12-06
 */

import React, { useState, useMemo } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    useTheme,
    alpha,
} from '@mui/material';
import {
    ContentCopy,
    KeyboardArrowDown,
    KeyboardArrowUp,
    Check,
} from '@mui/icons-material';

export interface DataTableColumn {
    /** Column key (matches data property) */
    key: string;
    /** Display label */
    label: string;
    /** Column width */
    width?: string | number;
    /** Text alignment */
    align?: 'left' | 'center' | 'right';
    /** Enable sorting for this column */
    sortable?: boolean;
    /** Custom render function */
    render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps {
    /** Data array to display */
    data: any[];
    /** Column definitions (if not provided, auto-generated from data) */
    columns?: DataTableColumn[];
    /** Maximum rows per page (default: 10) */
    rowsPerPage?: number;
    /** Show row numbers */
    showRowNumbers?: boolean;
    /** Enable copy to clipboard for cells */
    enableCopy?: boolean;
    /** Compact mode (smaller cells) */
    compact?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Table title */
    title?: string;
    /** Maximum height before scrolling */
    maxHeight?: number;
    /** Row click handler */
    onRowClick?: (row: any, index: number) => void;
}

type Order = 'asc' | 'desc';

/**
 * Format a value for display
 */
function formatValue(value: any): string {
    if (value === null || value === undefined) {
        return '-';
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return `[${value.length} items]`;
        }
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        // Check for _count object (Prisma relations)
        if (value._count !== undefined) {
            return JSON.stringify(value._count);
        }
        return JSON.stringify(value);
    }
    if (typeof value === 'number') {
        // Format large numbers with commas
        return value.toLocaleString();
    }
    return String(value);
}

/**
 * Auto-generate columns from data
 */
function generateColumns(data: any[]): DataTableColumn[] {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    const columns: DataTableColumn[] = [];

    for (const key of Object.keys(firstRow)) {
        // Skip internal fields, 'id' field (used for navigation but not display), and complex objects
        if (key === 'id') continue;
        if (key.startsWith('_') && key !== '_count') continue;

        const value = firstRow[key];
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);

        // For _count, show as expandable
        if (key === '_count' && isObject) {
            for (const countKey of Object.keys(value)) {
                columns.push({
                    key: `_count.${countKey}`,
                    label: `${countKey.charAt(0).toUpperCase() + countKey.slice(1)} Count`,
                    align: 'right',
                    sortable: true,
                    render: (_, row) => row._count?.[countKey] ?? '-',
                });
            }
            continue;
        }

        // Skip complex nested objects
        if (isObject && !Array.isArray(value)) continue;

        columns.push({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            sortable: true,
            align: typeof value === 'number' ? 'right' : 'left',
        });
    }

    return columns;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export const DataTable: React.FC<DataTableProps> = ({
    data,
    columns: propColumns,
    rowsPerPage: defaultRowsPerPage = 10,
    showRowNumbers = false,
    enableCopy = true,
    compact = false,
    emptyMessage = 'No data to display',
    title,
    maxHeight = 400,
    onRowClick,
}) => {
    const theme = useTheme();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
    const [orderBy, setOrderBy] = useState<string>('');
    const [order, setOrder] = useState<Order>('asc');
    const [copiedCell, setCopiedCell] = useState<string | null>(null);


    // Generate or use provided columns
    const columns = useMemo(() => {
        return propColumns || generateColumns(data);
    }, [propColumns, data]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!orderBy) return data;

        return [...data].sort((a, b) => {
            const aValue = getNestedValue(a, orderBy);
            const bValue = getNestedValue(b, orderBy);

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return order === 'asc'
                ? (aValue > bValue ? 1 : -1)
                : (bValue > aValue ? 1 : -1);
        });
    }, [data, orderBy, order]);

    // Paginated data
    const paginatedData = useMemo(() => {
        if (rowsPerPage === -1) return sortedData;
        const start = page * rowsPerPage;
        return sortedData.slice(start, start + rowsPerPage);
    }, [sortedData, page, rowsPerPage]);

    const handleSort = (column: string) => {
        const isAsc = orderBy === column && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(column);
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCopy = async (value: any, cellId: string) => {
        const textValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(textValue);
            } else {
                // Fallback for non-secure contexts
                const textArea = document.createElement("textarea");
                textArea.value = textValue;
                textArea.style.position = "fixed";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
            setCopiedCell(cellId);
            setTimeout(() => setCopiedCell(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    // Empty state
    if (!data || data.length === 0) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.grey[500], 0.05),
                }}
            >
                <Typography color="text.secondary">{emptyMessage}</Typography>
            </Paper>
        );
    }

    // Always use normal padding for better readability
    const cellPadding = 'normal';

    return (
        <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
            {title && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        {title}
                    </Typography>
                </Box>
            )}

            <TableContainer sx={{ maxHeight }}>
                <Table
                    size={compact ? 'small' : 'medium'}
                    stickyHeader
                >
                    <TableHead>
                        <TableRow>
                            {showRowNumbers && (
                                <TableCell
                                    sx={{
                                        bgcolor: 'background.paper',
                                        fontWeight: 600,
                                        width: 50,
                                    }}
                                >
                                    #
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell
                                    key={column.key}
                                    align={column.align || 'left'}
                                    padding={cellPadding}
                                    sx={{
                                        bgcolor: 'background.paper',
                                        fontWeight: 600,
                                        width: column.width || 'auto',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                    sortDirection={orderBy === column.key ? order : false}
                                >
                                    {column.sortable ? (
                                        <TableSortLabel
                                            active={orderBy === column.key}
                                            direction={orderBy === column.key ? order : 'asc'}
                                            onClick={() => handleSort(column.key)}
                                        >
                                            {column.label}
                                        </TableSortLabel>
                                    ) : (
                                        column.label
                                    )}
                                </TableCell>
                            ))}
                            {enableCopy && <TableCell padding={cellPadding} sx={{ width: 40 }} />}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((row, rowIndex) => {
                            const globalIndex = page * rowsPerPage + rowIndex;
                            return (
                                <TableRow
                                    key={row.id || globalIndex}
                                    hover={Boolean(onRowClick)}
                                    onClick={onRowClick ? () => onRowClick(row, globalIndex) : undefined}
                                    sx={{
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        '&:last-child td': { borderBottom: 0 },
                                        ...(onRowClick && {
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                            },
                                        }),
                                    }}
                                >
                                    {showRowNumbers && (
                                        <TableCell sx={{ color: 'text.secondary' }}>
                                            {globalIndex + 1}
                                        </TableCell>
                                    )}
                                    {columns.map((column) => {
                                        const value = getNestedValue(row, column.key);
                                        const cellId = `${globalIndex}-${column.key}`;
                                        const isCopied = copiedCell === cellId;

                                        return (
                                            <TableCell
                                                key={column.key}
                                                align={column.align || 'left'}
                                                padding={cellPadding}
                                                sx={{
                                                    maxWidth: 250,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                {(() => {
                                                    if (column.key === 'id') return row.id;

                                                    // Allow custom rendering of columns
                                                    if (column.render) return column.render(value, row);

                                                    // Handle HowTo array values (URLs)
                                                    if (Array.isArray(value) && value.length > 0) {
                                                        const lowerKey = column.key.toLowerCase();
                                                        if (lowerKey.includes('howtodoc') || lowerKey.includes('howtovideo') || lowerKey.includes('link')) {
                                                            return (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                    {value.map((url, idx) => {
                                                                        const urlStr = String(url);
                                                                        // Extract domain or truncate URL for display
                                                                        let displayText = urlStr;
                                                                        try {
                                                                            const urlObj = new URL(urlStr);
                                                                            displayText = urlObj.hostname + (urlObj.pathname.length > 1 ? urlObj.pathname.substring(0, 20) + '...' : '');
                                                                        } catch {
                                                                            displayText = urlStr.length > 40 ? urlStr.substring(0, 37) + '...' : urlStr;
                                                                        }
                                                                        return (
                                                                            <a
                                                                                key={idx}
                                                                                href={urlStr}
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    window.open(urlStr, '_blank', 'noopener,noreferrer,width=1200,height=800');
                                                                                }}
                                                                                style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' }}
                                                                            >
                                                                                {displayText}
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </Box>
                                                            );
                                                        }
                                                        // Non-link arrays: show count
                                                        return `${value.length} items`;
                                                    }

                                                    // Handle Markdown Links in cell values (string)
                                                    if (typeof value === 'string') {
                                                        const markdownLinkRegex = /^\[([^\]]+)\]\(([^)]+)\)$/;
                                                        const match = value.match(markdownLinkRegex);
                                                        if (match) {
                                                            return (
                                                                <a
                                                                    href={match[2]}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
                                                                >
                                                                    {match[1]}
                                                                </a>
                                                            );
                                                        }
                                                        // Handle multiple links (comma separated)
                                                        if (value.includes('](')) {
                                                            const parts = value.split(', ');
                                                            if (parts.every(p => markdownLinkRegex.test(p))) {
                                                                return (
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                        {parts.map((p, idx) => {
                                                                            const m = p.match(markdownLinkRegex);
                                                                            if (m) {
                                                                                return (
                                                                                    <a
                                                                                        key={idx}
                                                                                        href={m[2]}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
                                                                                    >
                                                                                        {m[1]}
                                                                                    </a>
                                                                                );
                                                                            }
                                                                            return p;
                                                                        })}
                                                                    </Box>
                                                                );
                                                            }
                                                        }
                                                    }

                                                    return (
                                                        <Tooltip title={formatValue(value)} enterDelay={500}>
                                                            <span>{formatValue(value)}</span>
                                                        </Tooltip>
                                                    );
                                                })()}
                                                {enableCopy && value !== null && value !== undefined && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopy(value, cellId);
                                                        }}
                                                        sx={{
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                            '.MuiTableRow-root:hover &': { opacity: 0.5 },
                                                            '&:hover': { opacity: 1 },
                                                        }}
                                                    >
                                                        {isCopied ? (
                                                            <Check sx={{ fontSize: 14, color: 'success.main' }} />
                                                        ) : (
                                                            <ContentCopy sx={{ fontSize: 14 }} />
                                                        )}
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {
                data.length > rowsPerPage && (
                    <TablePagination
                        component="div"
                        count={data.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25, 50, { label: 'All', value: -1 }]}
                        sx={{ borderTop: 1, borderColor: 'divider' }}
                    />
                )
            }
        </Paper >
    );
};

export default DataTable;
