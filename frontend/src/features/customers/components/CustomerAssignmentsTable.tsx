import * as React from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Chip,
    IconButton,
    InputAdornment,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Menu,
    MenuItem,
    Stack,
} from '@mui/material';
import {
    Search,
    Sync,
    MoreVert,
    Add,
    BoxIconOutlined as ProductIcon,
    LightbulbOutlined as SolutionIcon,
    Edit,
    Delete,
} from '@shared/components/FAIcon';
import { getProgressColor } from '@shared/utils/progressUtils';
import { ColumnVisibilityToggle, TimeAgo } from '@shared/components';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';

export interface TableItem {
    id: string;
    assignmentName: string;
    itemName: string;
    licenseLevel: string;
    type: 'product' | 'solution';
    source: 'direct' | 'solution';
    progress: number;
    lastSyncedAt?: string;
    adoptionPlanId?: string;
    needsSync?: boolean;
}

interface CustomerAssignmentsTableProps {
    items: TableItem[];
    onSyncProduct: (id: string) => void;
    onSyncSolution: (id: string, planId: string) => void;
    onAssignProduct: () => void;
    onAssignSolution: () => void;
    onEditProduct: (id: string) => void;
    onEditSolution: (id: string) => void;
    onDeleteProduct: (id: string) => void;
    onDeleteSolution: (id: string) => void;
    syncingProductId: string | null;
    syncingSolutionId: string | null;
}

export function CustomerAssignmentsTable({
    items,
    onSyncProduct,
    onSyncSolution,
    onAssignProduct,
    onAssignSolution,
    onEditProduct,
    onEditSolution,
    onDeleteProduct,
    onDeleteSolution,
    syncingProductId,
    syncingSolutionId,
}: CustomerAssignmentsTableProps) {
    const [filterMode, setFilterMode] = React.useState<'all' | 'products' | 'solutions'>('all');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [assignMenuAnchor, setAssignMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [actionsMenuAnchor, setActionsMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [activeItem, setActiveItem] = React.useState<TableItem | null>(null);

    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'customer-overview-table',
        columns: [
            { key: 'assignmentName', minWidth: 150, defaultWidth: 250 },
            { key: 'itemName', minWidth: 150, defaultWidth: 250 },
            { key: 'source', minWidth: 80, defaultWidth: 120 },
            { key: 'progress', minWidth: 200, defaultWidth: 300 },
            { key: 'lastSyncedAt', minWidth: 120, defaultWidth: 150 },
            { key: 'actions', minWidth: 80, defaultWidth: 80 },
        ],
    });

    const filteredItems = React.useMemo(() => {
        let filtered = items;
        if (filterMode === 'products') filtered = filtered.filter(i => i.type === 'product');
        else if (filterMode === 'solutions') filtered = filtered.filter(i => i.type === 'solution');

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(i =>
                i.assignmentName.toLowerCase().includes(query) ||
                i.itemName.toLowerCase().includes(query)
            );
        }
        return [...filtered].sort((a, b) => a.progress - b.progress);
    }, [items, filterMode, searchQuery]);



    return (
        <Box>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                    sx={{ minWidth: 220 }}
                />
                <ToggleButtonGroup
                    value={filterMode}
                    exclusive
                    onChange={(_, v) => v && setFilterMode(v)}
                    size="small"
                >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="products">Products</ToggleButton>
                    <ToggleButton value="solutions">Solutions</ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Assign">
                    <IconButton onClick={(e) => setAssignMenuAnchor(e.currentTarget)}><Add /></IconButton>
                </Tooltip>
                <Menu anchorEl={assignMenuAnchor} open={Boolean(assignMenuAnchor)} onClose={() => setAssignMenuAnchor(null)}>
                    <MenuItem onClick={() => { setAssignMenuAnchor(null); onAssignProduct(); }}>
                        <Box sx={{ mr: 1, p: 0.5, borderRadius: 1, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center' }}>
                            <ProductIcon fontSize="small" sx={{ color: '#10B981' }} />
                        </Box>
                        Assign Product
                    </MenuItem>
                    <MenuItem onClick={() => { setAssignMenuAnchor(null); onAssignSolution(); }}>
                        <Box sx={{ mr: 1, p: 0.5, borderRadius: 1, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center' }}>
                            <SolutionIcon fontSize="small" sx={{ color: '#3B82F6' }} />
                        </Box>
                        Assign Solution
                    </MenuItem>
                </Menu>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <ResizableTableCell width={columnWidths['assignmentName']} resizable resizeHandleProps={getResizeHandleProps('assignmentName')} isResizing={isResizing}>Assignment Name</ResizableTableCell>
                            <ResizableTableCell width={columnWidths['itemName']} resizable resizeHandleProps={getResizeHandleProps('itemName')} isResizing={isResizing}>Product / Solution</ResizableTableCell>
                            <ResizableTableCell width={columnWidths['source']} resizable resizeHandleProps={getResizeHandleProps('source')} isResizing={isResizing}>Source</ResizableTableCell>
                            <ResizableTableCell width={columnWidths['progress']} resizable resizeHandleProps={getResizeHandleProps('progress')} isResizing={isResizing}>Progress</ResizableTableCell>
                            <ResizableTableCell width={columnWidths['lastSyncedAt']} resizable resizeHandleProps={getResizeHandleProps('lastSyncedAt')} isResizing={isResizing}>Last Synced</ResizableTableCell>
                            <ResizableTableCell width={columnWidths['actions']} sx={{ textAlign: 'center' }}>Actions</ResizableTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredItems.map((item) => (
                            <TableRow
                                key={item.id}
                                hover
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (item.type === 'product') onEditProduct(item.id);
                                    else onEditSolution(item.id);
                                }}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell sx={{ fontWeight: 500 }}>{item.assignmentName}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {item.type === 'solution' ? (
                                            <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center' }}>
                                                <SolutionIcon fontSize="small" sx={{ color: '#3B82F6' }} />
                                            </Box>
                                        ) : (
                                            <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center' }}>
                                                <ProductIcon fontSize="small" sx={{ color: '#10B981' }} />
                                            </Box>
                                        )}
                                        <Typography variant="body2">{item.itemName}</Typography>
                                        <Chip label={item.licenseLevel} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.625rem' }} />
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.source === 'solution' ? 'Solution' : 'Direct'}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.625rem',
                                            color: item.source === 'solution' ? '#3B82F6' : '#10B981',
                                            borderColor: item.source === 'solution' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(16, 185, 129, 0.5)',
                                            bgcolor: item.source === 'solution' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)'
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={item.progress}
                                            sx={{
                                                flex: 1,
                                                height: 6,
                                                borderRadius: 3,
                                                bgcolor: 'rgba(0,0,0,0.05)',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: getProgressColor(item.progress),
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                        <Typography variant="caption" fontWeight={600} sx={{ color: getProgressColor(item.progress) }}>{Math.round(item.progress)}%</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell><TimeAgo date={item.lastSyncedAt} variant="caption" color="text.secondary" /></TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Tooltip title="Sync">
                                            <IconButton
                                                size="small"
                                                disabled={item.type === 'product' ? syncingProductId === item.id : syncingSolutionId === item.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.type === 'product') onSyncProduct(item.id);
                                                    else if (item.adoptionPlanId) onSyncSolution(item.id, item.adoptionPlanId);
                                                }}
                                                sx={{ color: item.type === 'solution' ? '#3B82F6' : '#10B981' }}
                                            >
                                                <Sync fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.type === 'product') onEditProduct(item.id);
                                                    else onEditSolution(item.id);
                                                }}
                                                sx={{ color: item.type === 'solution' ? '#3B82F6' : '#10B981' }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActionsMenuAnchor(e.currentTarget);
                                                setActiveItem(item);
                                            }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Menu anchorEl={actionsMenuAnchor} open={Boolean(actionsMenuAnchor)} onClose={() => setActionsMenuAnchor(null)}>
                <MenuItem onClick={() => {
                    if (activeItem?.type === 'product') onDeleteProduct(activeItem.id);
                    else onDeleteSolution(activeItem!.id);
                    setActionsMenuAnchor(null);
                }} sx={{ color: 'error.main' }}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>
        </Box>
    );
}
