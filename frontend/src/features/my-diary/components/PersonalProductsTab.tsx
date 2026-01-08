/**
 * Personal Products Tab
 * Displays user's personal products with create/import/edit/delete functionality
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
    Box,
    Typography,
    Button,
    Paper,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    IconButton,
    Menu,
    ListItemIcon,
    ListItemText,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    MoreVert as MoreIcon,
    CloudUpload as ProductImportIcon,    // Cloud upload for product import
    CloudDownload as ProductExportIcon,  // Cloud download for product export  
    Edit as EditIcon,
    Download as TelemetryExportIcon,     // Download arrow for telemetry export
    Upload as TelemetryImportIcon,       // Upload arrow for telemetry import
} from '@shared/components/FAIcon';
import {
    GET_MY_PERSONAL_PRODUCTS,
    DELETE_PERSONAL_PRODUCT,
    EXPORT_PERSONAL_PRODUCT,
    EXPORT_PERSONAL_TELEMETRY_TEMPLATE,
    IMPORT_PERSONAL_TELEMETRY,
} from '../graphql/personal-sandbox';
import { PersonalProductDialog } from './PersonalProductDialog';
import { PersonalProductSummary } from './PersonalProductSummary';
import { PersonalProductTasksTab } from './PersonalProductTasksTab';
import { AssignFromCatalogDialog } from './AssignFromCatalogDialog';

import { BulkImportDialog } from '../../data-management/components/BulkImportDialog';
import { PersonalProductMetadataSection } from './PersonalProductMetadataSection';
import { TasksTabToolbar } from '@shared/components/TasksTabToolbar';
import { DEFAULT_VISIBLE_COLUMNS } from '@shared/components/ColumnVisibilityToggle';
import { TelemetryImportResultDialog } from '@features/adoption-plans/components/TelemetryImportResultDialog';
import { AdoptionPlanProgressCard } from '@features/adoption-plans/components/AdoptionPlanProgressCard';
import { ImportResultDialogState } from '@/features/telemetry/utils/telemetryOperations';


export interface PersonalProductsTabRef {
    triggerAdd: () => void;
}

export const PersonalProductsTab = forwardRef<PersonalProductsTabRef>((props, ref) => {
    const client = useApolloClient();

    // State
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [activeTab, setActiveTab] = useState('summary');
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [externalAddMode, setExternalAddMode] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [importResultDialog, setImportResultDialog] = useState<ImportResultDialogState & { timestamp?: number }>({
        open: false,
        success: false,
    });

    // Task Tab UI State (Lifted for Toolbar)
    const [isTasksLocked, setIsTasksLocked] = useState(false);
    const [showTaskFilters, setShowTaskFilters] = useState(false);
    const [visibleTaskColumns, setVisibleTaskColumns] = useState<string[]>(['status', 'order', 'tags', 'name', 'resources', 'implPercent', 'validationCriteria', 'updatedVia', 'actions']);
    const [taskTagFilter, setTaskTagFilter] = useState<string[]>([]);
    const [taskOutcomeFilter, setTaskOutcomeFilter] = useState<string[]>([]);
    const [taskReleaseFilter, setTaskReleaseFilter] = useState<string[]>([]);
    const [taskLicenseFilter, setTaskLicenseFilter] = useState<string[]>([]);

    const taskRef = React.useRef<any>(null);


    useImperativeHandle(ref, () => ({
        triggerAdd: () => {
            setIsAssignDialogOpen(true);
        }
    }));

    // Queries
    const { data, loading, error, refetch } = useQuery(GET_MY_PERSONAL_PRODUCTS, {
        fetchPolicy: 'network-only' // Ensure fresh data
    });

    const products = data?.myPersonalProducts || [];
    const selectedProduct = products.find((p: any) => p.id === selectedProductId);

    // Auto-select first product
    useEffect(() => {
        if (!selectedProductId && products.length > 0) {
            setSelectedProductId(products[0].id);
        }
    }, [products, selectedProductId]);

    // Mutation
    const [deleteProduct] = useMutation(DELETE_PERSONAL_PRODUCT, {
        onCompleted: () => {
            setSelectedProductId('');
            refetch();
        }
    });

    const [exportTelemetry] = useMutation(EXPORT_PERSONAL_TELEMETRY_TEMPLATE);

    // Handlers
    const handleDeleteProduct = async () => {
        if (!selectedProductId) return;
        if (confirm('Are you sure you want to delete this product?')) {
            await deleteProduct({ variables: { id: selectedProductId } });
        }
        setAnchorEl(null);
    };

    const handleExport = async () => {
        if (!selectedProductId) return;
        try {
            const result = await client.query({
                query: EXPORT_PERSONAL_PRODUCT,
                variables: { personalProductId: selectedProductId },
                fetchPolicy: 'network-only'
            });

            const { filename, content, mimeType } = result.data.exportPersonalProduct;

            // Decode base64
            const byteCharacters = atob(content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            const blob = new Blob([byteArray], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed');
        }
        setAnchorEl(null);
    };

    const handleTelemetryExport = async () => {
        if (!selectedProductId) return;
        try {
            const { data } = await exportTelemetry({ variables: { personalProductId: selectedProductId } });
            const { filename, content, mimeType } = data.exportPersonalTelemetryTemplate;
            const link = document.createElement('a');
            link.href = `data:${mimeType};base64,${content}`;
            link.download = filename;
            link.click();
        } catch (error: any) {
            console.error(error);
            alert(`Export failed: ${error.message}`);
        }
    };

    const [importPersonalTelemetry] = useMutation(IMPORT_PERSONAL_TELEMETRY);

    const handleTelemetryImport = async (file: File) => {
        if (!selectedProductId) return;
        
        // Close any existing dialog first to ensure state change is detected
        setImportResultDialog({ open: false, success: false });
        
        try {
            const { data } = await importPersonalTelemetry({
                variables: {
                    personalProductId: selectedProductId,
                    file
                }
            });

            const result = data?.importPersonalTelemetry;
            
            // Use setTimeout to ensure React processes the close before opening again
            setTimeout(() => {
                setImportResultDialog({
                    open: true,
                    success: result?.success ?? false,
                    summary: result?.summary,
                    taskResults: result?.taskResults ?? [],
                    errorMessage: result?.summary?.errors?.length ? result.summary.errors.join(', ') : undefined,
                    timestamp: Date.now(), // Force state change detection
                });
            }, 50);
            
            if (result?.success) {
                refetch();
            }
        } catch (error: any) {
            console.error(error);
            setTimeout(() => {
                setImportResultDialog({
                    open: true,
                    success: false,
                    errorMessage: error.message,
                    timestamp: Date.now(), // Force state change detection
                });
            }, 50);
        }
    };

    // Filter Logic for Task Count
    const filteredTasks = React.useMemo(() => {
        if (!selectedProduct?.tasks) return [];
        const tasks = selectedProduct.tasks;

        return tasks.filter((task: any) => {
            if (taskTagFilter.length > 0) {
                const taskTagIds = task.tags?.map((t: any) => t.id) || [];
                if (!taskTagIds.some((id: string) => taskTagFilter.includes(id))) return false;
            }
            if (taskOutcomeFilter.length > 0) {
                const taskOutcomeIds = task.outcomes?.map((o: any) => o.id) || [];
                // If task has NO outcomes, it applies to ALL outcomes -> include it
                if (taskOutcomeIds.length > 0 && !taskOutcomeIds.some((id: string) => taskOutcomeFilter.includes(id))) return false;
            }
            if (taskReleaseFilter.length > 0) {
                const taskReleaseIds = task.releases?.map((r: any) => r.id) || [];
                // If task has NO releases, it applies to ALL releases -> include it
                if (taskReleaseIds.length > 0 && !taskReleaseIds.some((id: string) => taskReleaseFilter.includes(id))) return false;
            }
            if (taskLicenseFilter.length > 0) {
                // Future license filtering support
            }
            return true;
        });
    }, [selectedProduct, taskTagFilter, taskOutcomeFilter, taskReleaseFilter, taskLicenseFilter]);

    // Calculate adoption progress (weighted, excluding NOT_APPLICABLE)
    const adoptionProgress = React.useMemo(() => {
        if (!selectedProduct?.tasks || selectedProduct.tasks.length === 0) {
            return { completedTasks: 0, totalTasks: 0, percentage: 0 };
        }
        
        const tasks = selectedProduct.tasks;
        // Filter out NOT_APPLICABLE tasks
        const applicableTasks = tasks.filter((t: any) => t.status !== 'NOT_APPLICABLE');
        if (applicableTasks.length === 0) {
            return { completedTasks: 0, totalTasks: 0, percentage: 0 };
        }
        
        // Count completed tasks
        const completedTasks = applicableTasks.filter((t: any) => 
            t.status === 'DONE' || t.status === 'COMPLETED'
        ).length;
        
        // Calculate total weight of applicable tasks
        const totalWeight = applicableTasks.reduce((sum: number, t: any) => sum + (Number(t.weight) || 0), 0);
        
        // Calculate completed weight
        const completedWeight = applicableTasks
            .filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED')
            .reduce((sum: number, t: any) => sum + (Number(t.weight) || 0), 0);
        
        // Use weight-based calculation if weights exist, otherwise fall back to task count
        const percentage = totalWeight > 0 
            ? (completedWeight / totalWeight) * 100 
            : (completedTasks / applicableTasks.length) * 100;
        
        return {
            completedTasks,
            totalTasks: applicableTasks.length,
            percentage
        };
    }, [selectedProduct?.tasks]);

    if (loading && !products.length) return <CircularProgress />;
    if (error) return <Alert severity="error">{error.message}</Alert>;

    return (
        <Box sx={{ p: 0 }}>
            {/* Header / Controls */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
                {/* Toolbar */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Product Selector */}
                        <FormControl size="small" sx={{ minWidth: 250 }}>
                            <InputLabel id="product-select-label">Select Product</InputLabel>
                            <Select
                                labelId="product-select-label"
                                value={selectedProductId}
                                label="Select Product"
                                onChange={(e) => {
                                    if (e.target.value === '__add_new__') {
                                        setIsAssignDialogOpen(true);
                                    } else {
                                        setSelectedProductId(e.target.value);
                                    }
                                }}
                                sx={{ bgcolor: 'white' }}
                                renderValue={(selected) => {
                                    if (selected === '__add_new__') return 'Add New Product';
                                    const p = products.find((prod: any) => prod.id === selected);
                                    return p ? p.name : '';
                                }}
                            >
                                {products.map((p: any) => (
                                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                ))}
                                {products.length > 0 && <Divider />}
                                <MenuItem value="__add_new__" sx={{ color: 'primary.main', fontWeight: 500 }}>
                                    + Add New Product
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<ProductImportIcon />}
                                onClick={() => setIsImportDialogOpen(true)}
                                size="small"
                                sx={{ color: 'primary.main', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}
                            >
                                Import
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ProductExportIcon />}
                                onClick={handleExport}
                                disabled={!selectedProduct}
                                size="small"
                                sx={{ color: 'primary.main', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}
                            >
                                Export
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => setIsProductDialogOpen(true)}
                                disabled={!selectedProduct}
                                size="small"
                                sx={{ color: 'primary.main', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteProduct}
                                disabled={!selectedProduct}
                                size="small"
                                sx={{ color: 'error.main', borderColor: 'divider', '&:hover': { borderColor: 'error.main', bgcolor: 'error.50' } }}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>

                    {/* Right Side: Product Name Label */}
                    {selectedProduct && (
                        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                            {selectedProduct.name}
                        </Typography>
                    )}
                </Paper>

                {/* Adoption Progress Card - Same style as adoption plans */}
                {selectedProduct && (
                    <AdoptionPlanProgressCard
                        licenseLevel="Personal"
                        completedTasks={adoptionProgress.completedTasks}
                        totalTasks={adoptionProgress.totalTasks}
                        percentage={adoptionProgress.percentage}
                        color="#10B981"
                    />
                )}
            </Box>

            {/* Content */}
            {selectedProduct ? (
                <Paper sx={{ overflow: 'hidden' }}>
                    <Box sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
                            <Tab label="Summary" value="summary" />
                            <Tab label={`Resources (${selectedProduct.resources?.length || 0})`} value="resources" />
                            <Tab label={`Tasks (${filteredTasks.length})`} value="tasks" />
                            <Tab label={`Tags (${selectedProduct.tags?.length || 0})`} value="tags" />
                            <Tab label={`Outcomes (${selectedProduct.outcomes?.length || 0})`} value="outcomes" />
                            <Tab label={`Releases (${selectedProduct.releases?.length || 0})`} value="releases" />
                            <Tab label={`Licenses (${selectedProduct.licenses?.length || 0})`} value="licenses" />
                            <Tab label={`Custom Attributes (${Object.keys(selectedProduct.customAttrs || {}).length})`} value="customAttributes" />
                        </Tabs>

                        {/* Tasks Tab Toolbar */}
                        {activeTab === 'tasks' && (
                            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                {/* Telemetry Actions */}
                                <Box sx={{ display: 'flex', gap: 0.5, mr: 1, borderRight: '1px solid', borderColor: 'divider', pr: 1 }}>
                                    <Tooltip title="Export Telemetry Template">
                                        <IconButton 
                                            size="small" 
                                            onClick={handleTelemetryExport}
                                            sx={{ 
                                                border: '1px solid #10B981', 
                                                color: '#10B981',
                                                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.08)' }
                                            }}
                                        >
                                            <TelemetryExportIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Import Telemetry">
                                        <IconButton 
                                            size="small" 
                                            component="label"
                                            sx={{ 
                                                border: '1px solid #10B981', 
                                                color: '#10B981',
                                                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.08)' }
                                            }}
                                        >
                                            <TelemetryImportIcon fontSize="small" />
                                            <input
                                                type="file"
                                                hidden
                                                accept=".xlsx,.xls"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleTelemetryImport(file);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <TasksTabToolbar
                                    loading={loading}
                                    isLocked={isTasksLocked}
                                    onToggleLock={() => setIsTasksLocked(!isTasksLocked)}
                                    showFilters={showTaskFilters}
                                    onToggleFilters={() => setShowTaskFilters(!showTaskFilters)}
                                    hasActiveFilters={taskTagFilter.length > 0 || taskOutcomeFilter.length > 0 || taskReleaseFilter.length > 0}
                                    activeFilterCount={[taskTagFilter, taskOutcomeFilter, taskReleaseFilter].filter(f => f.length > 0).length}
                                    onClearFilters={() => {
                                        setTaskTagFilter([]);
                                        setTaskOutcomeFilter([]);
                                        setTaskReleaseFilter([]);
                                        setTaskLicenseFilter([]);
                                    }}
                                    visibleColumns={visibleTaskColumns}
                                    onToggleColumn={(col) => {
                                        setVisibleTaskColumns(prev =>
                                            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
                                        );
                                    }}
                                    onAddTask={() => taskRef.current?.triggerAdd?.()}
                                />
                            </Box>
                        )}

                        {/* Add Button for Metadata Tabs */}
                        {!['summary', 'tasks'].includes(activeTab) && (
                            <IconButton onClick={() => setExternalAddMode(activeTab)} size="small" sx={{ mr: 1 }}>
                                <AddIcon />
                            </IconButton>
                        )}
                    </Box>

                    <Box sx={{ p: 3, bgcolor: '#F1F5F9', minHeight: '60vh' }}>
                        {activeTab === 'summary' && (
                            <PersonalProductSummary
                                product={selectedProduct}
                                tasks={selectedProduct.tasks || []}
                            />
                        )}
                        {activeTab === 'tasks' && (
                            <PersonalProductTasksTab
                                ref={taskRef}
                                product={selectedProduct}
                                tasks={selectedProduct.tasks || []}
                                loading={loading}
                                refetch={refetch}
                                // UI State
                                isLocked={isTasksLocked}
                                showFilters={showTaskFilters}
                                visibleColumns={visibleTaskColumns}
                                // Filters
                                filters={{
                                    tags: taskTagFilter,
                                    outcomes: taskOutcomeFilter,
                                    releases: taskReleaseFilter,
                                    licenses: taskLicenseFilter
                                }}
                                onFilterChange={{
                                    setTags: setTaskTagFilter,
                                    setOutcomes: setTaskOutcomeFilter,
                                    setReleases: setTaskReleaseFilter,
                                    setLicenses: setTaskLicenseFilter
                                }}
                            />
                        )}

                        <PersonalProductMetadataSection
                            selectedProduct={selectedProduct}
                            selectedSubSection={activeTab}
                            externalAddMode={externalAddMode}
                            setExternalAddMode={setExternalAddMode}
                            tasks={selectedProduct.tasks || []}
                        />
                    </Box>
                </Paper>
            ) : (
                <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
                    <Typography variant="h6">No products found</Typography>
                    <Typography>Add a product from the catalog or import one to get started.</Typography>
                </Box>
            )}

            {/* Dialogs */}
            <PersonalProductDialog
                open={isProductDialogOpen}
                onClose={() => setIsProductDialogOpen(false)}
                onSaved={() => { refetch(); setIsProductDialogOpen(false); }}
                product={selectedProduct}
            />
            <AssignFromCatalogDialog
                open={isAssignDialogOpen}
                onClose={() => setIsAssignDialogOpen(false)}
                onSuccess={() => { refetch(); setIsAssignDialogOpen(false); }}
            />
            <BulkImportDialog
                open={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
                onSuccess={() => {
                    refetch();
                    setIsImportDialogOpen(false);
                }}
                entityType="PERSONAL_PRODUCT"
            />

            {/* Telemetry Import Result Dialog */}
            <TelemetryImportResultDialog
                state={importResultDialog}
                onClose={() => setImportResultDialog({ ...importResultDialog, open: false })}
            />
        </Box>
    );
});
