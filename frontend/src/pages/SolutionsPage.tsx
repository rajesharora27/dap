import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { SOLUTIONS, TASKS_FOR_SOLUTION, PRODUCTS } from '../graphql/queries';
import { DELETE_SOLUTION, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK } from '../graphql/mutations';
import { SortableTaskItem } from '../components/SortableTaskItem';
import { SolutionDialog } from '../components/dialogs/SolutionDialog';
import { TaskDialog } from '../components/dialogs/TaskDialog';

export const SolutionsPage: React.FC = () => {
    // State
    const [selectedSolution, setSelectedSolution] = useState<string | null>(localStorage.getItem('lastSelectedSolutionId'));
    const [selectedSubSection, setSelectedSubSection] = useState<'main' | 'tasks'>('main');

    // Dialog States
    const [solutionDialog, setSolutionDialog] = useState(false);
    const [editingSolution, setEditingSolution] = useState<any>(null);
    const [solutionDialogInitialTab, setSolutionDialogInitialTab] = useState<'general' | 'products' | 'outcomes' | 'releases' | 'customAttributes'>('general');

    const [taskDialog, setTaskDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    // Queries
    const { data: solutionsData, loading: solutionsLoading, error: solutionsError } = useQuery(SOLUTIONS);
    const solutions = solutionsData?.solutions?.edges?.map((e: any) => e.node) || [];

    const { data: productsData } = useQuery(PRODUCTS);
    const allProducts = productsData?.products?.edges?.map((e: any) => e.node) || [];

    const { data: tasksData, loading: tasksLoading, error: tasksError } = useQuery(TASKS_FOR_SOLUTION, {
        variables: { solutionId: selectedSolution },
        skip: !selectedSolution
    });
    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    const client = useApolloClient();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handlers
    const handleSolutionChange = (solutionId: string) => {
        setSelectedSolution(solutionId);
        localStorage.setItem('lastSelectedSolutionId', solutionId);
        setSelectedSubSection('main');
    };

    const handleDeleteSolution = async () => {
        if (!selectedSolution) return;
        const solution = solutions.find((s: any) => s.id === selectedSolution);
        if (solution && window.confirm(`Are you sure you want to delete "${solution.name}"?`)) {
            try {
                await client.mutate({
                    mutation: DELETE_SOLUTION,
                    variables: { id: selectedSolution },
                    refetchQueries: ['Solutions'],
                    awaitRefetchQueries: true
                });
                setSelectedSolution(null);
                localStorage.removeItem('lastSelectedSolutionId');
            } catch (error: any) {
                console.error('Error deleting solution:', error);
                alert('Failed to delete solution: ' + error.message);
            }
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = tasks.findIndex((t: any) => t.id === active.id);
            const newIndex = tasks.findIndex((t: any) => t.id === over.id);

            const newOrder = arrayMove(tasks, oldIndex, newIndex).map((t: any) => t.id);

            try {
                await client.mutate({
                    mutation: REORDER_TASKS,
                    variables: { solutionId: selectedSolution, order: newOrder },
                    refetchQueries: ['TasksForSolution']
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
                input.solutionId = selectedSolution;
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
                    refetchQueries: ['TasksForSolution'],
                    awaitRefetchQueries: true
                });
            } else {
                await client.mutate({
                    mutation: CREATE_TASK,
                    variables: { input },
                    refetchQueries: ['TasksForSolution'],
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
                    refetchQueries: ['TasksForSolution'],
                    awaitRefetchQueries: true
                });
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Failed to delete task');
            }
        }
    };

    // Helper to get aggregated resources for TaskDialog
    const getAggregatedResources = (solutionId: string) => {
        const solution = solutions.find((s: any) => s.id === solutionId);
        if (!solution) return { outcomes: [], releases: [], licenses: [] };

        const solutionProductIds = solution.products?.edges?.map((e: any) => e.node.id) || [];
        const solutionProducts = allProducts.filter((p: any) => solutionProductIds.includes(p.id));

        const outcomes = [
            ...(solution.outcomes || []),
            ...solutionProducts.flatMap((p: any) => p.outcomes || [])
        ];

        const releases = [
            ...(solution.releases || []),
            ...solutionProducts.flatMap((p: any) => p.releases || [])
        ];

        const licenses = solutionProducts.flatMap((p: any) => p.licenses || []);

        return { outcomes, releases, licenses };
    };

    const { outcomes: aggregatedOutcomes, releases: aggregatedReleases, licenses: aggregatedLicenses } = selectedSolution ? getAggregatedResources(selectedSolution) : { outcomes: [], releases: [], licenses: [] };

    const currentSolution = solutions.find((s: any) => s.id === selectedSolution);
    const NAME_DISPLAY_LIMIT = 12;

    return (
        <Box>
            {/* Solution Selection Header */}
            <Paper sx={{ p: 3, mb: 2 }}>
                {solutionsLoading && <LinearProgress />}
                {solutionsError && <Typography color="error">{solutionsError.message}</Typography>}

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 300 }}>
                        <InputLabel>Select Solution</InputLabel>
                        <Select
                            value={selectedSolution || ''}
                            label="Select Solution"
                            onChange={(e) => handleSolutionChange(e.target.value)}
                        >
                            {solutions.map((s: any) => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedSolution && (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => {
                                    setSolutionDialogInitialTab('general');
                                    setEditingSolution(currentSolution);
                                    setSolutionDialog(true);
                                }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={handleDeleteSolution}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </Box>
            </Paper>

            {/* Content Area */}
            {selectedSolution && currentSolution && (
                <>
                    <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={selectedSubSection} onChange={(_, v) => setSelectedSubSection(v)}>
                            <Tab label="Main" value="main" />
                            <Tab label="Tasks" value="tasks" />
                        </Tabs>
                    </Box>

                    {selectedSubSection === 'main' && (
                        <Box>
                            {/* Name and Description */}
                            <Paper sx={{ p: 4, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', mb: 3 }}>
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{
                                        lineHeight: 1.9,
                                        fontSize: '1.05rem',
                                        whiteSpace: 'pre-line'
                                    }}
                                >
                                    {currentSolution.description || 'No description provided'}
                                </Typography>
                            </Paper>

                            {/* Tiles Grid */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                    gap: 2
                                }}
                            >
                                {/* Products Tile */}
                                <Paper
                                    elevation={1}
                                    onClick={() => {
                                        setSolutionDialogInitialTab('products');
                                        setEditingSolution(currentSolution);
                                        setSolutionDialog(true);
                                    }}
                                    sx={{
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid #e0e0e0',
                                        '&:hover': {
                                            boxShadow: 4,
                                            borderColor: '#d0d0d0'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Products ({(currentSolution.products?.edges || []).length})
                                    </Typography>
                                    {(currentSolution.products?.edges || []).length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {((currentSolution.products?.edges || []).length <= NAME_DISPLAY_LIMIT ? (currentSolution.products?.edges || []) : (currentSolution.products?.edges || []).slice(0, NAME_DISPLAY_LIMIT)).map((edge: any, idx: number) => (
                                                <Typography
                                                    key={edge.node.id}
                                                    variant="body2"
                                                    sx={{
                                                        color: '#424242',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {idx + 1}. {edge.node.name}
                                                </Typography>
                                            ))}
                                            {(currentSolution.products?.edges || []).length > NAME_DISPLAY_LIMIT && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{(currentSolution.products?.edges || []).length - NAME_DISPLAY_LIMIT} more
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No products yet
                                        </Typography>
                                    )}
                                </Paper>

                                {/* Outcomes Tile */}
                                <Paper
                                    elevation={1}
                                    onClick={() => {
                                        setSolutionDialogInitialTab('outcomes');
                                        setEditingSolution(currentSolution);
                                        setSolutionDialog(true);
                                    }}
                                    sx={{
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid #e0e0e0',
                                        '&:hover': {
                                            boxShadow: 4,
                                            borderColor: '#d0d0d0'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Outcomes ({(currentSolution.outcomes || []).length})
                                    </Typography>
                                    {(currentSolution.outcomes || []).length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {((currentSolution.outcomes || []).length <= NAME_DISPLAY_LIMIT ? (currentSolution.outcomes || []) : (currentSolution.outcomes || []).slice(0, NAME_DISPLAY_LIMIT)).map((outcome: any, idx: number) => (
                                                <Typography
                                                    key={outcome.id}
                                                    variant="body2"
                                                    sx={{
                                                        color: '#424242',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {idx + 1}. {outcome.name}
                                                </Typography>
                                            ))}
                                            {(currentSolution.outcomes || []).length > NAME_DISPLAY_LIMIT && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{(currentSolution.outcomes || []).length - NAME_DISPLAY_LIMIT} more
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No outcomes yet
                                        </Typography>
                                    )}
                                </Paper>

                                {/* Releases Tile */}
                                <Paper
                                    elevation={1}
                                    onClick={() => {
                                        setSolutionDialogInitialTab('releases');
                                        setEditingSolution(currentSolution);
                                        setSolutionDialog(true);
                                    }}
                                    sx={{
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid #e0e0e0',
                                        '&:hover': {
                                            boxShadow: 4,
                                            borderColor: '#d0d0d0'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Releases ({(currentSolution.releases || []).length})
                                    </Typography>
                                    {(currentSolution.releases || []).length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {((currentSolution.releases || []).length <= NAME_DISPLAY_LIMIT ? (currentSolution.releases || []) : (currentSolution.releases || []).slice(0, NAME_DISPLAY_LIMIT)).map((release: any, idx: number) => (
                                                <Typography
                                                    key={release.id}
                                                    variant="body2"
                                                    sx={{
                                                        color: '#424242',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {idx + 1}. {release.name}
                                                </Typography>
                                            ))}
                                            {(currentSolution.releases || []).length > NAME_DISPLAY_LIMIT && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{(currentSolution.releases || []).length - NAME_DISPLAY_LIMIT} more
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No releases yet
                                        </Typography>
                                    )}
                                </Paper>

                                {/* Custom Attributes Tile */}
                                <Paper
                                    elevation={1}
                                    onClick={() => {
                                        setSolutionDialogInitialTab('customAttributes');
                                        setEditingSolution(currentSolution);
                                        setSolutionDialog(true);
                                    }}
                                    sx={{
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid #e0e0e0',
                                        '&:hover': {
                                            boxShadow: 4,
                                            borderColor: '#d0d0d0'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Custom Attributes ({Object.keys(currentSolution.customAttrs || {}).filter(k => k.toLowerCase() !== 'licenselevel').length})
                                    </Typography>
                                    {Object.keys(currentSolution.customAttrs || {}).filter(k => k.toLowerCase() !== 'licenselevel').length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {Object.entries(currentSolution.customAttrs || {}).filter(([k]) => k.toLowerCase() !== 'licenselevel').slice(0, NAME_DISPLAY_LIMIT).map(([key, value], idx) => (
                                                <Typography
                                                    key={key}
                                                    variant="body2"
                                                    sx={{
                                                        color: '#424242',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {idx + 1}. {key}: {String(value)}
                                                </Typography>
                                            ))}
                                            {Object.keys(currentSolution.customAttrs || {}).filter(k => k.toLowerCase() !== 'licenselevel').length > NAME_DISPLAY_LIMIT && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{Object.keys(currentSolution.customAttrs || {}).filter(k => k.toLowerCase() !== 'licenselevel').length - NAME_DISPLAY_LIMIT} more
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No custom attributes yet
                                        </Typography>
                                    )}
                                </Paper>
                            </Box>
                        </Box>
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
            <SolutionDialog
                open={solutionDialog}
                onClose={() => setSolutionDialog(false)}
                onSave={() => {
                    // Refetch handled by mutation refetchQueries
                    setSolutionDialog(false);
                }}
                solution={editingSolution}
                allProducts={allProducts}
                initialTab={solutionDialogInitialTab}
            />

            <TaskDialog
                open={taskDialog}
                onClose={() => setTaskDialog(false)}
                title="Task Details"
                task={editingTask}
                solutionId={selectedSolution || undefined}
                onSave={handleSaveTask}
                existingTasks={tasks}
                outcomes={aggregatedOutcomes}
                availableLicenses={aggregatedLicenses}
                availableReleases={aggregatedReleases}
            />
        </Box>
    );
};
