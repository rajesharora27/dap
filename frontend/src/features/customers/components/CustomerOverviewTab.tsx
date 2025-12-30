import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Chip,
    IconButton,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
    CircularProgress as MuiCircularProgress,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Search,
    Sync,
    MoreVert,
    Add,
    Assessment,
    Inventory as ProductIcon,
    Link as LinkIcon,
    Extension as SolutionIcon,
    Edit,
    Delete,
} from '@mui/icons-material';

interface OverviewMetrics {
    adoption: number;
    velocity: number;
    totalTasks: number;
    completedTasks: number;
    productsCount: number;
    solutionsCount: number;
    directProductsCount: number;
    solutionProductsCount: number;
}

interface CustomerProduct {
    id: string;
    name: string;
    licenseLevel: string;
    customerSolutionId?: string;
    product?: { id: string; name: string };
    adoptionPlan?: {
        id: string;
        progressPercentage: number;
        lastSyncedAt?: string;
    };
}

interface CustomerSolution {
    id: string;
    name: string;
    licenseLevel: string;
    solution?: { id: string; name: string };
    adoptionPlan?: {
        id: string;
        progressPercentage: number;
        totalTasks: number;
        completedTasks: number;
        needsSync?: boolean;
        lastSyncedAt?: string;
    };
}

// Union type for table row items
interface TableItem {
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

interface CustomerOverviewTabProps {
    overviewMetrics: OverviewMetrics;
    products: CustomerProduct[];
    solutions: CustomerSolution[];
    onProductClick: (productId: string) => void;
    onSolutionClick: (solutionId: string) => void;
    onSyncProduct: (adoptionPlanId: string) => void;
    onSyncSolution: (solutionAdoptionPlanId: string) => void;
    onAssignProduct: () => void;
    onAssignSolution: () => void;
    onEditProduct: (productId: string) => void;
    onEditSolution: (solutionId: string) => void;
    onDeleteProduct: (productId: string) => void;
    onDeleteSolution: (solutionId: string) => void;
    syncingProductId: string | null;
    syncingSolutionId: string | null;
}

export function CustomerOverviewTab({
    overviewMetrics,
    products,
    solutions,
    onProductClick,
    onSolutionClick,
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
}: CustomerOverviewTabProps) {
    // Filter state - now filters products vs solutions
    const [filterMode, setFilterMode] = useState<'all' | 'products' | 'solutions'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Assign dropdown menu state
    const [assignMenuAnchor, setAssignMenuAnchor] = useState<null | HTMLElement>(null);

    // Actions menu state for individual rows
    const [actionsMenuAnchor, setActionsMenuAnchor] = useState<null | HTMLElement>(null);
    const [actionsMenuItemId, setActionsMenuItemId] = useState<string | null>(null);
    const [actionsMenuItemType, setActionsMenuItemType] = useState<'product' | 'solution' | null>(null);
    const [actionsMenuItemIsFromSolution, setActionsMenuItemIsFromSolution] = useState(false);

    // Combine products and solutions into a single table items list
    const tableItems: TableItem[] = React.useMemo(() => {
        const items: TableItem[] = [];

        // Add products
        (products || []).forEach((cp) => {
            const isSolution = !!cp.customerSolutionId;
            // For solution-derived products, the name is "Assignment - Solution - Product"
            // We want to display just the "Assignment" part
            const assignmentName = isSolution ? cp.name.split(' - ')[0] : cp.name;

            items.push({
                id: cp.id,
                assignmentName: assignmentName,
                itemName: cp.product?.name || 'Unknown Product',
                licenseLevel: cp.licenseLevel,
                type: 'product',
                source: isSolution ? 'solution' : 'direct',
                progress: cp.adoptionPlan?.progressPercentage || 0,
                lastSyncedAt: cp.adoptionPlan?.lastSyncedAt,
                adoptionPlanId: cp.adoptionPlan?.id,
            });
        });

        // Add solutions
        (solutions || []).forEach((cs) => {
            items.push({
                id: cs.id,
                assignmentName: cs.name,
                itemName: cs.solution?.name || 'Unknown Solution',
                licenseLevel: cs.licenseLevel,
                type: 'solution',
                source: 'direct',
                progress: cs.adoptionPlan?.progressPercentage || 0,
                lastSyncedAt: cs.adoptionPlan?.lastSyncedAt,
                adoptionPlanId: cs.adoptionPlan?.id,
                needsSync: cs.adoptionPlan?.needsSync,
            });
        });

        return items;
    }, [products, solutions]);

    // Filter items based on mode and search
    const filteredItems = React.useMemo(() => {
        let filtered = tableItems;

        // Apply filter mode
        if (filterMode === 'products') {
            filtered = filtered.filter((item) => item.type === 'product');
        } else if (filterMode === 'solutions') {
            filtered = filtered.filter((item) => item.type === 'solution');
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((item) =>
                item.assignmentName.toLowerCase().includes(query) ||
                item.itemName.toLowerCase().includes(query)
            );
        }

        // Sort by adoption progress (ascending - lowest progress first)
        filtered = [...filtered].sort((a, b) => a.progress - b.progress);

        return filtered;
    }, [tableItems, filterMode, searchQuery]);

    // Format synced time with precise relative time
    const formatSyncedTime = (lastSyncedAt?: string | number): string => {
        if (!lastSyncedAt) return 'Never';

        // Handle both numeric timestamps and ISO date strings
        const timestamp = typeof lastSyncedAt === 'string' && !isNaN(Number(lastSyncedAt))
            ? Number(lastSyncedAt)
            : lastSyncedAt;
        const syncDate = new Date(timestamp);
        if (isNaN(syncDate.getTime())) return 'Never';

        const diff = new Date().getTime() - syncDate.getTime();
        if (diff < 0) return 'Never'; // future date is invalid

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        const months = Math.floor(days / 30);
        if (months === 0) return '1 month ago';
        return `${months} months ago`;
    };

    // Handle assign menu
    const handleAssignMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAssignMenuAnchor(event.currentTarget);
    };
    const handleAssignMenuClose = () => {
        setAssignMenuAnchor(null);
    };

    // Handle row actions menu
    const handleActionsMenuOpen = (event: React.MouseEvent<HTMLElement>, itemId: string, itemType: 'product' | 'solution', isFromSolution: boolean) => {
        event.stopPropagation();
        setActionsMenuAnchor(event.currentTarget);
        setActionsMenuItemId(itemId);
        setActionsMenuItemType(itemType);
        setActionsMenuItemIsFromSolution(isFromSolution);
    };
    const handleActionsMenuClose = () => {
        setActionsMenuAnchor(null);
        setActionsMenuItemId(null);
        setActionsMenuItemType(null);
        setActionsMenuItemIsFromSolution(false);
    };
    const handleEdit = () => {
        if (actionsMenuItemId && actionsMenuItemType) {
            if (actionsMenuItemType === 'solution') {
                onEditSolution(actionsMenuItemId);
            } else {
                onEditProduct(actionsMenuItemId);
            }
        }
        handleActionsMenuClose();
    };
    const handleDelete = () => {
        if (actionsMenuItemId && actionsMenuItemType) {
            if (actionsMenuItemType === 'solution') {
                onDeleteSolution(actionsMenuItemId);
            } else {
                onDeleteProduct(actionsMenuItemId);
            }
        }
        handleActionsMenuClose();
    };

    return (
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Box sx={{ width: '100%', maxWidth: 1400 }}>
                {/* Compact KPI Ribbon */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {/* Overall Adoption */}
                    <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <MuiCircularProgress
                                variant="determinate"
                                value={100}
                                size={56}
                                sx={{ color: 'grey.200', position: 'absolute' }}
                            />
                            <MuiCircularProgress
                                variant="determinate"
                                value={overviewMetrics.adoption}
                                size={56}
                                sx={{
                                    color: overviewMetrics.adoption >= 70 ? 'success.main' :
                                        overviewMetrics.adoption >= 40 ? 'warning.main' : 'error.main'
                                }}
                            />
                            <Box
                                sx={{
                                    top: 0, left: 0, bottom: 0, right: 0,
                                    position: 'absolute', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Typography variant="body2" fontWeight={700} sx={{
                                    color: overviewMetrics.adoption >= 70 ? 'success.main' :
                                        overviewMetrics.adoption >= 40 ? 'warning.main' : 'error.main'
                                }}>
                                    {Math.round(overviewMetrics.adoption)}%
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Overall Adoption</Typography>
                            <Typography variant="h6" fontWeight={600} color="text.primary">
                                {overviewMetrics.adoption >= 70 ? 'Healthy' : overviewMetrics.adoption >= 40 ? 'At Risk' : 'Critical'}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Tasks */}
                    <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Tasks</Typography>
                            <Typography variant="h6" fontWeight={600} color="text.primary">
                                {overviewMetrics.completedTasks}/{overviewMetrics.totalTasks}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Portfolio */}
                    <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ProductIcon sx={{ fontSize: 40, color: 'success.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Portfolio</Typography>
                            <Typography variant="h6" fontWeight={600}>
                                <Box component="span" sx={{ color: 'primary.main' }}>{overviewMetrics.solutionsCount}</Box>
                                {' Solution'}{overviewMetrics.solutionsCount !== 1 ? 's' : ''}{', '}
                                <Box component="span" sx={{ color: 'success.main' }}>{overviewMetrics.directProductsCount}+{overviewMetrics.solutionProductsCount}</Box>
                                {' Products'}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Action Toolbar */}
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                        }}
                        sx={{ minWidth: 220 }}
                    />

                    {/* Segmented Filter Tabs */}
                    <ToggleButtonGroup
                        value={filterMode}
                        exclusive
                        onChange={(_, value) => value && setFilterMode(value)}
                        size="small"
                    >
                        <ToggleButton value="all">All</ToggleButton>
                        <ToggleButton value="products">Products</ToggleButton>
                        <ToggleButton value="solutions">Solutions</ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ flex: 1 }} />

                    {/* Assign Button with Dropdown */}
                    <Tooltip title="Assign Product or Solution">
                        <IconButton
                            color="secondary"
                            onClick={handleAssignMenuOpen}
                        >
                            <Add />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={assignMenuAnchor}
                        open={Boolean(assignMenuAnchor)}
                        onClose={handleAssignMenuClose}
                    >
                        <MenuItem onClick={() => { handleAssignMenuClose(); onAssignProduct(); }}>
                            <ProductIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Assign Product
                        </MenuItem>
                        <MenuItem onClick={() => { handleAssignMenuClose(); onAssignSolution(); }}>
                            <SolutionIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} /> Assign Solution
                        </MenuItem>
                    </Menu>
                </Paper>

                {/* Data Table */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', width: '100%' }}>
                    <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>
                                <TableCell sx={{ fontWeight: 600, width: '20%' }}>Assignment Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: '25%' }}>Product / Solution</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: '10%' }}>Source</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: '30%' }}>Adoption Progress</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: '10%', textAlign: 'right' }}>Last Sync</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: '5%', textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                            {filterMode === 'products' ? 'No products assigned' :
                                                filterMode === 'solutions' ? 'No solutions assigned' :
                                                    'No products or solutions assigned'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => {
                                    const isSolution = item.type === 'solution';
                                    const isFromSolution = item.source === 'solution';
                                    const syncedText = formatSyncedTime(item.lastSyncedAt);
                                    const isSyncing = isSolution
                                        ? syncingSolutionId === item.adoptionPlanId
                                        : syncingProductId === item.adoptionPlanId;

                                    return (
                                        <TableRow
                                            key={`${item.type}-${item.id}`}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                            }}
                                            onClick={() => isSolution ? onSolutionClick(item.id) : onProductClick(item.id)}
                                        >
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight={500} noWrap>{item.assignmentName}</Typography>
                                                    <Chip
                                                        label={item.licenseLevel}
                                                        size="small"
                                                        color={isSolution || isFromSolution ? 'primary' : 'success'}
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.7rem', flexShrink: 0 }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {isSolution ? (
                                                        <SolutionIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                                    ) : isFromSolution ? (
                                                        <ProductIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                                    ) : (
                                                        <ProductIcon fontSize="small" sx={{ color: 'success.main' }} />
                                                    )}
                                                    <Typography variant="body2" noWrap>{item.itemName}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {isSolution ? (
                                                        <SolutionIcon fontSize="small" color="primary" />
                                                    ) : isFromSolution ? (
                                                        <LinkIcon fontSize="small" color="primary" />
                                                    ) : (
                                                        <ProductIcon fontSize="small" color="success" />
                                                    )}
                                                    <Typography variant="body2" color="text.secondary">
                                                        {isSolution ? 'Solution' : isFromSolution ? 'Solution' : 'Direct'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={item.progress}
                                                        sx={{
                                                            flex: 1, height: 8, borderRadius: 4, bgcolor: 'grey.200',
                                                            minWidth: 80,
                                                            '& .MuiLinearProgress-bar': {
                                                                bgcolor: item.progress >= 80 ? 'success.main' : item.progress >= 50 ? 'primary.main' : 'warning.main',
                                                                borderRadius: 4
                                                            }
                                                        }}
                                                    />
                                                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40, textAlign: 'right' }}>
                                                        {Math.round(item.progress)}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, textAlign: 'right' }}>
                                                <Typography variant="body2" color="text.secondary">{syncedText}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }} align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                    {item.adoptionPlanId && (
                                                        <Tooltip title="Sync">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isSolution) {
                                                                        onSyncSolution(item.adoptionPlanId!);
                                                                    } else {
                                                                        onSyncProduct(item.adoptionPlanId!);
                                                                    }
                                                                }}
                                                                disabled={isSyncing}
                                                            >
                                                                {isSyncing ? <MuiCircularProgress size={18} /> : <Sync fontSize="small" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleActionsMenuOpen(e, item.id, item.type, item.source === 'solution')}
                                                    >
                                                        <MoreVert fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Row Actions Menu */}
                <Menu
                    anchorEl={actionsMenuAnchor}
                    open={Boolean(actionsMenuAnchor)}
                    onClose={handleActionsMenuClose}
                >
                    {actionsMenuItemIsFromSolution ? (
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                                Managed via Solution
                            </Typography>
                        </MenuItem>
                    ) : (
                        <>
                            <MenuItem onClick={handleEdit}>
                                <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
                            </MenuItem>
                            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                                <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
                            </MenuItem>
                        </>
                    )}
                </Menu>
            </Box>
        </Box>
    );
}
