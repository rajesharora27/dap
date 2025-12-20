import React, { useState, useEffect, useRef } from 'react';
import { EntitySummary } from '../components/EntitySummary';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, CircularProgress, Card, CardContent,
    Checkbox, OutlinedInput, Collapse
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Edit, Delete, Add, DragIndicator, FileDownload, FileUpload, Description, CheckCircle, Extension, FilterList, ExpandMore, ExpandLess } from '../components/common/FAIcon';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PRODUCTS, TASKS_FOR_PRODUCT, OUTCOMES, PRODUCT } from '../graphql/queries';
import { DELETE_PRODUCT, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK, CREATE_OUTCOME, UPDATE_OUTCOME, DELETE_OUTCOME, CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE, CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE, CREATE_PRODUCT, UPDATE_PRODUCT, CREATE_PRODUCT_TAG, UPDATE_PRODUCT_TAG, DELETE_PRODUCT_TAG } from '../graphql/mutations';
import { SortableTaskItem } from '../components/SortableTaskItem';
import { ProductDialog } from '../components/dialogs/ProductDialog';
import { TaskDialog } from '../components/dialogs/TaskDialog';
import { OutcomeDialog } from '../components/dialogs/OutcomeDialog';
import { ReleaseDialog } from '../components/dialogs/ReleaseDialog';
import { LicenseDialog } from '../components/dialogs/LicenseDialog';
import { CustomAttributeDialog } from '../components/dialogs/CustomAttributeDialog';
import { TagDialog, ProductTag } from '../components/dialogs/TagDialog';
import { useAuth } from '../components/AuthContext';
import { useProductImportExport } from '../hooks/useProductImportExport';

interface ProductsPageProps {
    onEditProduct: (product: any) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onEditProduct }) => {
    // State
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState<string | null>(localStorage.getItem('lastSelectedProductId'));
    const [selectedSubSection, setSelectedSubSection] = useState<'dashboard' | 'tasks' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags'>('dashboard');
    const importFileRef = useRef<HTMLInputElement>(null);

    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Dialog States
    const [taskDialog, setTaskDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [outcomeDialog, setOutcomeDialog] = useState(false);
    const [editingOutcome, setEditingOutcome] = useState<any>(null);
    const [releaseDialog, setReleaseDialog] = useState(false);
    const [editingRelease, setEditingRelease] = useState<any>(null);
    const [licenseDialog, setLicenseDialog] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);
    const [productDialog, setProductDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [customAttrDialog, setCustomAttrDialog] = useState(false);
    const [editingCustomAttr, setEditingCustomAttr] = useState<any>(null);
    const [tagDialog, setTagDialog] = useState(false);
    const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
    const [taskTagFilter, setTaskTagFilter] = useState<string[]>([]);
    const [taskOutcomeFilter, setTaskOutcomeFilter] = useState<string[]>([]);
    const [taskReleaseFilter, setTaskReleaseFilter] = useState<string[]>([]);
    const [taskLicenseFilter, setTaskLicenseFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Queries
    const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery(PRODUCTS, {
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated
    });
    const products = productsData?.products?.edges?.map((e: any) => e.node) || [];

    // Fetch single product details if selected
    const { data: productData, error: productError, refetch: refetchProductDetail } = useQuery(PRODUCT, {
        variables: { id: selectedProduct },
        skip: !selectedProduct,
        fetchPolicy: 'cache-and-network' // FORCE NETWORK REQUEST to ensure data
    });

    if (selectedProduct) {
        console.log('[DEBUG ProductsPage] State:', {
            selectedProduct,
            hasProductData: !!productData,
            fetchedProduct: productData?.product,
            error: productError,
            productsInList: products.length
        });
    }

    const fetchedProduct = productData?.product;
    const listProduct = products.find((p: any) => p.id === selectedProduct);
    const displayProduct = (fetchedProduct?.id === selectedProduct) ? fetchedProduct : listProduct;

    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(TASKS_FOR_PRODUCT, {
        variables: { productId: selectedProduct },
        skip: !selectedProduct
    });
    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    // Filter tasks based on selected filters (AND logic between filter types)
    const filteredTasks = tasks.filter((task: any) => {
        // Tag filter (OR within tags)
        if (taskTagFilter.length > 0) {
            if (!task.tags?.some((t: any) => taskTagFilter.includes(t.id))) {
                return false;
            }
        }
        // Outcome filter (OR within outcomes)
        if (taskOutcomeFilter.length > 0) {
            // If task has NO specific outcomes, it implies it applies to ALL outcomes
            const hasSpecificOutcomes = task.outcomes && task.outcomes.length > 0;
            if (hasSpecificOutcomes) {
                if (!task.outcomes.some((o: any) => taskOutcomeFilter.includes(o.id))) {
                    return false;
                }
            }
            // If !hasSpecificOutcomes, we keep it (matches all)
        }
        // Release filter (OR within releases)
        if (taskReleaseFilter.length > 0) {
            // If task has NO specific releases, it implies it applies to ALL releases
            const hasSpecificReleases = task.releases && task.releases.length > 0;
            if (hasSpecificReleases) {
                if (!task.releases.some((r: any) => taskReleaseFilter.includes(r.id))) {
                    return false;
                }
            }
            // If !hasSpecificReleases, we keep it (matches all)
        }
        // License filter (hierarchical - higher level includes lower levels)
        if (taskLicenseFilter.length > 0) {
            if (!task.license) {
                return false;
            }
            // Get the maximum level from selected licenses (higher level = includes more)
            const selectedLicenses = displayProduct?.licenses?.filter((l: any) => taskLicenseFilter.includes(l.id)) || [];
            const maxSelectedLevel = Math.max(...selectedLicenses.map((l: any) => l.level || 0));
            // Task's license level must be <= max selected level
            if ((task.license.level || 0) > maxSelectedLevel) {
                return false;
            }
        }
        return true;
    });

    // Check if any filter is active
    const hasActiveFilters = taskTagFilter.length > 0 || taskOutcomeFilter.length > 0 || taskReleaseFilter.length > 0 || taskLicenseFilter.length > 0;

    // Clear all filters handler
    const handleClearFilters = () => {
        setTaskTagFilter([]);
        setTaskOutcomeFilter([]);
        setTaskReleaseFilter([]);
        setTaskLicenseFilter([]);
    };

    const client = useApolloClient();

    // Import/Export Hook
    const { handleExport, handleImport, isImporting, importProgress } = useProductImportExport(
        selectedProduct,
        products,
        tasks,
        async () => {
            await refetchProducts();
            await refetchTasks();
        }
    );
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handlers
    const handleProductChange = (productId: string) => {
        setSelectedProduct(productId);
        localStorage.setItem('lastSelectedProductId', productId);
        // Preserve the current tab when changing products
        // setSelectedSubSection('dashboard'); // Removed to persist tab
        // Force refetch tasks when product changes or tab is selected
        setTimeout(() => refetchTasks(), 0);
    };

    useEffect(() => {
        if (selectedSubSection === 'tasks' && selectedProduct) {
            refetchTasks();
        }
    }, [selectedSubSection, selectedProduct, refetchTasks]);

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await client.mutate({
                    mutation: DELETE_PRODUCT,
                    variables: { id: selectedProduct },
                    refetchQueries: ['Products'],
                    awaitRefetchQueries: true
                });
                setSelectedProduct(null);
                localStorage.removeItem('lastSelectedProductId');
            } catch (error: any) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product: ' + error.message);
            }
        }
    };

    // Tag Handlers
    const handleSaveTag = async (tagData: Omit<ProductTag, 'id'>, existingId?: string) => {
        try {
            if (existingId) {
                await client.mutate({
                    mutation: UPDATE_PRODUCT_TAG,
                    variables: { id: existingId, input: tagData },
                    refetchQueries: ['Products', 'Product', 'ProductDetail', 'GetProductTags'],
                    awaitRefetchQueries: true
                });
            } else {
                await client.mutate({
                    mutation: CREATE_PRODUCT_TAG,
                    variables: { input: { ...tagData, productId: selectedProduct } },
                    refetchQueries: ['Products', 'Product', 'ProductDetail', 'GetProductTags'],
                    awaitRefetchQueries: true
                });
            }
            // Force refetch because sometimes cache update is tricky with nested fields
            refetchProductDetail();
        } catch (error) {
            console.error('Error saving tag:', error);
            alert('Failed to save tag');
        }
    };

    const handleDeleteTag = async (tagId: string) => {
        if (!window.confirm('Delete this tag?')) return;
        try {
            await client.mutate({
                mutation: DELETE_PRODUCT_TAG,
                variables: { id: tagId },
                refetchQueries: ['Products', 'Product', 'ProductDetail', 'GetProductTags'],
                awaitRefetchQueries: true
            });
            refetchProductDetail();
        } catch (error) {
            console.error('Error deleting tag:', error);
            alert('Failed to delete tag');
        }
    };

    // Drag and Drop
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = tasks.findIndex((t: any) => t.id === active.id);
            const newIndex = tasks.findIndex((t: any) => t.id === over.id);

            const newOrder = arrayMove(tasks, oldIndex, newIndex).map((t: any) => t.id);

            try {
                await client.mutate({
                    mutation: REORDER_TASKS,
                    variables: { productId: selectedProduct, order: newOrder },
                    refetchQueries: ['TasksForProduct']
                });
            } catch (error) {
                console.error('Error reordering tasks:', error);
            }
        }
    };

    // Helper to get sorted attributes
    const getSortedAttributes = (attrs: any) => {
        if (!attrs) return [];
        const order = attrs._order || [];
        const entries = Object.entries(attrs).filter(([k]) => k !== '_order' && k !== '__typename');

        return entries.sort((a, b) => {
            const indexA = order.indexOf(a[0]);
            const indexB = order.indexOf(b[0]);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    };

    // Attribute Drag End


    // Custom Attribute handlers
    const handleSaveCustomAttr = async (attrData: { key: string; value: any }) => {
        if (!displayProduct) return;

        const currentAttrs = displayProduct.customAttrs || {};
        const updatedAttrs = { ...currentAttrs };
        const order = [...(updatedAttrs._order || [])];

        // If editing and key changed, remove old key
        if (editingCustomAttr && editingCustomAttr.key !== attrData.key) {
            delete updatedAttrs[editingCustomAttr.key];
            const idx = order.indexOf(editingCustomAttr.key);
            if (idx > -1) order.splice(idx, 1);
        }

        updatedAttrs[attrData.key] = attrData.value;
        if (!order.includes(attrData.key)) {
            order.push(attrData.key);
        }
        updatedAttrs._order = order;

        try {
            await client.mutate({
                mutation: UPDATE_PRODUCT,
                variables: {
                    id: selectedProduct,
                    input: {
                        name: displayProduct.name,
                        description: displayProduct.description,
                        customAttrs: updatedAttrs
                    }
                },
                refetchQueries: ['Products', 'ProductDetail'],
                awaitRefetchQueries: true
            });
            await Promise.all([
                refetchProducts(),
                refetchProductDetail()
            ]);
            setCustomAttrDialog(false);
            setEditingCustomAttr(null);
        } catch (error) {
            console.error('Error saving custom attribute:', error);
            alert('Failed to save custom attribute');
        }
    };

    const handleDeleteCustomAttr = async (key: string) => {
        if (!displayProduct || !window.confirm(`Delete attribute "${key}"?`)) return;

        const currentAttrs = displayProduct.customAttrs || {};
        const updatedAttrs = { ...currentAttrs };
        delete updatedAttrs[key];

        // Remove from order
        if (updatedAttrs._order) {
            updatedAttrs._order = updatedAttrs._order.filter((k: string) => k !== key);
        }

        try {
            await client.mutate({
                mutation: UPDATE_PRODUCT,
                variables: {
                    id: selectedProduct,
                    input: {
                        name: displayProduct.name,
                        description: displayProduct.description,
                        customAttrs: updatedAttrs
                    }
                },
                refetchQueries: ['Products', 'ProductDetail'],
                awaitRefetchQueries: true
            });
            await Promise.all([
                refetchProducts(),
                refetchProductDetail()
            ]);
        } catch (error) {
            console.error('Error deleting custom attribute:', error);
            alert('Failed to delete custom attribute');
        }
    };

    const handleSaveTask = async (taskData: any) => {
        const isEdit = !!editingTask;
        const taskId = editingTask?.id;

        try {
            const input: any = {
                name: taskData.name,
                estMinutes: taskData.estMinutes,
                weight: taskData.weight
            };

            if (!isEdit) {
                input.productId = selectedProduct;
            }

            if (taskData.description?.trim()) input.description = taskData.description.trim();
            if (taskData.notes?.trim()) input.notes = taskData.notes.trim();
            if (taskData.howToDoc) input.howToDoc = taskData.howToDoc;
            if (taskData.howToVideo) input.howToVideo = taskData.howToVideo;
            if (taskData.licenseId) input.licenseId = taskData.licenseId;
            if (taskData.outcomeIds) input.outcomeIds = taskData.outcomeIds;
            if (taskData.releaseIds) input.releaseIds = taskData.releaseIds;
            if (taskData.tags) input.tagIds = taskData.tags;

            if (taskData.telemetryAttributes) {
                input.telemetryAttributes = taskData.telemetryAttributes.map((attr: any) => ({
                    name: attr.name,
                    description: attr.description,
                    dataType: attr.dataType,
                    isRequired: attr.isRequired,
                    successCriteria: attr.successCriteria,
                    order: attr.order
                }));
            }

            if (isEdit) {
                await client.mutate({
                    mutation: UPDATE_TASK,
                    variables: { id: taskId, input },
                    refetchQueries: ['TasksForProduct'],
                    awaitRefetchQueries: true
                });
            } else {
                await client.mutate({
                    mutation: CREATE_TASK,
                    variables: { input },
                    refetchQueries: ['TasksForProduct'],
                    awaitRefetchQueries: true
                });
            }
            setTaskDialog(false);
            setEditingTask(null);
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await client.mutate({
                    mutation: DELETE_TASK,
                    variables: { id: taskId },
                    refetchQueries: ['TasksForProduct'],
                    awaitRefetchQueries: true
                });
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Failed to delete task');
            }
        }
    };

    // Handle weight change from inline edit
    const handleWeightChange = async (taskId: string, taskName: string, newWeight: number) => {
        try {
            await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: taskId,
                    input: { weight: newWeight }
                },
                refetchQueries: ['TasksForProduct'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error updating task weight:', error);
            alert('Failed to update weight');
        }
    };

    // Handle sequence number change from inline edit
    const handleSequenceChange = async (taskId: string, taskName: string, newSequence: number) => {
        try {
            // Create a new order based on moving the task to the new sequence position
            const sortedTasks = [...tasks].sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);
            const currentIndex = sortedTasks.findIndex((t: any) => t.id === taskId);

            if (currentIndex === -1) return;

            // Calculate the target index (newSequence is 1-based)
            let targetIndex = Math.min(Math.max(newSequence - 1, 0), sortedTasks.length - 1);

            // Reorder the tasks
            const reorderedTasks = arrayMove(sortedTasks, currentIndex, targetIndex);
            const newOrder = reorderedTasks.map((t: any) => t.id);

            await client.mutate({
                mutation: REORDER_TASKS,
                variables: { productId: selectedProduct, order: newOrder },
                refetchQueries: ['TasksForProduct'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error reordering tasks:', error);
            alert('Failed to update sequence');
        }
    };

    const handleSaveOutcome = async (input: any) => {
        try {
            if (editingOutcome) {
                await client.mutate({
                    mutation: UPDATE_OUTCOME,
                    variables: { id: editingOutcome.id, input },
                    refetchQueries: ['Products', 'Outcomes']
                });
            } else {
                await client.mutate({
                    mutation: CREATE_OUTCOME,
                    variables: { input: { ...input, productId: selectedProduct } },
                    refetchQueries: ['Products', 'Outcomes']
                });
            }
            setOutcomeDialog(false);
            setEditingOutcome(null);
        } catch (error: any) {
            alert('Error saving outcome: ' + error.message);
        }
    };

    const handleDeleteOutcome = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this outcome?')) {
            try {
                await client.mutate({
                    mutation: DELETE_OUTCOME,
                    variables: { id },
                    refetchQueries: ['Products', 'Outcomes']
                });
            } catch (error: any) {
                alert('Error deleting outcome: ' + error.message);
            }
        }
    };

    const handleSaveRelease = async (input: any) => {
        try {
            if (editingRelease) {
                await client.mutate({
                    mutation: UPDATE_RELEASE,
                    variables: { id: editingRelease.id, input },
                    refetchQueries: ['Products']
                });
            } else {
                await client.mutate({
                    mutation: CREATE_RELEASE,
                    variables: { input: { ...input, productId: selectedProduct } },
                    refetchQueries: ['Products']
                });
            }
            setReleaseDialog(false);
            setEditingRelease(null);
        } catch (error: any) {
            alert('Error saving release: ' + error.message);
        }
    };

    const handleDeleteRelease = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this release?')) {
            try {
                await client.mutate({
                    mutation: DELETE_RELEASE,
                    variables: { id },
                    refetchQueries: ['Products']
                });
            } catch (error: any) {
                alert('Error deleting release: ' + error.message);
            }
        }
    };

    const handleSaveLicense = async (input: any) => {
        try {
            if (editingLicense) {
                await client.mutate({
                    mutation: UPDATE_LICENSE,
                    variables: { id: editingLicense.id, input },
                    refetchQueries: ['Products']
                });
            } else {
                await client.mutate({
                    mutation: CREATE_LICENSE,
                    variables: { input: { ...input, productId: selectedProduct } },
                    refetchQueries: ['Products']
                });
            }
            setLicenseDialog(false);
            setEditingLicense(null);
        } catch (error: any) {
            alert('Error saving license: ' + error.message);
        }
    };

    const handleDeleteLicense = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this license?')) {
            try {
                await client.mutate({
                    mutation: DELETE_LICENSE,
                    variables: { id },
                    refetchQueries: ['Products']
                });
            } catch (error: any) {
                alert('Error deleting license: ' + error.message);
            }
        }
    };

    const theme = useTheme();

    return (
        <React.Fragment> {/* Wrapping just in case */}
            {/* Product Selection Header */}
            {productsLoading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Product Selector and Actions */}
            {!productsLoading && !productsError && (
                <Paper sx={{ p: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <FormControl sx={{ flex: '1 1 250px', minWidth: 200 }} size="small">
                            <InputLabel>Select Product</InputLabel>
                            <Select
                                value={selectedProduct || ''}
                                onChange={(e) => handleProductChange(e.target.value)}
                                label="Select Product"
                            >
                                {[...products].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((product: any) => (
                                    <MenuItem key={product.id} value={product.id}>
                                        {product.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                            {selectedProduct && (
                                <>
                                    <Button
                                        variant="contained"
                                        startIcon={<Edit />}
                                        size="small"
                                        onClick={() => {
                                            if (displayProduct) onEditProduct(displayProduct);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FileDownload />}
                                        size="small"
                                        onClick={handleExport}
                                    >
                                        Export
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FileUpload />}
                                        size="small"
                                        onClick={() => importFileRef.current?.click()}
                                    >
                                        Import
                                    </Button>
                                    <input
                                        ref={importFileRef}
                                        type="file"
                                        accept=".xlsx"
                                        style={{ display: 'none' }}
                                        onChange={handleImport}
                                    />
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<Delete />}
                                        size="small"
                                        onClick={handleDeleteProduct}
                                    >
                                        Delete
                                    </Button>
                                </>
                            )}

                            {/* Always visible Add button */}
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<Add />}
                                size="small"
                                onClick={() => { setEditingProduct(null); setProductDialog(true); }}
                            >
                                Add Product
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Content Area */}
            {selectedProduct && displayProduct && (
                <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tabs
                            value={selectedSubSection}
                            onChange={(_, v) => setSelectedSubSection(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}
                        >
                            <Tab label="Dashboard" value="dashboard" />
                            <Tab label={`Tasks${tasks.length > 0 ? ` (${hasActiveFilters ? `${filteredTasks.length}/${tasks.length}` : tasks.length})` : ''}`} value="tasks" />
                            <Tab label="Tags" value="tags" />
                            <Tab label="Outcomes" value="outcomes" />
                            <Tab label="Releases" value="releases" />
                            <Tab label="Licenses" value="licenses" />
                            <Tab label="Custom Attributes" value="customAttributes" />
                        </Tabs>

                        {selectedSubSection !== 'dashboard' && (
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                size="small"
                                sx={{ ml: 2, flexShrink: 0 }}
                                onClick={() => {
                                    switch (selectedSubSection) {
                                        case 'tasks': setEditingTask(null); setTaskDialog(true); break;
                                        case 'outcomes': setEditingOutcome(null); setOutcomeDialog(true); break;
                                        case 'releases': setEditingRelease(null); setReleaseDialog(true); break;
                                        case 'licenses': setEditingLicense(null); setLicenseDialog(true); break;
                                        case 'customAttributes': setEditingCustomAttr(null); setCustomAttrDialog(true); break;
                                        case 'tags': setEditingTag(null); setTagDialog(true); break;
                                    }
                                }}
                            >
                                {selectedSubSection === 'tasks' ? 'Add Task' :
                                    selectedSubSection === 'outcomes' ? 'Add Outcome' :
                                        selectedSubSection === 'releases' ? 'Add Release' :
                                            selectedSubSection === 'licenses' ? 'Add License' :
                                                selectedSubSection === 'customAttributes' ? 'Add Attribute' : 'Add'}
                            </Button>
                        )}
                    </Box>

                    {selectedSubSection === 'dashboard' && (
                        <Box sx={{ mt: 2 }}>
                            {/* Read-only Dashboard Layout - Full Width */}
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    {/* Product Name Header */}
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 3,
                                            mb: 3,
                                            borderRadius: 2,
                                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
                                            borderLeft: `6px solid ${theme.palette.primary.main}`
                                        }}
                                    >
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
                                            {displayProduct.name}
                                        </Typography>
                                    </Paper>

                                    {/* Overview */}
                                    <Card
                                        elevation={2}
                                        sx={{
                                            mb: 3,
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <Description sx={{ color: theme.palette.primary.main }} />
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                                    Overview
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    lineHeight: 1.7,
                                                    color: theme.palette.text.secondary,
                                                    whiteSpace: 'pre-line',
                                                    pl: 1,
                                                    borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`
                                                }}
                                            >
                                                {displayProduct.description || 'No detailed description provided for this product.'}
                                            </Typography>
                                        </CardContent>
                                    </Card>

                                    {/* Outcomes */}
                                    <Card
                                        elevation={2}
                                        sx={{
                                            borderRadius: 2,
                                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <CheckCircle sx={{ color: theme.palette.success.main }} />
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                                                    Outcomes
                                                </Typography>
                                                <Chip
                                                    label={displayProduct.outcomes?.length || 0}
                                                    size="small"
                                                    sx={{
                                                        ml: 1,
                                                        bgcolor: alpha(theme.palette.success.main, 0.15),
                                                        color: theme.palette.success.dark,
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            </Box>
                                            {displayProduct.outcomes && displayProduct.outcomes.length > 0 ? (
                                                <List disablePadding>
                                                    {displayProduct.outcomes.map((o: any, idx: number) => (
                                                        <ListItem
                                                            key={o.id}
                                                            sx={{
                                                                py: 1.5,
                                                                px: 2,
                                                                bgcolor: idx % 2 === 0 ? alpha(theme.palette.success.main, 0.03) : 'transparent',
                                                                borderRadius: 1,
                                                                mb: 0.5
                                                            }}
                                                        >
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                                        {o.name}
                                                                    </Typography>
                                                                }
                                                                secondary={o.description && (
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                        {o.description}
                                                                    </Typography>
                                                                )}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                                    No outcomes defined for this product.
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {selectedSubSection === 'tasks' && (
                        <Box>
                            {/* Tasks View */}
                            {(tasksLoading || tasksError) && (
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                                    {tasksLoading && <CircularProgress size={24} />}
                                    {tasksError && <Typography color="error" variant="body2">{tasksError.message}</Typography>}
                                </Box>
                            )}

                            {/* Filter Section */}
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                        size="small"
                                        startIcon={<FilterList />}
                                        endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                                        onClick={() => setShowFilters(!showFilters)}
                                        color={hasActiveFilters ? "primary" : "inherit"}
                                        variant={hasActiveFilters ? "contained" : "text"}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Filters {hasActiveFilters && `(${[taskTagFilter, taskOutcomeFilter, taskReleaseFilter, taskLicenseFilter].filter(f => f.length > 0).length})`}
                                    </Button>
                                    {hasActiveFilters && (
                                        <Chip
                                            label="Active"
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            onDelete={handleClearFilters}
                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {tasksLoading && <CircularProgress size={20} />}
                                    {tasksError && <Typography color="error" variant="caption">{tasksError.message}</Typography>}
                                </Box>
                            </Box>

                            <Collapse in={showFilters}>
                                <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {/* Tag Filter */}
                                    <FormControl size="small" sx={{ minWidth: 160 }}>
                                        <InputLabel>Tags</InputLabel>
                                        <Select
                                            multiple
                                            value={taskTagFilter}
                                            onChange={(e) => setTaskTagFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                            input={<OutlinedInput label="Tags" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => {
                                                        const tag = displayProduct?.tags?.find((t: any) => t.id === value);
                                                        return (
                                                            <Chip key={value} label={tag?.name || value} size="small" style={{ backgroundColor: tag?.color || '#ccc', color: '#fff' }} sx={{ height: 20 }} />
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {displayProduct?.tags?.map((tag: any) => (
                                                <MenuItem key={tag.id} value={tag.id}>
                                                    <Checkbox checked={taskTagFilter.indexOf(tag.id) > -1} size="small" />
                                                    <Typography>{tag.name}</Typography>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {/* Outcomes Filter */}
                                    {displayProduct?.outcomes?.length > 0 && (
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Outcomes</InputLabel>
                                            <Select
                                                multiple
                                                value={taskOutcomeFilter}
                                                onChange={(e) => setTaskOutcomeFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                input={<OutlinedInput label="Outcomes" />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => {
                                                            const outcome = displayProduct?.outcomes?.find((o: any) => o.id === value);
                                                            return (
                                                                <Chip key={value} label={outcome?.name || value} size="small" color="success" sx={{ height: 20 }} />
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            >
                                                {displayProduct?.outcomes?.map((outcome: any) => (
                                                    <MenuItem key={outcome.id} value={outcome.id}>
                                                        <Checkbox checked={taskOutcomeFilter.indexOf(outcome.id) > -1} size="small" />
                                                        <Typography>{outcome.name}</Typography>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {/* Releases Filter */}
                                    {displayProduct?.releases?.length > 0 && (
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Releases</InputLabel>
                                            <Select
                                                multiple
                                                value={taskReleaseFilter}
                                                onChange={(e) => setTaskReleaseFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                input={<OutlinedInput label="Releases" />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => {
                                                            const release = displayProduct?.releases?.find((r: any) => r.id === value);
                                                            return (
                                                                <Chip key={value} label={release?.name || value} size="small" color="info" sx={{ height: 20 }} />
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            >
                                                {displayProduct?.releases?.map((release: any) => (
                                                    <MenuItem key={release.id} value={release.id}>
                                                        <Checkbox checked={taskReleaseFilter.indexOf(release.id) > -1} size="small" />
                                                        <Typography>{release.name}</Typography>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {/* Licenses Filter */}
                                    {displayProduct?.licenses?.length > 0 && (
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Licenses</InputLabel>
                                            <Select
                                                multiple
                                                value={taskLicenseFilter}
                                                onChange={(e) => setTaskLicenseFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                input={<OutlinedInput label="Licenses" />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => {
                                                            const license = displayProduct?.licenses?.find((l: any) => l.id === value);
                                                            return (
                                                                <Chip key={value} label={license?.name || value} size="small" color="warning" sx={{ height: 20 }} />
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            >
                                                {displayProduct?.licenses?.map((license: any) => (
                                                    <MenuItem key={license.id} value={license.id}>
                                                        <Checkbox checked={taskLicenseFilter.indexOf(license.id) > -1} size="small" />
                                                        <Typography>{license.name}</Typography>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {/* Clear Filters Button */}
                                    {hasActiveFilters && (
                                        <Button size="small" onClick={handleClearFilters} variant="outlined" color="secondary">
                                            Clear All
                                        </Button>
                                    )}
                                </Box>
                            </Collapse>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell width={40}></TableCell>
                                                <TableCell width={80}>Seq</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Tags</TableCell>
                                                <TableCell>Resources</TableCell>
                                                <TableCell width={100}>Weight</TableCell>
                                                <TableCell>Telemetry</TableCell>
                                                <TableCell width={100}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            <SortableContext items={filteredTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                                                {filteredTasks.map((task: any) => (
                                                    <SortableTaskItem
                                                        key={task.id}
                                                        task={task}
                                                        onEdit={(t: any) => { setEditingTask(t); setTaskDialog(true); }}
                                                        onDelete={handleDeleteTask}
                                                        onDoubleClick={(t: any) => { setEditingTask(t); setTaskDialog(true); }}
                                                        onWeightChange={handleWeightChange}
                                                        onSequenceChange={handleSequenceChange}
                                                        disableDrag={hasActiveFilters}
                                                    />
                                                ))}
                                                {filteredTasks.length === 0 && !tasksLoading && (
                                                    <TableRow>
                                                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                            <Typography color="text.secondary">
                                                                {hasActiveFilters ? 'No tasks match the selected filters' : 'No tasks found for this product'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </DndContext>
                        </Box>
                    )}

                    {selectedSubSection === 'outcomes' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>

                                    <List>
                                        {displayProduct?.outcomes?.map((outcome: any) => (
                                            <Tooltip key={outcome.id} title={outcome.description || ''} placement="top" arrow>
                                                <ListItem
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderBottom: '1px solid #eee'
                                                    }}
                                                    onDoubleClick={() => { setEditingOutcome(outcome); setOutcomeDialog(true); }}
                                                    secondaryAction={
                                                        <Box>
                                                            <IconButton size="small" onClick={() => { setEditingOutcome(outcome); setOutcomeDialog(true); }}><Edit fontSize="small" /></IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteOutcome(outcome.id)} color="error"><Delete fontSize="small" /></IconButton>
                                                        </Box>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={outcome.name}
                                                        secondary={outcome.description}
                                                    />
                                                </ListItem>
                                            </Tooltip>
                                        ))}
                                        {(!displayProduct?.outcomes || displayProduct.outcomes.length === 0) && (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                                No outcomes defined
                                            </Typography>
                                        )}
                                    </List>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'releases' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>

                                    <List>
                                        {displayProduct?.releases?.map((release: any) => (
                                            <Tooltip key={release.id} title={release.description || ''} placement="top" arrow>
                                                <ListItem
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderBottom: '1px solid #eee'
                                                    }}
                                                    onDoubleClick={() => { setEditingRelease(release); setReleaseDialog(true); }}
                                                    secondaryAction={
                                                        <Box>
                                                            <IconButton size="small" onClick={() => { setEditingRelease(release); setReleaseDialog(true); }}><Edit fontSize="small" /></IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteRelease(release.id)} color="error"><Delete fontSize="small" /></IconButton>
                                                        </Box>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={`${release.name} (v${release.level})`}
                                                        secondary={release.description}
                                                    />
                                                </ListItem>
                                            </Tooltip>
                                        ))}
                                        {(!displayProduct?.releases || displayProduct.releases.length === 0) && (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                                No releases defined
                                            </Typography>
                                        )}
                                    </List>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'licenses' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>

                                    <List>
                                        {displayProduct?.licenses?.map((license: any) => (
                                            <Tooltip key={license.id} title={license.description || ''} placement="top" arrow>
                                                <ListItem
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderBottom: '1px solid #eee'
                                                    }}
                                                    onDoubleClick={() => { setEditingLicense(license); setLicenseDialog(true); }}
                                                    secondaryAction={
                                                        <Box>
                                                            <IconButton size="small" onClick={() => { setEditingLicense(license); setLicenseDialog(true); }}><Edit fontSize="small" /></IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteLicense(license.id)} color="error"><Delete fontSize="small" /></IconButton>
                                                        </Box>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={`${license.name} (Level ${license.level})`}
                                                        secondary={license.description}
                                                    />
                                                </ListItem>
                                            </Tooltip>
                                        ))}
                                        {(!displayProduct?.licenses || displayProduct.licenses.length === 0) && (
                                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                                No licenses defined
                                            </Typography>
                                        )}
                                    </List>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'customAttributes' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell width={40}></TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Attribute</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                                                    <TableCell width={100} align="right">Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {getSortedAttributes(displayProduct?.customAttrs).map(([key, value]) => (
                                                    <TableRow key={key} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                        <TableCell>
                                                            <DragIndicator fontSize="small" sx={{ color: 'text.disabled' }} />
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 500 }}>{key}</TableCell>
                                                        <TableCell>
                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setEditingCustomAttr({ key, value });
                                                                    setCustomAttrDialog(true);
                                                                }}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteCustomAttr(key)}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {getSortedAttributes(displayProduct?.customAttrs).length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                                                            No custom attributes defined
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'tags' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>
                                    {(!displayProduct?.tags || displayProduct.tags.length === 0) ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                                            No tags defined for this product. Click "Add" to create one.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {displayProduct.tags.map((tag: any) => (
                                                <Chip
                                                    key={tag.id}
                                                    label={tag.name}
                                                    sx={{
                                                        backgroundColor: tag.color,
                                                        color: '#fff',
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                        '& .MuiChip-deleteIcon': {
                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                            '&:hover': {
                                                                color: '#fff'
                                                            }
                                                        }
                                                    }}
                                                    onClick={() => {
                                                        setEditingTag(tag);
                                                        setTagDialog(true);
                                                    }}
                                                    onDelete={() => handleDeleteTag(tag.id)}
                                                    deleteIcon={
                                                        <Tooltip title="Delete Tag">
                                                            <Delete />
                                                        </Tooltip>
                                                    }
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    )}


                </>
            )
            }

            {/* Dialogs */}
            <TaskDialog
                open={taskDialog}
                onClose={() => setTaskDialog(false)}
                title="Task Details"
                task={editingTask}
                productId={selectedProduct || undefined}
                onSave={handleSaveTask}
                existingTasks={tasks}
                outcomes={displayProduct?.outcomes || []}
                availableLicenses={displayProduct?.licenses || []}
                availableReleases={displayProduct?.releases || []}
                availableTags={displayProduct?.tags || []}
            />
            <OutcomeDialog
                open={outcomeDialog}
                onClose={() => setOutcomeDialog(false)}
                outcome={editingOutcome}
                onSave={handleSaveOutcome}
            />
            <ReleaseDialog
                open={releaseDialog}
                onClose={() => setReleaseDialog(false)}
                title={editingRelease ? 'Edit Release' : 'Add Release'}
                release={editingRelease}
                onSave={handleSaveRelease}
            />
            <LicenseDialog
                open={licenseDialog}
                onClose={() => setLicenseDialog(false)}
                license={editingLicense}
                onSave={handleSaveLicense}
            />

            {/* Import Progress Dialog */}
            <Dialog open={isImporting} disableEscapeKeyDown>
                <DialogTitle>Importing Product Data</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2, minWidth: 300 }}>
                        <CircularProgress />
                        <Typography>{importProgress || 'Processing...'}</Typography>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Product Dialog */}
            <ProductDialog
                open={productDialog}
                onClose={() => setProductDialog(false)}
                onSave={async (data: any) => {
                    try {
                        if (editingProduct) {
                            // Update existing product
                            await client.mutate({
                                mutation: UPDATE_PRODUCT,
                                variables: {
                                    id: editingProduct.id,
                                    input: {
                                        name: data.name,
                                        description: data.description,
                                        customAttrs: data.customAttrs
                                    }
                                },
                                refetchQueries: ['Products', 'ProductDetail'],
                                awaitRefetchQueries: true
                            });

                            // Note: Outcomes, Licenses, and Releases are currently handled by their own dialogs
                            // or would need separate reconciliation logic here if they were modified in ProductDialog.
                            // For now, we focus on name, description, and customAttrs (including order).
                        } else {
                            // Create new product
                            const result = await client.mutate({
                                mutation: CREATE_PRODUCT,
                                variables: { input: { name: data.name, description: data.description, customAttrs: data.customAttrs } },
                                refetchQueries: ['Products'],
                                awaitRefetchQueries: true
                            });
                            const newProductId = result.data.createProduct.id;
                            setSelectedProduct(newProductId);
                            localStorage.setItem('lastSelectedProductId', newProductId);
                        }

                        setProductDialog(false);
                        setEditingProduct(null);
                        await Promise.all([
                            refetchProducts(),
                            selectedProduct ? refetchProductDetail() : Promise.resolve()
                        ]);
                    } catch (error: any) {
                        console.error('Error saving product:', error);
                        alert('Failed to save product: ' + error.message);
                    }
                }}
                product={editingProduct}
                title={editingProduct ? 'Edit Product' : 'Add Product'}
                availableReleases={[]}
            />

            {/* Custom Attribute Dialog */}
            <CustomAttributeDialog
                open={customAttrDialog}
                onClose={() => { setCustomAttrDialog(false); setEditingCustomAttr(null); }}
                onSave={handleSaveCustomAttr}
                attribute={editingCustomAttr}
                existingKeys={Object.keys(displayProduct?.customAttrs || {})}
            />

            {/* Tag Dialog */}
            <TagDialog
                open={tagDialog}
                onClose={() => { setTagDialog(false); setEditingTag(null); }}
                onSave={handleSaveTag}
                tag={editingTag}
                existingNames={displayProduct?.tags?.map((t: any) => t.name) || []}
            />
        </React.Fragment>
    );
};

// Sortable Row Component (Internal)
const SortableAttributeRow = ({ id, attrKey, value, onEdit, onDelete }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    return (
        <TableRow ref={setNodeRef} style={style} sx={{ '&:hover .drag-handle': { opacity: 1 } }}>
            <TableCell>
                <IconButton
                    size="small"
                    className="drag-handle"
                    sx={{ opacity: 0.3, cursor: 'grab' }}
                    {...attributes}
                    {...listeners}
                >
                    <DragIndicator fontSize="small" />
                </IconButton>
            </TableCell>
            <TableCell
                onClick={onEdit}
                sx={{ cursor: 'pointer', fontWeight: 500 }}
            >
                {attrKey}
            </TableCell>
            <TableCell onClick={onEdit} sx={{ cursor: 'pointer' }}>
                <Tooltip title={typeof value === 'string' ? value : JSON.stringify(value)} placement="top" arrow>
                    <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                </Tooltip>
            </TableCell>
            <TableCell align="right">
                <IconButton size="small" onClick={onEdit}>
                    <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={onDelete}>
                    <Delete fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};
