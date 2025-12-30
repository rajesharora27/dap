import React, { useState, useEffect, useRef } from 'react';
import { EntitySummary } from '@features/telemetry';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, CircularProgress, Card, CardContent,
    Checkbox, OutlinedInput, Collapse, Divider, Badge
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Edit, Delete, Add, DragIndicator, FileDownload, FileUpload, Description, CheckCircle, Extension, FilterList, ExpandMore, ExpandLess, Lock, LockOpen, Clear } from '@shared/components/FAIcon';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import { PRODUCTS, PRODUCT, DELETE_PRODUCT, CREATE_PRODUCT, UPDATE_PRODUCT, ProductDialog, ProductSummaryDashboard, OUTCOMES, useProductEditing } from '@features/products';
import { CREATE_OUTCOME, UPDATE_OUTCOME, DELETE_OUTCOME, REORDER_OUTCOMES } from '@features/product-outcomes';
import { CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE, REORDER_RELEASES } from '@features/product-releases';
import { CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE, REORDER_LICENSES } from '@features/product-licenses';
import { TASKS_FOR_PRODUCT, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK, TaskDialog } from '@features/tasks';
import { SortableTaskItem } from '@features/tasks/components/SortableTaskItem';
import { ColumnVisibilityToggle, DEFAULT_VISIBLE_COLUMNS } from '@shared/components/ColumnVisibilityToggle';
import { ProductTag, CREATE_PRODUCT_TAG, UPDATE_PRODUCT_TAG, DELETE_PRODUCT_TAG, REORDER_PRODUCT_TAGS } from '@features/tags';
import { useAuth } from '@features/auth';
import { useProductImportExport } from '@features/products';

import { BulkImportDialog } from '@features/data-management/components/BulkImportDialog';

// Shared Components
import { OutcomesTable } from '../features/products/components/shared/OutcomesTable';
import { TagsTable } from '../features/products/components/shared/TagsTable';
import { ReleasesTable } from '../features/products/components/shared/ReleasesTable';
import { LicensesTable } from '../features/products/components/shared/LicensesTable';
import { AttributesTable } from '../features/products/components/shared/AttributesTable';
import { ResourcesTable } from '../features/products/components/shared/ResourcesTable';

interface ProductsPageProps {
    onEditProduct: (product: any) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onEditProduct }) => {
    // State
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    // Column visibility state with localStorage persistence
    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem('dap_product_task_columns');
        return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
    });

    // Persist column visibility to localStorage
    useEffect(() => {
        localStorage.setItem('dap_product_task_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Handle column toggle
    const handleToggleColumn = (columnKey: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(k => k !== columnKey)
                : [...prev, columnKey]
        );
    };
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [selectedSubSection, setSelectedSubSection] = useState<'summary' | 'resources' | 'tasks' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags'>('summary');

    // Dialog States - must be before any conditional returns
    const [importDialog, setImportDialog] = useState(false);
    const [taskDialog, setTaskDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [productDialog, setProductDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [taskTagFilter, setTaskTagFilter] = useState<string[]>([]);
    const [taskOutcomeFilter, setTaskOutcomeFilter] = useState<string[]>([]);
    const [taskReleaseFilter, setTaskReleaseFilter] = useState<string[]>([]);
    const [taskLicenseFilter, setTaskLicenseFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [isTasksLocked, setIsTasksLocked] = useState(false);
    const [inlineEditingOutcome, setInlineEditingOutcome] = useState<string | null>(null);
    const [inlineOutcomeName, setInlineOutcomeName] = useState('');

    // External add mode state - used by + icon in tabs row
    const [externalAddMode, setExternalAddMode] = useState<string | null>(null); // null or tab name e.g. 'tags', 'outcomes', etc.

    // Queries - must be before any conditional returns (skip handles auth)
    const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery(PRODUCTS, {
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated || authLoading
    });
    const products = productsData?.products?.edges?.map((e: any) => e.node) || [];

    // Set default product to 'Cisco Secure Access' if no valid product is selected
    useEffect(() => {
        if (!productsLoading && products.length > 0) {
            const isValidSelection = selectedProduct && products.some((p: any) => p.id === selectedProduct);

            if (!isValidSelection) {
                // Try case-insensitive comparison
                const defaultProduct = products.find((p: any) =>
                    p.name.trim().toLowerCase() === 'cisco secure access'
                );

                // Fallback to first product if default not found
                const targetId = defaultProduct ? defaultProduct.id : products[0].id;

                if (targetId && targetId !== selectedProduct) {
                    // console.log('Setting default product to:', defaultProduct?.name || products[0].name);
                    setSelectedProduct(targetId);
                    localStorage.setItem('lastSelectedProductId', targetId);
                }
            }
        }
    }, [products, productsLoading, selectedProduct]);



    // Fetch single product details if selected
    const { data: productData, error: productError, refetch: refetchProductDetail } = useQuery(PRODUCT, {
        variables: { id: selectedProduct },
        skip: !selectedProduct || !isAuthenticated || authLoading,
        fetchPolicy: 'cache-and-network'
    });

    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(TASKS_FOR_PRODUCT, {
        variables: { productId: selectedProduct },
        skip: !selectedProduct || !isAuthenticated || authLoading
    });
    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    const client = useApolloClient();
    const theme = useTheme();

    // Import/Export Hook
    const { handleExport, isExporting } = useProductImportExport(
        selectedProduct,
        products,
        tasks,
        async () => {
            await refetchProducts();
            await refetchTasks();
            if (selectedProduct) {
                await refetchProductDetail();
            }
        }
    );

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Effect for refetching tasks
    useEffect(() => {
        if (selectedSubSection === 'tasks' && selectedProduct && isAuthenticated) {
            refetchTasks();
        }
    }, [selectedSubSection, selectedProduct, refetchTasks, isAuthenticated]);

    // Now we can have conditional returns after all hooks
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

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
            const hasSpecificOutcomes = task.outcomes && task.outcomes.length > 0;

            // Special case: "__ALL_OUTCOMES__" means show ONLY tasks with no specific outcomes
            if (taskOutcomeFilter.includes('__ALL_OUTCOMES__')) {
                if (hasSpecificOutcomes) {
                    return false; // Exclude tasks that have specific outcomes
                }
                // Keep tasks with no specific outcomes (they apply to ALL)
            } else if (hasSpecificOutcomes) {
                // Normal filtering: check if task has any of the selected outcomes
                if (!task.outcomes.some((o: any) => taskOutcomeFilter.includes(o.id))) {
                    return false;
                }
            }
            // If !hasSpecificOutcomes and not filtering for __ALL_OUTCOMES__, keep it (matches all)
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

    // Handlers - Use shared hook for CRUD operations (same code as ProductDialog)
    const productEditing = useProductEditing(selectedProduct);

    // Attribute handlers - hook now fetches current attrs from Apollo cache automatically

    const handleProductChange = (productId: string) => {
        setSelectedProduct(productId);
        localStorage.setItem('lastSelectedProductId', productId);
        // Preserve the current tab when changing products
        // setSelectedSubSection('dashboard'); // Removed to persist tab
        // Force refetch tasks when product changes or tab is selected
        setTimeout(() => refetchTasks(), 0);
    };

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



    const handleInlineProductUpdate = async (field: 'name' | 'description', value: string) => {
        if (!displayProduct) return;
        try {
            const input: any = {
                name: field === 'name' ? value : displayProduct.name,
                customAttrs: displayProduct.customAttrs
            };

            if (field === 'description') {
                input.resources = value ? [{ label: 'Description', url: value }] : [];
            } else {
                // Strip __typename from resources to avoid GraphQL input error
                input.resources = (displayProduct.resources || []).map((r: any) => ({ label: r.label, url: r.url }));
            }

            await client.mutate({
                mutation: UPDATE_PRODUCT,
                variables: {
                    id: displayProduct.id,
                    input
                },
                refetchQueries: ['Products', 'ProductDetail'],
                awaitRefetchQueries: true
            });
            await refetchProducts();
            if (selectedProduct) refetchProductDetail();
        } catch (error: any) {
            console.error('Error updating product:', error);
            alert('Failed to update product');
        }
    };


    const handleInlineReleaseUpdate = async (releaseId: string, field: 'name' | 'description', value: string) => {
        try {
            const release = displayProduct.releases.find((r: any) => r.id === releaseId);
            if (!release) return;

            await client.mutate({
                mutation: UPDATE_RELEASE,
                variables: {
                    id: releaseId,
                    input: {
                        name: field === 'name' ? value : release.name,
                        description: field === 'description' ? value : release.description,
                        level: release.level,
                        productId: selectedProduct
                    }
                },
                refetchQueries: ['ProductDetail']
            });
        } catch (error) {
            console.error('Error updating release:', error);
        }
    };

    const handleInlineLicenseUpdate = async (licenseId: string, field: 'name' | 'description', value: string) => {
        try {
            const license = displayProduct.licenses.find((l: any) => l.id === licenseId);
            if (!license) return;

            await client.mutate({
                mutation: UPDATE_LICENSE,
                variables: {
                    id: licenseId,
                    input: {
                        name: field === 'name' ? value : license.name,
                        description: field === 'description' ? value : license.description,
                        level: license.level,
                        isActive: license.isActive,
                        productId: selectedProduct
                    }
                },
                refetchQueries: ['ProductDetail']
            });
        } catch (error) {
            console.error('Error updating license:', error);
        }
    };

    // Tag Handlers
    const handleSaveTag = async (tagData: any, existingId?: string) => {
        try {
            if (existingId) {
                await client.mutate({
                    mutation: UPDATE_PRODUCT_TAG,
                    variables: { id: existingId, input: tagData },
                    refetchQueries: ['Products', 'Product', 'ProductDetail', 'ProductTags'],
                    awaitRefetchQueries: true
                });
            } else {
                await client.mutate({
                    mutation: CREATE_PRODUCT_TAG,
                    variables: { input: { ...tagData, productId: selectedProduct } },
                    refetchQueries: ['Products', 'Product', 'ProductDetail', 'ProductTags'],
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
                refetchQueries: ['Products', 'Product', 'ProductDetail', 'ProductTags'],
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
                    refetchQueries: ['ProductTasks'],
                    awaitRefetchQueries: true
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
        // Filter out all internal keys (starting with _)
        const entries = Object.entries(attrs).filter(([k]) => !k.startsWith('_'));

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
    const handleAttributeDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!displayProduct || active.id === over?.id) return;

        const currentAttrs = displayProduct.customAttrs || {};
        const keys = getSortedAttributes(currentAttrs).map(([k]) => k);
        const oldIndex = keys.indexOf(active.id);
        const newIndex = keys.indexOf(over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(keys, oldIndex, newIndex);

            const updatedAttrs = { ...currentAttrs };
            updatedAttrs._order = newOrder;

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
                    refetchQueries: ['ProductDetail'],
                    awaitRefetchQueries: true
                });
            } catch (error) {
                console.error('Error reordering attributes:', error);
                alert('Failed to reorder attributes');
            }
        }
    };


    // Custom Attribute handlers


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
                    refetchQueries: ['ProductTasks'],
                    awaitRefetchQueries: true
                });
            } else {
                await client.mutate({
                    mutation: CREATE_TASK,
                    variables: { input },
                    refetchQueries: ['ProductTasks'],
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
                    refetchQueries: ['ProductTasks'],
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
                refetchQueries: ['ProductTasks'],
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
                refetchQueries: ['ProductTasks'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error reordering tasks:', error);
            alert('Failed to update sequence');
        }
    };

    const handleTagChange = async (taskId: string, newTagIds: string[]) => {
        try {
            await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: taskId,
                    input: { tagIds: newTagIds }
                },
                refetchQueries: ['ProductTasks'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error updating task tags:', error);
            alert('Failed to update task tags');
        }
    };

    const handleSaveInlineOutcome = async (id: string) => {
        if (!inlineOutcomeName.trim()) return;
        try {
            await client.mutate({
                mutation: UPDATE_OUTCOME,
                variables: { id, input: { name: inlineOutcomeName } },
                refetchQueries: ['Products', 'ProductOutcomes']
            });
            setInlineEditingOutcome(null);
            setInlineOutcomeName('');
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
                    refetchQueries: ['Products', 'ProductOutcomes']
                });
            } catch (error: any) {
                alert('Error deleting outcome: ' + error.message);
            }
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

    return (
        <React.Fragment> {/* Wrapping just in case */}
            {/* Product Selection Header */}
            {productsLoading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Product Selector and Actions */}
            {!productsLoading && !productsError && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <FormControl sx={{ flex: '1 1 300px', minWidth: 250 }}>
                            <InputLabel>Select Product</InputLabel>
                            <Select
                                value={selectedProduct || ''}
                                onChange={(e) => {
                                    if (e.target.value === '__add_new__') {
                                        setEditingProduct(null);
                                        setProductDialog(true);
                                    } else {
                                        handleProductChange(e.target.value);
                                    }
                                }}
                                label="Select Product"
                            >
                                {[...products].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((product: any) => (
                                    <MenuItem key={product.id} value={product.id}>
                                        {product.name}
                                    </MenuItem>
                                ))}
                                <Divider />
                                <MenuItem value="__add_new__" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                    <Add sx={{ mr: 1, fontSize: '1rem' }} /> Add New Product
                                </MenuItem>
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
                                        startIcon={isExporting ? <CircularProgress size={20} /> : <FileDownload />}
                                        size="small"
                                        onClick={handleExport}
                                        disabled={isExporting || (selectedSubSection === 'tasks' && isTasksLocked)}
                                        title={selectedSubSection === 'tasks' && isTasksLocked ? "Unlock Tasks to Export" : ""}
                                    >
                                        Export to Excel
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        startIcon={<FileUpload />}
                                        size="small"
                                        onClick={() => setImportDialog(true)}
                                        disabled={selectedSubSection === 'tasks' && isTasksLocked}
                                        title={selectedSubSection === 'tasks' && isTasksLocked ? "Unlock Tasks to Import" : ""}
                                    >
                                        Import from Excel
                                    </Button>

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
                            <Tab label="Summary" value="summary" />
                            <Tab label="Resources" value="resources" />
                            <Tab label={`Tasks${tasks.length > 0 ? ` (${hasActiveFilters ? `${filteredTasks.length}/${tasks.length}` : tasks.length})` : ''}`} value="tasks" />
                            <Tab label="Tags" value="tags" />
                            <Tab label="Outcomes" value="outcomes" />
                            <Tab label="Releases" value="releases" />
                            <Tab label="Licenses" value="licenses" />
                            <Tab label="Custom Attributes" value="customAttributes" />
                        </Tabs>

                        {selectedSubSection !== 'summary' && (
                            <Box sx={{ display: 'flex', gap: 1, ml: 2, flexShrink: 0, alignItems: 'center' }}>
                                {/* Filters Button - Only show for tasks tab */}
                                {selectedSubSection === 'tasks' && (
                                    <>
                                        <Tooltip title={isTasksLocked ? "Unlock Tasks to Edit" : "Lock Tasks"}>
                                            <IconButton
                                                size="small"
                                                onClick={() => setIsTasksLocked(!isTasksLocked)}
                                                sx={{ mr: 1, color: isTasksLocked ? 'text.secondary' : 'primary.main', border: `1px solid ${isTasksLocked ? 'divider' : 'primary.main'}`, borderRadius: 1 }}
                                            >
                                                {isTasksLocked ? <Lock /> : <LockOpen />}
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title={showFilters ? "Hide Filters" : hasActiveFilters ? `Filters Active (${[taskTagFilter, taskOutcomeFilter, taskReleaseFilter, taskLicenseFilter].filter(f => f.length > 0).length})` : "Show Filters"}>
                                            <IconButton
                                                onClick={() => setShowFilters(!showFilters)}
                                                color={hasActiveFilters || showFilters ? "primary" : "default"}
                                            >
                                                <Badge badgeContent={[taskTagFilter, taskOutcomeFilter, taskReleaseFilter, taskLicenseFilter].filter(f => f.length > 0).length} color="secondary">
                                                    <FilterList />
                                                </Badge>
                                            </IconButton>
                                        </Tooltip>
                                        {hasActiveFilters && (
                                            <Tooltip title="Clear Filters">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleClearFilters}
                                                    color="secondary"
                                                >
                                                    <Clear fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {/* Column Visibility Toggle */}
                                        <ColumnVisibilityToggle
                                            visibleColumns={visibleColumns}
                                            onToggleColumn={handleToggleColumn}
                                        />
                                    </>
                                )}
                                <Tooltip title={
                                    selectedSubSection === 'tasks' && isTasksLocked ? "Unlock Tasks to Add" :
                                        selectedSubSection === 'tasks' ? 'Add Task' :
                                            selectedSubSection === 'resources' ? 'Add Resource' :
                                                selectedSubSection === 'tags' ? 'Add Tag' :
                                                    selectedSubSection === 'outcomes' ? 'Add Outcome' :
                                                        selectedSubSection === 'releases' ? 'Add Release' :
                                                            selectedSubSection === 'licenses' ? 'Add License' :
                                                                selectedSubSection === 'customAttributes' ? 'Add Attribute' : 'Add'
                                }>
                                    <span>
                                        <IconButton
                                            color="primary"
                                            disabled={selectedSubSection === 'tasks' && isTasksLocked}
                                            onClick={() => {
                                                if (selectedSubSection === 'tasks') {
                                                    setEditingTask(null);
                                                    setTaskDialog(true);
                                                } else if (['resources', 'tags', 'outcomes', 'releases', 'licenses', 'customAttributes'].includes(selectedSubSection)) {
                                                    setExternalAddMode(selectedSubSection);
                                                }
                                            }}
                                        >
                                            <Add />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>

                    {selectedSubSection === 'summary' && (
                        <Box sx={{ mt: 2 }}>
                            <ProductSummaryDashboard
                                product={{
                                    ...displayProduct,
                                    tasks: { edges: tasks.map((t: any) => ({ node: t })) }
                                }}
                                onOutcomeClick={(outcomeName) => {
                                    // Switch to tasks tab and set filter
                                    setSelectedSubSection('tasks');
                                    setShowFilters(true);

                                    if (outcomeName === 'All Outcomes') {
                                        // Filter to show only tasks that have no specific outcomes
                                        // These tasks apply to ALL outcomes
                                        setTaskOutcomeFilter(['__ALL_OUTCOMES__']);
                                    } else {
                                        // Find the outcome ID by name
                                        const outcome = displayProduct?.outcomes?.find((o: any) => o.name === outcomeName);
                                        if (outcome) {
                                            setTaskOutcomeFilter([outcome.id]);
                                        }
                                    }
                                }}
                            />
                        </Box>
                    )}

                    {selectedSubSection === 'resources' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>
                                    <ResourcesTable
                                        items={displayProduct?.resources || []}
                                        onUpdate={productEditing.handleResourceUpdate}
                                        onDelete={productEditing.handleResourceDelete}
                                        onCreate={productEditing.handleResourceCreate}
                                        onReorder={productEditing.handleResourceReorder}
                                        externalAddMode={externalAddMode === 'resources'}
                                        onExternalAddComplete={() => setExternalAddMode(null)}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
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
                                                <TableCell width={80} align="left">Order</TableCell>
                                                <TableCell align="left">Name</TableCell>
                                                {visibleColumns.includes('tags') && <TableCell align="left">Tags</TableCell>}
                                                {visibleColumns.includes('resources') && <TableCell align="left">Resources</TableCell>}
                                                {visibleColumns.includes('implPercent') && <TableCell width={80} align="center">Weight</TableCell>}
                                                {visibleColumns.includes('validationCriteria') && <TableCell align="center">Validation Criteria</TableCell>}
                                                <TableCell width={100} align="left">Actions</TableCell>
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
                                                        onTagChange={handleTagChange}
                                                        availableTags={displayProduct?.tags || []}
                                                        disableDrag={hasActiveFilters}
                                                        locked={isTasksLocked}
                                                        visibleColumns={visibleColumns}
                                                    />
                                                ))}
                                                {filteredTasks.length === 0 && !tasksLoading && (
                                                    <TableRow>
                                                        <TableCell colSpan={4 + visibleColumns.length} sx={{ textAlign: 'center', py: 4 }}>
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
                                    <OutcomesTable
                                        items={displayProduct?.outcomes || []}
                                        onUpdate={productEditing.handleOutcomeUpdate}
                                        onDelete={productEditing.handleOutcomeDelete}
                                        onCreate={productEditing.handleOutcomeCreate}
                                        onReorder={productEditing.handleOutcomeReorder}
                                        externalAddMode={externalAddMode === 'outcomes'}
                                        onExternalAddComplete={() => setExternalAddMode(null)}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'releases' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>
                                    <ReleasesTable
                                        items={displayProduct?.releases || []}
                                        onUpdate={productEditing.handleReleaseUpdate}
                                        onDelete={productEditing.handleReleaseDelete}
                                        onCreate={productEditing.handleReleaseCreate}
                                        onReorder={productEditing.handleReleaseReorder}
                                        externalAddMode={externalAddMode === 'releases'}
                                        onExternalAddComplete={() => setExternalAddMode(null)}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'licenses' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>
                                    <LicensesTable
                                        items={displayProduct?.licenses || []}
                                        onUpdate={productEditing.handleLicenseUpdate}
                                        onDelete={productEditing.handleLicenseDelete}
                                        onCreate={productEditing.handleLicenseCreate}
                                        onReorder={productEditing.handleLicenseReorder}
                                        externalAddMode={externalAddMode === 'licenses'}
                                        onExternalAddComplete={() => setExternalAddMode(null)}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'customAttributes' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>
                                    <AttributesTable
                                        items={productEditing.getAttributesList(displayProduct?.customAttrs)}
                                        onUpdate={productEditing.handleAttributeUpdate}
                                        onDelete={productEditing.handleAttributeDelete}
                                        onCreate={productEditing.handleAttributeCreate}
                                        onReorder={productEditing.handleAttributeReorder}
                                        externalAddMode={externalAddMode === 'customAttributes'}
                                        onExternalAddComplete={() => setExternalAddMode(null)}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {selectedSubSection === 'tags' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 2 }}>
                                    <TagsTable
                                        items={displayProduct?.tags || []}
                                        onUpdate={productEditing.handleTagUpdate}
                                        onDelete={productEditing.handleTagDelete}
                                        onCreate={productEditing.handleTagCreate}
                                        onReorder={productEditing.handleTagReorder}
                                        externalAddMode={externalAddMode === 'tags'}
                                        onExternalAddComplete={() => setExternalAddMode(null)}
                                    />
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


            {/* Add/Edit Product Dialog */}
            <ProductDialog
                open={productDialog}
                onClose={() => setProductDialog(false)}
                onSave={async (data: any) => {
                    try {
                        let productId = editingProduct?.id;

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
                        } else {
                            // Create new product
                            const result = await client.mutate({
                                mutation: CREATE_PRODUCT,
                                variables: { input: { name: data.name, description: data.description, customAttrs: data.customAttrs } },
                                refetchQueries: ['Products'],
                                awaitRefetchQueries: true
                            });
                            productId = result.data.createProduct.id;
                            setSelectedProduct(productId);
                            localStorage.setItem('lastSelectedProductId', productId);
                        }

                        // Handle outcomes CRUD
                        if (data.outcomes && productId) {
                            const finalOutcomeIds: string[] = [];
                            for (const outcome of data.outcomes) {
                                if (outcome.delete && outcome.id) {
                                    await client.mutate({ mutation: DELETE_OUTCOME, variables: { id: outcome.id } });
                                } else if (outcome.isNew && !outcome.delete) {
                                    const res = await client.mutate({
                                        mutation: CREATE_OUTCOME,
                                        variables: { input: { name: outcome.name, description: outcome.description, productId } }
                                    });
                                    if (res.data?.createOutcome?.id) finalOutcomeIds.push(res.data.createOutcome.id);
                                } else if (!outcome.isNew && !outcome.delete && outcome.id) {
                                    await client.mutate({
                                        mutation: UPDATE_OUTCOME,
                                        variables: { id: outcome.id, input: { name: outcome.name, description: outcome.description } }
                                    });
                                    finalOutcomeIds.push(outcome.id);
                                }
                            }

                            // Reorder outcomes to match the dialog order
                            if (finalOutcomeIds.length > 0) {
                                await client.mutate({
                                    mutation: REORDER_OUTCOMES,
                                    variables: {
                                        productId,
                                        outcomeIds: finalOutcomeIds
                                    }
                                });
                            }
                        }

                        // Handle licenses CRUD
                        if (data.licenses && productId) {
                            const finalLicenseIds: string[] = [];
                            for (const license of data.licenses) {
                                if (license.delete && license.id) {
                                    await client.mutate({ mutation: DELETE_LICENSE, variables: { id: license.id } });
                                } else if (license.isNew && !license.delete) {
                                    const res = await client.mutate({
                                        mutation: CREATE_LICENSE,
                                        variables: { input: { name: license.name, level: license.level, description: license.description, isActive: license.isActive, productId } }
                                    });
                                    if (res.data?.createLicense?.id) finalLicenseIds.push(res.data.createLicense.id);
                                } else if (!license.isNew && !license.delete && license.id) {
                                    await client.mutate({
                                        mutation: UPDATE_LICENSE,
                                        variables: { id: license.id, input: { name: license.name, level: license.level, description: license.description, isActive: license.isActive } }
                                    });
                                    finalLicenseIds.push(license.id);
                                }
                            }

                            // Reorder licenses
                            if (finalLicenseIds.length > 0) {
                                await client.mutate({
                                    mutation: REORDER_LICENSES,
                                    variables: { productId, licenseIds: finalLicenseIds }
                                });
                            }
                        }

                        // Handle releases CRUD
                        if (data.releases && productId) {
                            const finalReleaseIds: string[] = [];
                            for (const release of data.releases) {
                                if (release.delete && release.id) {
                                    await client.mutate({ mutation: DELETE_RELEASE, variables: { id: release.id } });
                                } else if (release.isNew && !release.delete) {
                                    const res = await client.mutate({
                                        mutation: CREATE_RELEASE,
                                        variables: { input: { name: release.name, level: release.level, description: release.description, productId } }
                                    });
                                    if (res.data?.createRelease?.id) finalReleaseIds.push(res.data.createRelease.id);
                                } else if (!release.isNew && !release.delete && release.id) {
                                    await client.mutate({
                                        mutation: UPDATE_RELEASE,
                                        variables: { id: release.id, input: { name: release.name, level: release.level, description: release.description } }
                                    });
                                    finalReleaseIds.push(release.id);
                                }
                            }

                            // Reorder releases
                            if (finalReleaseIds.length > 0) {
                                await client.mutate({
                                    mutation: REORDER_RELEASES,
                                    variables: { productId, releaseIds: finalReleaseIds }
                                });
                            }
                        }

                        // Handle tags CRUD
                        if (data.tags && productId) {
                            const finalTagIds: string[] = [];
                            for (const tag of data.tags) {
                                if (tag.delete && tag.id) {
                                    await client.mutate({ mutation: DELETE_PRODUCT_TAG, variables: { id: tag.id } });
                                } else if (tag.isNew && !tag.delete) {
                                    const res = await client.mutate({
                                        mutation: CREATE_PRODUCT_TAG,
                                        variables: { input: { name: tag.name, color: tag.color, description: tag.description, productId } }
                                    });
                                    if (res.data?.createProductTag?.id) finalTagIds.push(res.data.createProductTag.id);
                                } else if (!tag.isNew && !tag.delete && tag.id) {
                                    await client.mutate({
                                        mutation: UPDATE_PRODUCT_TAG,
                                        variables: { id: tag.id, input: { name: tag.name, color: tag.color, description: tag.description } }
                                    });
                                    finalTagIds.push(tag.id);
                                }
                            }

                            // Reorder tags to match the dialog order
                            if (finalTagIds.length > 0) {
                                await client.mutate({
                                    mutation: REORDER_PRODUCT_TAGS,
                                    variables: {
                                        productId,
                                        tagIds: finalTagIds
                                    }
                                });
                            }
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
                product={editingProduct ? displayProduct : null}
                title={editingProduct ? 'Edit Product' : 'Add Product'}
            />


            {/* Bulk Import V2 Dialog */}
            {importDialog && (
                <BulkImportDialog
                    open={importDialog}
                    onClose={() => setImportDialog(false)}
                    onSuccess={() => {
                        refetchProducts();
                        refetchProductDetail();
                    }}
                    entityType="PRODUCT"
                />
            )}
        </React.Fragment>
    );
};


