import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, CircularProgress, Tooltip, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Delete, ImportExport } from '@shared/components/FAIcon'; // Fix import: ImportExport -> FileUpload/FileDownload or find correct icon
import { Edit, Save, Description } from '@mui/icons-material'; // Fallback
import { useApolloClient, useLazyQuery } from '@apollo/client';

import { useProductContext } from '../context/ProductContext';
import { useProductDialogs } from '../hooks/useProductDialogs';
import { ProductSummaryDashboard } from '../components/ProductSummaryDashboard'; // Verify path
import { ProductMetadataSection } from './ProductMetadataSection';
import { ProductTasksTab } from './ProductTasksTab';
import { ProductDialog } from '../components/ProductDialog'; // Verify path
import { BulkImportDialog } from '@features/data-management/components/BulkImportDialog';

// Import mutations for the complex save handler
import { CREATE_PRODUCT, UPDATE_PRODUCT, EXPORT_PRODUCT } from '../graphql';
import { DELETE_OUTCOME, CREATE_OUTCOME, UPDATE_OUTCOME, REORDER_OUTCOMES } from '@features/product-outcomes';
import { DELETE_RELEASE, CREATE_RELEASE, UPDATE_RELEASE, REORDER_RELEASES } from '@features/product-releases';
import { DELETE_LICENSE, CREATE_LICENSE, UPDATE_LICENSE, REORDER_LICENSES } from '@features/product-licenses';
import { DELETE_PRODUCT_TAG, CREATE_PRODUCT_TAG, UPDATE_PRODUCT_TAG, REORDER_PRODUCT_TAGS } from '@features/tags';


// Fix Icon imports
import { FileUpload, FileDownload } from '@shared/components/FAIcon';

export function ProductsPageContent() {
    const theme = useTheme();
    const client = useApolloClient();

    const {
        products,
        loadingProducts,
        selectedProductId,
        setSelectedProductId,
        selectedProduct,
        loadingSelectedProduct,
        refetchProducts,
        refetchSelectedProduct,
        tasks,
        selectedSubSection,
        setSelectedSubSection,
        deleteProduct,

        // Context actions for summary dashboard
        setShowFilters,
        setTaskOutcomeFilter,

        // Add Button Mode
        setExternalAddMode
    } = useProductContext();

    const {
        isImportDialogOpen,
        setImportDialogOpen,
        isProductDialogOpen,
        editingProduct,
        openAddProduct,
        openEditProduct,
        closeProductDialog
    } = useProductDialogs();

    // -- Complex Save Handler (Migrated from ProductsPage.tsx) --
    const handleSaveProduct = async (data: any) => {
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
                setSelectedProductId(productId);
            }

            // Helper to handle sub-entity CRUD
            const handleSubEntityCrud = async (
                items: any[],
                deleteMutation: any,
                createMutation: any,
                updateMutation: any,
                reorderMutation: any,
                createInputMapper: (item: any) => any,
                updateInputMapper: (item: any) => any,
                reorderKey: string
            ) => {
                if (!items || !productId) return;
                const finalIds: string[] = [];

                for (const item of items) {
                    if (item.delete && item.id) {
                        await client.mutate({ mutation: deleteMutation, variables: { id: item.id } });
                    } else if (item.isNew && !item.delete) {
                        const res = await client.mutate({
                            mutation: createMutation,
                            variables: { input: { ...createInputMapper(item), productId } }
                        });
                        // Assume standard response format createEntity { id } naming might vary, so generic approach is risky. 
                        // Refactored to explicit blocks below for safety.
                    }
                }
            };

            // Explicit Sub-Entity Handling (Safe Copy from Original)

            // Outcomes
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
                if (finalOutcomeIds.length > 0) {
                    await client.mutate({ mutation: REORDER_OUTCOMES, variables: { productId, outcomeIds: finalOutcomeIds } });
                }
            }

            // Licenses
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
                if (finalLicenseIds.length > 0) {
                    await client.mutate({ mutation: REORDER_LICENSES, variables: { productId, licenseIds: finalLicenseIds } });
                }
            }

            // Releases
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
                if (finalReleaseIds.length > 0) {
                    await client.mutate({ mutation: REORDER_RELEASES, variables: { productId, releaseIds: finalReleaseIds } });
                }
            }

            // Tags
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
                if (finalTagIds.length > 0) {
                    await client.mutate({ mutation: REORDER_PRODUCT_TAGS, variables: { productId, tagIds: finalTagIds } });
                }
            }

            closeProductDialog();
            await Promise.all([
                refetchProducts(),
                selectedProduct ? refetchSelectedProduct() : Promise.resolve()
            ]);
        } catch (error: any) {
            console.error('Error saving product:', error);
            alert('Failed to save product: ' + error.message);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        if (window.confirm(`Are you sure you want to delete "${selectedProduct.name}"?`)) {
            try {
                await deleteProduct(selectedProduct.id);
            } catch (e) {
                // Error handled in context
            }
        }
    }

    // -- Export Logic --
    const [exportProduct] = useLazyQuery(EXPORT_PRODUCT);

    const handleExportProduct = async () => {
        if (!selectedProductId) return;
        try {
            const { data } = await exportProduct({ variables: { productId: selectedProductId } });
            if (data?.exportProduct) {
                const { filename, content, mimeType } = data.exportProduct;

                // Convert base64 to blob and download
                const blob = new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))], { type: mimeType });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting product:', error);
            alert('Failed to export product');
        }
    };



    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('add') === 'true') {
            openAddProduct();
            // Clear the param after opening
            const newParams = new URLSearchParams(location.search);
            newParams.delete('add');
            navigate({ search: newParams.toString() }, { replace: true });
        }
    }, [location.search, openAddProduct, navigate]);

    if (loadingProducts) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
            {/* Header & Selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mr: 2 }}>
                        Products
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 280 }}>
                        <InputLabel>Select Product</InputLabel>
                        <Select
                            value={selectedProductId || ''}
                            onChange={(e) => {
                                if (e.target.value === '__NEW__') openAddProduct();
                                else setSelectedProductId(e.target.value);
                            }}
                            label="Select Product"
                        >
                            {products.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                            <Divider />
                            <MenuItem value="__NEW__" sx={{ color: '#10B981', fontWeight: 600 }}>
                                <Add fontSize="small" sx={{ mr: 1, color: '#10B981' }} /> Add Product
                            </MenuItem>
                        </Select>
                    </FormControl>

                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FileUpload />}
                        onClick={() => setImportDialogOpen(true)}
                        sx={{ height: 40 }}
                    >
                        Import
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FileDownload />}
                        onClick={handleExportProduct}
                        disabled={!selectedProductId}
                        sx={{ height: 40 }}
                    >
                        Export
                    </Button>
                    {selectedProductId && (
                        <>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Edit />}
                                onClick={openEditProduct}
                                sx={{ height: 40 }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={handleDeleteProduct}
                                sx={{ height: 40 }}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Selected Product Content */}
            {selectedProduct && selectedProductId && (
                <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6">{selectedProduct.name}</Typography>
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                        <Tabs
                            value={selectedSubSection}
                            onChange={(_, v) => setSelectedSubSection(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}
                        >
                            <Tab label="Summary" value="summary" />
                            <Tab label="Resources" value="resources" />
                            <Tab label="Tasks" value="tasks" />
                            <Tab label="Tags" value="tags" />
                            <Tab label="Outcomes" value="outcomes" />
                            <Tab label="Releases" value="releases" />
                            <Tab label="Licenses" value="licenses" />
                            <Tab label="Custom Attributes" value="customAttributes" />
                        </Tabs>

                        {/* Quick Add Button logic */}
                        {selectedSubSection !== 'summary' && selectedSubSection !== 'tasks' && (
                            <Box sx={{ ml: 2 }}>
                                <Tooltip title="Add Item">
                                    <IconButton
                                        color="primary"
                                        onClick={() => setExternalAddMode(selectedSubSection)}
                                    >
                                        <Add />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ p: 0 }}>
                        {selectedSubSection === 'summary' && (
                            <Box sx={{ p: 2 }}>
                                <ProductSummaryDashboard
                                    product={selectedProduct}
                                    tasks={tasks}
                                    onOutcomeClick={(outcomeName) => {
                                        setSelectedSubSection('tasks');
                                        setShowFilters(true);
                                        if (outcomeName === 'All Outcomes') {
                                            setTaskOutcomeFilter(['__ALL_OUTCOMES__']);
                                        } else {
                                            const outcome = selectedProduct?.outcomes?.find((o: any) => o.name === outcomeName);
                                            if (outcome && outcome.id) {
                                                setTaskOutcomeFilter([outcome.id]);
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        )}

                        {selectedSubSection === 'tasks' && (
                            <Box sx={{ p: 2 }}>
                                <ProductTasksTab />
                            </Box>
                        )}

                        {/* Metadata Section handles all other tabs */}
                        {selectedSubSection !== 'summary' && selectedSubSection !== 'tasks' && (
                            <Box sx={{ p: 2 }}>
                                <ProductMetadataSection />
                            </Box>
                        )}
                    </Box>
                </Paper>
            )}

            {/* Dialogs */}
            <ProductDialog
                open={isProductDialogOpen}
                onClose={closeProductDialog}
                onSave={handleSaveProduct}
                product={editingProduct ? selectedProduct : null} // Pass detailed user if editing
                title={editingProduct ? 'Edit Product' : 'Add Product'}
            />

            {isImportDialogOpen && (
                <BulkImportDialog
                    open={isImportDialogOpen}
                    onClose={() => setImportDialogOpen(false)}
                    onSuccess={() => {
                        refetchProducts();
                        refetchSelectedProduct();
                    }}
                    entityType="PRODUCT"
                />
            )}
        </Box>
    );
}
