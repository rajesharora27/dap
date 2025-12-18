import React, { useState, useEffect } from 'react';
import { EntitySummary } from '../components/EntitySummary';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText, CircularProgress, Card, CardContent
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Edit, Delete, Add, Description, CheckCircle, Extension, Inventory2 } from '@mui/icons-material';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '@mui/icons-material';

import { SOLUTIONS, TASKS_FOR_SOLUTION, PRODUCTS, SOLUTION } from '../graphql/queries';
import { DELETE_SOLUTION, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK, UPDATE_SOLUTION } from '../graphql/mutations';
import { SortableTaskItem } from '../components/SortableTaskItem';
import { SolutionDialog } from '../components/dialogs/SolutionDialog';
import { TaskDialog } from '../components/dialogs/TaskDialog';

export const SolutionsPage: React.FC = () => {
    // State
    const [selectedSolution, setSelectedSolution] = useState<string | null>(localStorage.getItem('lastSelectedSolutionId'));
    const [selectedSubSection, setSelectedSubSection] = useState<'dashboard' | 'tasks' | 'products' | 'outcomes' | 'releases' | 'customAttributes'>('dashboard');

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

    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(TASKS_FOR_SOLUTION, {
        variables: { solutionId: selectedSolution },
        skip: !selectedSolution
    });
    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    // Fetch single solution details if selected
    const { data: solutionData } = useQuery(SOLUTION, {
        variables: { id: selectedSolution },
        skip: !selectedSolution
    });
    const fetchedSolution = solutionData?.solution;
    const displaySolution = solutions.find((s: any) => s.id === selectedSolution) || fetchedSolution;

    const client = useApolloClient();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handlers
    const handleSolutionChange = (solutionId: string) => {
        setSelectedSolution(solutionId);
        localStorage.setItem('lastSelectedSolutionId', solutionId);
        // Preserve the current tab when changing solutions
        // setSelectedSubSection('dashboard'); // Removed to persist tab
        // Force refetch tasks when solution changes or tab is selected
        setTimeout(() => refetchTasks && refetchTasks(), 0);
    };

    useEffect(() => {
        if (selectedSubSection === 'tasks' && selectedSolution && refetchTasks) {
            refetchTasks();
        }
    }, [selectedSubSection, selectedSolution, refetchTasks]);

    const handleDeleteSolution = async () => {
        if (!selectedSolution) return;
        const solution = displaySolution;
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

    // Handle weight change from inline edit
    const handleWeightChange = async (taskId: string, taskName: string, newWeight: number) => {
        try {
            await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: taskId,
                    input: { weight: newWeight }
                },
                refetchQueries: ['TasksForSolution'],
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
                variables: { solutionId: selectedSolution, order: newOrder },
                refetchQueries: ['TasksForSolution'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error reordering tasks:', error);
            alert('Failed to update sequence');
        }
    };

    // Helper to get aggregated resources for TaskDialog
    const getAggregatedResources = (solutionId: string) => {
        const solution = displaySolution?.id === solutionId ? displaySolution : solutions.find((s: any) => s.id === solutionId);
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

    const currentSolution = displaySolution;
    const NAME_DISPLAY_LIMIT = 12;

    const theme = useTheme();

    return (
        <Box>
            {/* Solution Selection Header */}
            {solutionsLoading && <LinearProgress sx={{ mb: 2 }} />}
            {!solutionsLoading && !solutionsError && (
                <Paper sx={{ p: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <FormControl sx={{ flex: '1 1 250px', minWidth: 200 }} size="small">
                            <InputLabel>Select Solution</InputLabel>
                            <Select
                                value={selectedSolution || ''}
                                label="Select Solution"
                                onChange={(e) => handleSolutionChange(e.target.value)}
                            >
                                {solutions.map((s: any) => (
                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                ))}
                                {displaySolution && !solutions.find((s: any) => s.id === displaySolution.id) && (
                                    <MenuItem key={displaySolution.id} value={displaySolution.id}>{displaySolution.name}</MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                            {selectedSolution && (
                                <>
                                    <Button
                                        variant="contained"
                                        startIcon={<Edit />}
                                        size="small"
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
                                        size="small"
                                        onClick={handleDeleteSolution}
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
                                onClick={() => { setEditingSolution(null); setSolutionDialog(true); }}
                            >
                                Add Solution
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Content Area */}
            {
                selectedSolution && currentSolution && (
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
                                <Tab label="Tasks" value="tasks" />
                                <Tab label="Products" value="products" />
                                <Tab label="Outcomes" value="outcomes" />
                                <Tab label="Releases" value="releases" />
                                <Tab label="Custom Attributes" value="customAttributes" />
                            </Tabs>

                            {selectedSubSection !== 'dashboard' && (
                                <Button
                                    variant="contained"
                                    startIcon={selectedSubSection === 'tasks' ? <Add /> : <Edit />}
                                    size="small"
                                    sx={{ ml: 2, flexShrink: 0 }}
                                    onClick={() => {
                                        if (selectedSubSection === 'tasks') {
                                            setEditingTask(null);
                                            setTaskDialog(true);
                                        } else {
                                            setEditingSolution(currentSolution);
                                            setSolutionDialog(true);
                                            if (selectedSubSection === 'products') setSolutionDialogInitialTab('products');
                                            else if (selectedSubSection === 'outcomes') setSolutionDialogInitialTab('outcomes');
                                            else if (selectedSubSection === 'releases') setSolutionDialogInitialTab('releases');
                                            else if (selectedSubSection === 'customAttributes') setSolutionDialogInitialTab('customAttributes');
                                        }
                                    }}
                                >
                                    {selectedSubSection === 'tasks' ? 'Add Task' :
                                        selectedSubSection === 'products' ? 'Manage Products' :
                                            selectedSubSection === 'outcomes' ? 'Manage Outcomes' :
                                                selectedSubSection === 'releases' ? 'Manage Releases' :
                                                    selectedSubSection === 'customAttributes' ? 'Manage Attributes' : 'Manage'}
                                </Button>
                            )}
                        </Box>

                        {selectedSubSection === 'dashboard' && (
                            <Box sx={{ mt: 2 }}>
                                {/* Read-only Dashboard Layout - Full Width */}
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12 }}>
                                        {/* Solution Name Header */}
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
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark, mb: 2 }}>
                                                {currentSolution.name}
                                            </Typography>

                                            {/* Products in this Solution */}
                                            <Box sx={{ mt: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Inventory2 sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                                                    <Typography variant="subtitle2" sx={{ color: theme.palette.info.dark, fontWeight: 600 }}>
                                                        Products ({currentSolution.products?.edges?.length || 0})
                                                    </Typography>
                                                </Box>
                                                {currentSolution.products?.edges?.length > 0 ? (
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pl: 3.5 }}>
                                                        {currentSolution.products.edges.map((e: any) => (
                                                            <Chip
                                                                key={e.node.id}
                                                                label={e.node.name}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.info.main, 0.12),
                                                                    color: theme.palette.info.dark,
                                                                    fontWeight: 500,
                                                                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, pl: 3.5 }}>
                                                        No products assigned to this solution.
                                                    </Typography>
                                                )}
                                            </Box>
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
                                                    {currentSolution.description || 'No detailed description provided for this solution.'}
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
                                                        label={currentSolution.outcomes?.length || 0}
                                                        size="small"
                                                        sx={{
                                                            ml: 1,
                                                            bgcolor: alpha(theme.palette.success.main, 0.15),
                                                            color: theme.palette.success.dark,
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                </Box>
                                                {currentSolution.outcomes && currentSolution.outcomes.length > 0 ? (
                                                    <List disablePadding>
                                                        {currentSolution.outcomes.map((o: any, idx: number) => (
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
                                                        No outcomes defined for this solution.
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {selectedSubSection === 'products' && (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 2 }}>


                                        <List>
                                            {(currentSolution.products?.edges || []).map((edge: any, idx: number) => (
                                                <ListItem
                                                    key={edge.node.id}
                                                    sx={{
                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                        bgcolor: idx % 2 === 0 ? alpha(theme.palette.info.main, 0.02) : 'transparent'
                                                    }}
                                                >
                                                    <Box sx={{ mr: 2 }}>
                                                        <Inventory2 sx={{ color: theme.palette.info.main }} />
                                                    </Box>
                                                    <ListItemText
                                                        primary={<Typography fontWeight={500}>{edge.node.name}</Typography>}
                                                        secondary={edge.node.description}
                                                    />
                                                </ListItem>
                                            ))}
                                            {(currentSolution.products?.edges || []).length === 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                                    No products linked
                                                </Typography>
                                            )}
                                        </List>
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}

                        {selectedSubSection === 'outcomes' && (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 2 }}>

                                        <List>
                                            {(currentSolution.outcomes || []).map((outcome: any, idx: number) => (
                                                <ListItem
                                                    key={outcome.id}
                                                    sx={{
                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                        bgcolor: idx % 2 === 0 ? alpha(theme.palette.success.main, 0.02) : 'transparent'
                                                    }}
                                                >
                                                    <Box sx={{ mr: 2 }}>
                                                        <CheckCircle sx={{ color: theme.palette.success.main }} />
                                                    </Box>
                                                    <ListItemText
                                                        primary={<Typography fontWeight={500}>{outcome.name}</Typography>}
                                                        secondary={outcome.description}
                                                    />
                                                </ListItem>
                                            ))}
                                            {(currentSolution.outcomes || []).length === 0 && (
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
                                            {(currentSolution.releases || []).map((release: any, idx: number) => (
                                                <ListItem
                                                    key={release.id}
                                                    sx={{
                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                        bgcolor: idx % 2 === 0 ? alpha(theme.palette.warning.main, 0.02) : 'transparent'
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={<Typography fontWeight={500}>{release.name}</Typography>}
                                                        secondary={release.description}
                                                    />
                                                </ListItem>
                                            ))}
                                            {(currentSolution.releases || []).length === 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                                    No releases defined
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
                                                    <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.08) }}>
                                                        <TableCell sx={{ fontWeight: 'bold', color: theme.palette.secondary.dark }}>Attribute</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', color: theme.palette.secondary.dark }}>Value</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {getSortedAttributes(currentSolution?.customAttrs).map(([key, value], idx) => (
                                                        <TableRow
                                                            key={key}
                                                            sx={{
                                                                bgcolor: idx % 2 === 0 ? alpha(theme.palette.secondary.main, 0.02) : 'transparent'
                                                            }}
                                                        >
                                                            <TableCell sx={{ fontWeight: 500 }}>{key}</TableCell>
                                                            <TableCell>
                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {getSortedAttributes(currentSolution?.customAttrs).length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={2} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
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

                        {selectedSubSection === 'tasks' && (
                            <Box>
                                {/* Tasks View */}
                                {(tasksLoading || tasksError) && (
                                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                                        {tasksLoading && <CircularProgress size={24} />}
                                        {tasksError && <Typography color="error" variant="body2">{tasksError.message}</Typography>}
                                    </Box>
                                )}

                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
                                        <Table size="small" stickyHeader>
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
                                                            onDoubleClick={(t: any) => { setEditingTask(t); setTaskDialog(true); }}
                                                            onDelete={handleDeleteTask}
                                                            onWeightChange={handleWeightChange}
                                                            onSequenceChange={handleSequenceChange}
                                                        />
                                                    ))}
                                                    {tasks.length === 0 && !tasksLoading && (
                                                        <TableRow>
                                                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                                                                <Typography color="text.secondary">No tasks found for this solution</Typography>
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
                    </>
                )
            }

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
        </Box >
    );
};

// Sortable Row Component (Internal) - for Solutions Page (Read-onlyish view, but sortable)
// Note: SolutionsPage currently doesn't have delete/edit Actions for attributes in the table directly, 
// they are managed via "Manage Attributes" dialog. So we only need drag handle here.
const SortableAttributeRow = ({ id, attrKey, value }: any) => {
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
            <TableCell sx={{ fontWeight: 500 }}>
                {attrKey}
            </TableCell>
            <TableCell>
                <Tooltip title={typeof value === 'string' ? value : JSON.stringify(value)} placement="top" arrow>
                    <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
};
