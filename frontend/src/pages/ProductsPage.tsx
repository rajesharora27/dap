import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, DragIndicator, FileDownload, FileUpload } from '@mui/icons-material';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { PRODUCTS, TASKS_FOR_PRODUCT, OUTCOMES } from '../graphql/queries';
import { DELETE_PRODUCT, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK, CREATE_OUTCOME, UPDATE_OUTCOME, DELETE_OUTCOME, CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE, CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE } from '../graphql/mutations';
import { SortableTaskItem } from '../components/SortableTaskItem';
import { ProductDialog } from '../components/dialogs/ProductDialog';
import { TaskDialog } from '../components/dialogs/TaskDialog';
import { OutcomeDialog } from '../components/dialogs/OutcomeDialog';
import { ReleaseDialog } from '../components/dialogs/ReleaseDialog';
import { LicenseDialog } from '../components/dialogs/LicenseDialog';
import { useProductImportExport } from '../hooks/useProductImportExport';

interface ProductsPageProps {
    onEditProduct: (product: any) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onEditProduct }) => {
    // State
    const [selectedProduct, setSelectedProduct] = useState<string | null>(localStorage.getItem('lastSelectedProductId'));
    const [selectedSubSection, setSelectedSubSection] = useState<'main' | 'tasks'>('main');
    const importFileRef = useRef<HTMLInputElement>(null);

    // Dialog States
    const [taskDialog, setTaskDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [outcomeDialog, setOutcomeDialog] = useState(false);
    const [editingOutcome, setEditingOutcome] = useState<any>(null);
    const [releaseDialog, setReleaseDialog] = useState(false);
    const [editingRelease, setEditingRelease] = useState<any>(null);
    const [licenseDialog, setLicenseDialog] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);

    // Queries
    const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery(PRODUCTS);
    const products = productsData?.products?.edges?.map((e: any) => e.node) || [];

    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(TASKS_FOR_PRODUCT, {
        variables: { productId: selectedProduct },
        skip: !selectedProduct
    });
    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

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
        setSelectedSubSection('main');
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

    return (
        <Box>
            {/* Product Selection Header */}
            <Paper sx={{ p: 3, mb: 2 }}>
                {productsLoading && <LinearProgress />}
                {productsError && <Typography color="error">{productsError.message}</Typography>}

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 300 }}>
                        <InputLabel>Select Product</InputLabel>
                        <Select
                            value={selectedProduct || ''}
                            label="Select Product"
                            onChange={(e) => handleProductChange(e.target.value)}
                        >
                            {products.map((p: any) => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedProduct && (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => {
                                    const product = products.find((p: any) => p.id === selectedProduct);
                                    if (product) onEditProduct(product);
                                }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FileDownload />}
                                onClick={handleExport}
                            >
                                Export
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FileUpload />}
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
                                onClick={handleDeleteProduct}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </Box>
            </Paper>

            {/* Content Area */}
            {selectedProduct && (
                <>
                    <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={selectedSubSection} onChange={(_, v) => setSelectedSubSection(v)}>
                            <Tab label="Main" value="main" />
                            <Tab label="Tasks" value="tasks" />
                        </Tabs>
                    </Box>

                    {selectedSubSection === 'main' && (
                        <Grid container spacing={3}>
                            {/* Outcomes */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">Outcomes</Typography>
                                        <Button startIcon={<Add />} size="small" onClick={() => { setEditingOutcome(null); setOutcomeDialog(true); }}>Add</Button>
                                    </Box>
                                    <List dense>
                                        {products.find((p: any) => p.id === selectedProduct)?.outcomes?.map((outcome: any) => (
                                            <ListItem key={outcome.id}
                                                secondaryAction={
                                                    <Box>
                                                        <IconButton size="small" onClick={() => { setEditingOutcome(outcome); setOutcomeDialog(true); }}><Edit fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteOutcome(outcome.id)} color="error"><Delete fontSize="small" /></IconButton>
                                                    </Box>
                                                }
                                            >
                                                <ListItemText primary={outcome.name} secondary={outcome.description} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            </Grid>

                            {/* Releases */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">Releases</Typography>
                                        <Button startIcon={<Add />} size="small" onClick={() => { setEditingRelease(null); setReleaseDialog(true); }}>Add</Button>
                                    </Box>
                                    <List dense>
                                        {products.find((p: any) => p.id === selectedProduct)?.releases?.map((release: any) => (
                                            <ListItem key={release.id}
                                                secondaryAction={
                                                    <Box>
                                                        <IconButton size="small" onClick={() => { setEditingRelease(release); setReleaseDialog(true); }}><Edit fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteRelease(release.id)} color="error"><Delete fontSize="small" /></IconButton>
                                                    </Box>
                                                }
                                            >
                                                <ListItemText primary={release.name} secondary={`Level: ${release.level}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            </Grid>

                            {/* Licenses */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">Licenses</Typography>
                                        <Button startIcon={<Add />} size="small" onClick={() => { setEditingLicense(null); setLicenseDialog(true); }}>Add</Button>
                                    </Box>
                                    <List dense>
                                        {products.find((p: any) => p.id === selectedProduct)?.licenses?.map((license: any) => (
                                            <ListItem key={license.id}
                                                secondaryAction={
                                                    <Box>
                                                        <IconButton size="small" onClick={() => { setEditingLicense(license); setLicenseDialog(true); }}><Edit fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteLicense(license.id)} color="error"><Delete fontSize="small" /></IconButton>
                                                    </Box>
                                                }
                                            >
                                                <ListItemText primary={license.name} secondary={`Level: ${license.level}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                    {selectedSubSection === 'tasks' && (
                        <Box>
                            {/* Tasks View */}
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => { setEditingTask(null); setTaskDialog(true); }}
                                >
                                    Add Task
                                </Button>
                            </Box>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell width={40}></TableCell>
                                                <TableCell width={80}>Seq</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Resources</TableCell>
                                                <TableCell width={100}>Weight</TableCell>
                                                <TableCell>Telemetry</TableCell>
                                                <TableCell width={100}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                                                {tasks.map((task: any) => (
                                                    <SortableTaskItem
                                                        key={task.id}
                                                        task={task}
                                                        onEdit={(t: any) => { setEditingTask(t); setTaskDialog(true); }}
                                                        onDelete={handleDeleteTask}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </DndContext>
                        </Box>
                    )}
                </>
            )}

            {/* Dialogs */}
            <TaskDialog
                open={taskDialog}
                onClose={() => setTaskDialog(false)}
                title="Task Details"
                task={editingTask}
                productId={selectedProduct || undefined}
                onSave={handleSaveTask}
                existingTasks={tasks}
                outcomes={products.find((p: any) => p.id === selectedProduct)?.outcomes || []}
                availableLicenses={products.find((p: any) => p.id === selectedProduct)?.licenses || []}
                availableReleases={products.find((p: any) => p.id === selectedProduct)?.releases || []}
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
        </Box>
    );
};
