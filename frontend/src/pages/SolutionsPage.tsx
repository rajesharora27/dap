import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText, CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { SOLUTIONS, TASKS_FOR_SOLUTION, PRODUCTS, SOLUTION } from '../graphql/queries';
import { DELETE_SOLUTION, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK } from '../graphql/mutations';
import { SortableTaskItem } from '../components/SortableTaskItem';
import { SolutionDialog } from '../components/dialogs/SolutionDialog';
import { TaskDialog } from '../components/dialogs/TaskDialog';

export const SolutionsPage: React.FC = () => {
    // State
    const [selectedSolution, setSelectedSolution] = useState<string | null>(localStorage.getItem('lastSelectedSolutionId'));
    const [selectedSubSection, setSelectedSubSection] = useState<'tasks' | 'products' | 'outcomes' | 'releases' | 'customAttributes'>('tasks');

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
        setSelectedSubSection('tasks');
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
            {selectedSolution && currentSolution && (
                <>
                    <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tabs value={selectedSubSection} onChange={(_, v) => setSelectedSubSection(v)} variant="scrollable" scrollButtons="auto">
                            <Tab label="Tasks" value="tasks" />
                            <Tab label="Products" value="products" />
                            <Tab label="Outcomes" value="outcomes" />
                            <Tab label="Releases" value="releases" />
                            <Tab label="Custom Attributes" value="customAttributes" />
                        </Tabs>
                        <Button
                            variant="contained"
                            startIcon={selectedSubSection === 'tasks' ? <Add /> : <Edit />}
                            size="small"
                            sx={{ width: 240, flexShrink: 0 }}
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
                    </Box>

                    {/* Common Description Section - Show above tabs or in each tab? 
                        User asked to replace Main. Main had description + tiles. 
                        Maybe put description in each tab or just above? 
                        The user said "tiles ... as tabs". Description wasn't a tile.
                        I'll keep description permanent above the tabs or just distinct?
                        Actually, putting it above the tabs makes most sense for context.
                        But the user said "tiles ... as tabs next to tasks". Tasks is a tab.
                        If I put description above tabs, it will be visible for Tasks too.
                        Currently "Main" has description. "Tasks" does not (it just has Add Task).
                        So description was part of "Main".
                        I'll include description in the "Products" tab (first tile tab) or maybe duplicates?
                        
                        Actually, "Main" had description AND tiles.
                        If I remove "Main", where does description go?
                        If I put it above tabs, it pushes tabs down. "better layout from scrolling perspective".
                        If tabs are stuck to top, content scrolls.
                        
                        I will add the description to the top of the "Products" tab (or whichever is the default/first tile-replacement tab).
                        Wait, "Tasks" is now a peer.
                        
                        Let's put the description in a collapsible or just at the top of the "Products" tab? 
                        Or maybe just leave it out if it wasn't requested? No, "No change in functionality".
                        I'll put the description in the "Products" tab for now, as it's the most "General" tab.
                    */}

                    {selectedSubSection === 'products' && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 4, mb: 3, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                                        {currentSolution.description || 'No description provided'}
                                    </Typography>
                                </Paper>

                                <Paper sx={{ p: 2 }}>

                                    <List>
                                        {(currentSolution.products?.edges || []).map((edge: any, idx: number) => (
                                            <ListItem key={edge.node.id} sx={{ borderBottom: '1px solid #eee' }}>
                                                <ListItemText
                                                    primary={edge.node.name}
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
                                        {(currentSolution.outcomes || []).map((outcome: any) => (
                                            <ListItem key={outcome.id} sx={{ borderBottom: '1px solid #eee' }}>
                                                <ListItemText
                                                    primary={outcome.name}
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
                                        {(currentSolution.releases || []).map((release: any) => (
                                            <ListItem key={release.id} sx={{ borderBottom: '1px solid #eee' }}>
                                                <ListItemText
                                                    primary={release.name}
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

                                    {Object.keys(currentSolution.customAttrs || {}).length > 0 ? (
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Attribute</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {Object.entries(currentSolution.customAttrs || {}).map(([key, value]: [string, any]) => (
                                                        <TableRow key={key}>
                                                            <TableCell>{key}</TableCell>
                                                            <TableCell>
                                                                <Tooltip title={typeof value === 'string' ? value : JSON.stringify(value)} placement="top" arrow>
                                                                    <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                            No custom attributes defined
                                        </Typography>
                                    )}
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
