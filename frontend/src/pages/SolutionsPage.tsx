import React, { useState, useEffect } from 'react';
import { EntitySummary } from '../components/EntitySummary';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText, CircularProgress, Card, CardContent, Checkbox, OutlinedInput, Collapse, Alert
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Edit, Delete, Add, Description, CheckCircle, Extension, Inventory2, Label, FilterList, ExpandMore, ExpandLess, VerifiedUser, NewReleases } from '../components/common/FAIcon';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '../components/common/FAIcon';

import { SOLUTIONS, TASKS_FOR_SOLUTION, PRODUCTS, SOLUTION, SOLUTION_TAGS } from '../graphql/queries';
import { DELETE_SOLUTION, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK, UPDATE_SOLUTION, CREATE_SOLUTION_TAG, UPDATE_SOLUTION_TAG, DELETE_SOLUTION_TAG, SET_SOLUTION_TASK_TAGS, CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE, CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE } from '../graphql/mutations';
import { SortableTaskItem } from '../components/SortableTaskItem';
import { SolutionDialog } from '../components/dialogs/SolutionDialog';
import { TaskDialog } from '../components/dialogs/TaskDialog';
import { LicenseDialog } from '../components/dialogs/LicenseDialog';
import { SolutionReleaseDialog } from '../components/dialogs/SolutionReleaseDialog';

import { useAuth } from '../components/AuthContext';
import { TagDialog } from '../components/dialogs/TagDialog';

export const SolutionsPage: React.FC = () => {
    // State
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [selectedSolution, setSelectedSolution] = useState<string | null>(localStorage.getItem('lastSelectedSolutionId'));
    const [selectedSubSection, setSelectedSubSection] = useState<'dashboard' | 'tasks' | 'products' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags'>('dashboard');
    const [taskTagFilter, setTaskTagFilter] = useState<string[]>([]);
    const [taskOutcomeFilter, setTaskOutcomeFilter] = useState<string[]>([]);
    const [taskReleaseFilter, setTaskReleaseFilter] = useState<string[]>([]);
    const [taskLicenseFilter, setTaskLicenseFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Dialog States - must be before any conditional returns
    const [solutionDialog, setSolutionDialog] = useState(false);
    const [editingSolution, setEditingSolution] = useState<any>(null);
    const [solutionDialogInitialTab, setSolutionDialogInitialTab] = useState<'general' | 'products' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes'>('general');

    const [taskDialog, setTaskDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    const [tagDialog, setTagDialog] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);

    const [licenseDialog, setLicenseDialog] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);

    const [releaseDialog, setReleaseDialog] = useState(false);
    const [editingRelease, setEditingRelease] = useState<any>(null);

    // Queries - must be before any conditional returns (skip handles auth)
    const { data: solutionsData, loading: solutionsLoading, error: solutionsError } = useQuery(SOLUTIONS, {
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated || authLoading
    });
    const solutions = solutionsData?.solutions?.edges?.map((e: any) => e.node) || [];

    const { data: productsData } = useQuery(PRODUCTS, {
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated || authLoading
    });
    const allProducts = productsData?.products?.edges?.map((e: any) => e.node) || [];

    const availableProductReleases = allProducts.flatMap((p: any) =>
        (p.releases || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            level: r.level,
            productId: p.id,
            productName: p.name,
            description: r.description
        }))
    );

    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(TASKS_FOR_SOLUTION, {
        variables: { solutionId: selectedSolution },
        skip: !selectedSolution || !isAuthenticated || authLoading
    });
    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    // Fetch single solution details if selected
    const { data: solutionData } = useQuery(SOLUTION, {
        variables: { id: selectedSolution },
        skip: !selectedSolution || !isAuthenticated || authLoading
    });
    const fetchedSolution = solutionData?.solution;
    const displaySolution = solutions.find((s: any) => s.id === selectedSolution) || fetchedSolution;

    const { data: tagsData, refetch: refetchTags } = useQuery(SOLUTION_TAGS, {
        variables: { solutionId: selectedSolution },
        skip: !selectedSolution || !isAuthenticated || authLoading
    });
    const solutionTags = tagsData?.solutionTags || [];

    const client = useApolloClient();
    const theme = useTheme();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Effect for refetching tasks
    useEffect(() => {
        if (selectedSubSection === 'tasks' && selectedSolution && refetchTasks && isAuthenticated) {
            refetchTasks();
        }
    }, [selectedSubSection, selectedSolution, refetchTasks, isAuthenticated]);

    // Now we can have conditional returns after all hooks
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Helper to get solution-level resources for filters (not aggregated from products)
    const getSolutionResources = (solutionId: string | null) => {
        if (!solutionId) return { outcomes: [], releases: [], licenses: [] };
        const solution = displaySolution?.id === solutionId ? displaySolution : solutions.find((s: any) => s.id === solutionId);
        if (!solution) return { outcomes: [], releases: [], licenses: [] };

        // For filtering, we ONLY want solution-level outcomes as per user request
        const outcomes = solution.outcomes || [];

        // Use only solution-level releases and licenses (which now include "picked" ones from products)
        const releases = solution.releases || [];
        const licenses = solution.licenses || [];

        return { outcomes, releases, licenses };
    };

    const { outcomes: aggregatedOutcomes, releases: aggregatedReleases, licenses: aggregatedLicenses } = getSolutionResources(selectedSolution);

    // Filter tasks based on selected filters (AND logic between filter types)
    const filteredTasks = tasks.filter((task: any) => {
        // Tag filter (OR within tags) - use solutionTags for solutions
        if (taskTagFilter.length > 0) {
            const taskTagIds = task.solutionTags?.map((t: any) => t.id) || [];
            if (!taskTagFilter.some(filterId => taskTagIds.includes(filterId))) {
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
            // For licenses, "Empty" usually means "No License Required" which is different from "All".
            // But if the user selects a license, they usually want tasks that require that license OR tasks that require a LOWER level.
            // OR checks generic "compliance".
            // The existing logic checks: if task.license.level > maxSelectedLevel, exclude.
            // If task has NO license, it requires nothing. Should it be hidden?
            // "License Filter" usually means "Show me tasks for License X".
            // Tasks with NO license are usually basic tasks.
            // Existing logic: if (!task.license) return false; -> This hides basic tasks.
            // Let's keep existing logic for License for now unless user complained about it specifically.
            if (!task.license) {
                return false;
            }
            // Get the maximum level from selected licenses
            const selectedLicenses = aggregatedLicenses.filter((l: any) => taskLicenseFilter.includes(l.id));
            const maxSelectedLevel = Math.max(...selectedLicenses.map((l: any) => l.level || 0));
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

    // Handlers
    const handleSolutionChange = (solutionId: string) => {
        setSelectedSolution(solutionId);
        localStorage.setItem('lastSelectedSolutionId', solutionId);
        // Preserve the current tab when changing solutions
        // setSelectedSubSection('dashboard'); // Removed to persist tab
        // Force refetch tasks when solution changes or tab is selected
        setTimeout(() => refetchTasks && refetchTasks(), 0);
    };

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

            let savedTaskId = taskId;

            if (isEdit) {
                await client.mutate({
                    mutation: UPDATE_TASK,
                    variables: { id: taskId, input },
                    refetchQueries: ['TasksForSolution'],
                    awaitRefetchQueries: true
                });
            } else {
                const res = await client.mutate({
                    mutation: CREATE_TASK,
                    variables: { input },
                    refetchQueries: ['TasksForSolution'],
                    awaitRefetchQueries: true
                });
                savedTaskId = res.data?.createTask?.id;
            }

            // Sync tags
            if (taskData.tags && savedTaskId) {
                await client.mutate({
                    mutation: SET_SOLUTION_TASK_TAGS,
                    variables: { taskId: savedTaskId, tagIds: taskData.tags },
                    refetchQueries: ['TasksForSolution']
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

    const handleSaveTag = async (tagData: any, existingId?: string) => {
        try {
            if (existingId) {
                await client.mutate({
                    mutation: UPDATE_SOLUTION_TAG,
                    variables: {
                        id: existingId,
                        input: {
                            name: tagData.name,
                            color: tagData.color,
                            displayOrder: tagData.displayOrder
                        }
                    },
                    refetchQueries: [{ query: SOLUTION_TAGS, variables: { solutionId: selectedSolution } }]
                });
            } else {
                await client.mutate({
                    mutation: CREATE_SOLUTION_TAG,
                    variables: {
                        input: {
                            solutionId: selectedSolution,
                            name: tagData.name,
                            color: tagData.color,
                            displayOrder: tagData.displayOrder
                        }
                    },
                    refetchQueries: [{ query: SOLUTION_TAGS, variables: { solutionId: selectedSolution } }]
                });
            }
            // Also refetch tasks to update tag display
            refetchTasks && refetchTasks();
        } catch (error: any) {
            console.error('Error saving tag:', error);
            alert('Failed to save tag: ' + error.message);
        }
    };

    const handleDeleteTag = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this tag? If it is used by tasks, it will be removed from them.')) {
            try {
                await client.mutate({
                    mutation: DELETE_SOLUTION_TAG,
                    variables: { id },
                    refetchQueries: [{ query: SOLUTION_TAGS, variables: { solutionId: selectedSolution } }]
                });
                refetchTasks && refetchTasks();
            } catch (error: any) {
                console.error('Error deleting tag:', error);
                alert('Failed to delete tag: ' + error.message);
            }
        }
    };


    const handleSaveRelease = async (input: any) => {
        try {
            if (editingRelease) {
                await client.mutate({
                    mutation: UPDATE_RELEASE,
                    variables: { id: editingRelease.id, input },
                    refetchQueries: ['Solutions', 'SolutionDetail']
                });
            } else {
                await client.mutate({
                    mutation: CREATE_RELEASE,
                    variables: { input: { ...input, solutionId: selectedSolution } },
                    refetchQueries: ['Solutions', 'SolutionDetail']
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
                    refetchQueries: ['Solutions', 'SolutionDetail']
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
                    refetchQueries: ['Solutions', 'SolutionDetail']
                });
            } else {
                await client.mutate({
                    mutation: CREATE_LICENSE,
                    variables: { input: { ...input, solutionId: selectedSolution } },
                    refetchQueries: ['Solutions', 'SolutionDetail']
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
                    refetchQueries: ['Solutions', 'SolutionDetail']
                });
            } catch (error: any) {
                alert('Error deleting license: ' + error.message);
            }
        }
    };



    // Note: getSolutionResources and aggregated* variables are defined earlier in the component

    const currentSolution = displaySolution;
    const NAME_DISPLAY_LIMIT = 12;

    // Flatten all licenses from all products in the solution for the dialog
    const availableProductLicenses = React.useMemo(() => {
        if (!selectedSolution || !currentSolution?.products?.edges) return [];
        const licenses: any[] = [];
        currentSolution.products.edges.forEach((edge: any) => {
            const product = edge.node;
            // Use allProducts which has detailed info including licenses
            const fullProduct = allProducts.find((p: any) => p.id === product.id);
            if (fullProduct && fullProduct.licenses) {
                fullProduct.licenses.forEach((l: any) => {
                    licenses.push({
                        ...l,
                        productId: fullProduct.id,
                        productName: fullProduct.name
                    });
                });
            }
        });
        return licenses;
    }, [selectedSolution, currentSolution, allProducts]);

    const renderMappingInfo = (item: any, type: 'licenses' | 'releases') => {
        const mappingKey = type === 'licenses' ? 'productLicenseMapping' : 'productReleaseMapping';
        const mapping = item.customAttrs?.[mappingKey];

        if (!mapping || Object.keys(mapping).length === 0) return null;

        const productCount = Object.keys(mapping).length;
        const totalItems = Object.values(mapping).flat().length;
        const isAll = Object.values(mapping).flat().includes('__ALL__') || Object.values(mapping).flat().includes('ALL');

        return (
            <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                    label={isAll ? `Mapped to All Product ${type === 'licenses' ? 'Licenses' : 'Releases'}` : `Mapped to ${totalItems} ${type === 'licenses' ? 'Licenses' : 'Releases'} across ${productCount} Product(s)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                />
            </Box>
        );
    };

    return (
        <Box>
            {/* Solution Selection Header */}
            {solutionsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading solutions: {solutionsError.message}
                </Alert>
            )}
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
                                <Tab label={`Tasks${tasks.length > 0 ? ` (${hasActiveFilters ? `${filteredTasks.length}/${tasks.length}` : tasks.length})` : ''}`} value="tasks" />
                                <Tab label="Tags" value="tags" />
                                <Tab label="Products" value="products" />
                                <Tab label="Outcomes" value="outcomes" />
                                <Tab label="Releases" value="releases" />
                                <Tab label="Licenses" value="licenses" />
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
                                        } else if (selectedSubSection === 'tags') {
                                            setEditingTag(null);
                                            setTagDialog(true);
                                        } else if (selectedSubSection === 'licenses') {
                                            setEditingLicense(null);
                                            setLicenseDialog(true);
                                        } else if (selectedSubSection === 'releases') {
                                            setEditingRelease(null);
                                            setReleaseDialog(true);
                                        } else {
                                            setEditingSolution(currentSolution);
                                            setSolutionDialog(true);
                                            if (selectedSubSection === 'products') setSolutionDialogInitialTab('products');
                                            else if (selectedSubSection === 'outcomes') setSolutionDialogInitialTab('outcomes');
                                            else if (selectedSubSection === 'customAttributes') setSolutionDialogInitialTab('customAttributes');
                                        }
                                    }}
                                >
                                    {selectedSubSection === 'tasks' ? 'Add Task' :
                                        selectedSubSection === 'products' ? 'Manage Products' :
                                            selectedSubSection === 'outcomes' ? 'Manage Outcomes' :
                                                selectedSubSection === 'releases' ? 'Manage Releases' :
                                                    selectedSubSection === 'customAttributes' ? 'Manage Attributes' :
                                                        selectedSubSection === 'tags' ? 'Add Tag' :
                                                            selectedSubSection === 'licenses' ? 'Add License' :
                                                                selectedSubSection === 'releases' ? 'Add Release' : 'Manage'}
                                </Button>
                            )}
                        </Box>

                        {/* Filters for Tasks */}
                        {selectedSubSection === 'tasks' && (
                            <>
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
                                                onDelete={() => {
                                                    setTaskTagFilter([]);
                                                    setTaskOutcomeFilter([]);
                                                    setTaskReleaseFilter([]);
                                                    setTaskLicenseFilter([]);
                                                }}
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
                                        {/* Tags Filter */}
                                        {solutionTags.length > 0 && (
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
                                                                const tag = solutionTags.find((t: any) => t.id === value);
                                                                return (
                                                                    <Chip key={value} label={tag?.name} size="small" sx={{ bgcolor: tag?.color, color: '#fff', height: 20 }} />
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                >
                                                    {solutionTags.map((tag: any) => (
                                                        <MenuItem key={tag.id} value={tag.id}>
                                                            <Checkbox checked={taskTagFilter.indexOf(tag.id) > -1} size="small" />
                                                            <ListItemText primary={tag.name} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}

                                        {/* Outcomes Filter */}
                                        {aggregatedOutcomes.length > 0 && (
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
                                                                const outcome = aggregatedOutcomes.find((o: any) => o.id === value);
                                                                return (
                                                                    <Chip key={value} label={outcome?.name || value} size="small" color="success" sx={{ height: 20 }} />
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                >
                                                    {aggregatedOutcomes.map((outcome: any) => (
                                                        <MenuItem key={outcome.id} value={outcome.id}>
                                                            <Checkbox checked={taskOutcomeFilter.indexOf(outcome.id) > -1} size="small" />
                                                            <ListItemText primary={outcome.name} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}

                                        {/* Releases Filter */}
                                        {aggregatedReleases.length > 0 && (
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
                                                                const release = aggregatedReleases.find((r: any) => r.id === value);
                                                                return (
                                                                    <Chip key={value} label={release?.name || value} size="small" color="info" sx={{ height: 20 }} />
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                >
                                                    {aggregatedReleases.map((release: any) => (
                                                        <MenuItem key={release.id} value={release.id}>
                                                            <Checkbox checked={taskReleaseFilter.indexOf(release.id) > -1} size="small" />
                                                            <ListItemText primary={release.name} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}

                                        {/* Licenses Filter */}
                                        {aggregatedLicenses.length > 0 && (
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
                                                                const license = aggregatedLicenses.find((l: any) => l.id === value);
                                                                return (
                                                                    <Chip key={value} label={license?.name || value} size="small" color="warning" sx={{ height: 20 }} />
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                >
                                                    {aggregatedLicenses.map((license: any) => (
                                                        <MenuItem key={license.id} value={license.id}>
                                                            <Checkbox checked={taskLicenseFilter.indexOf(license.id) > -1} size="small" />
                                                            <ListItemText primary={license.name} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}

                                        {/* Clear Filters Button */}
                                        {hasActiveFilters && (
                                            <Button size="small" onClick={() => {
                                                setTaskTagFilter([]);
                                                setTaskOutcomeFilter([]);
                                                setTaskReleaseFilter([]);
                                                setTaskLicenseFilter([]);
                                            }} variant="outlined" color="secondary">
                                                Clear All
                                            </Button>
                                        )}
                                    </Box>
                                </Collapse>
                            </>
                        )}

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
                                                    secondaryAction={
                                                        <Box>
                                                            <IconButton edge="end" aria-label="edit" onClick={() => { setEditingRelease(release); setReleaseDialog(true); }}>
                                                                <Edit />
                                                            </IconButton>
                                                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteRelease(release.id)}>
                                                                <Delete />
                                                            </IconButton>
                                                        </Box>
                                                    }
                                                    sx={{
                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                        bgcolor: idx % 2 === 0 ? alpha(theme.palette.warning.main, 0.02) : 'transparent'
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={<Typography fontWeight={500}>{release.name}</Typography>}
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2" component="span" display="block">{release.description}</Typography>
                                                                {renderMappingInfo(release, 'releases')}
                                                            </>
                                                        }
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

                        {selectedSubSection === 'licenses' && (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <List>
                                            {(currentSolution.licenses || []).map((license: any, idx: number) => (
                                                <ListItem
                                                    key={license.id}
                                                    secondaryAction={
                                                        <Box>
                                                            <IconButton edge="end" aria-label="edit" onClick={() => { setEditingLicense(license); setLicenseDialog(true); }}>
                                                                <Edit />
                                                            </IconButton>
                                                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteLicense(license.id)}>
                                                                <Delete />
                                                            </IconButton>
                                                        </Box>
                                                    }
                                                    sx={{
                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                        bgcolor: idx % 2 === 0 ? alpha(theme.palette.info.main, 0.02) : 'transparent'
                                                    }}
                                                >
                                                    <Box sx={{ mr: 2 }}>
                                                        <VerifiedUser sx={{ color: license.isActive ? theme.palette.success.main : theme.palette.text.disabled }} />
                                                    </Box>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography fontWeight={500}>{license.name}</Typography>
                                                                <Chip label={`Level ${license.level}`} size="small" variant="outlined" />
                                                                {!license.isActive && <Chip label="Inactive" size="small" color="default" />}
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2" component="span" display="block">{license.description}</Typography>
                                                                {renderMappingInfo(license, 'licenses')}
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                            {(currentSolution.licenses || []).length === 0 && (
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

                        {selectedSubSection === 'tags' && (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <List>
                                            {solutionTags.map((tag: any, idx: number) => (
                                                <ListItem
                                                    key={tag.id}
                                                    secondaryAction={
                                                        <Box>
                                                            <IconButton edge="end" aria-label="edit" onClick={() => { setEditingTag(tag); setTagDialog(true); }}>
                                                                <Edit />
                                                            </IconButton>
                                                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTag(tag.id)}>
                                                                <Delete />
                                                            </IconButton>
                                                        </Box>
                                                    }
                                                    sx={{
                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                        bgcolor: idx % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent'
                                                    }}
                                                >
                                                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                                        <Label sx={{ color: tag.color, mr: 1 }} />
                                                        <Chip
                                                            label={tag.name}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: tag.color,
                                                                color: '#fff',
                                                                fontWeight: 500
                                                            }}
                                                        />
                                                    </Box>
                                                </ListItem>
                                            ))}
                                            {solutionTags.length === 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                                    No tags defined. Click "Add Tag" to create one.
                                                </Typography>
                                            )}
                                        </List>
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
                                                            onDoubleClick={(t: any) => { setEditingTask(t); setTaskDialog(true); }}
                                                            onDelete={handleDeleteTask}
                                                            onWeightChange={handleWeightChange}
                                                            onSequenceChange={handleSequenceChange}
                                                            disableDrag={hasActiveFilters}
                                                        />
                                                    ))}
                                                    {filteredTasks.length === 0 && !tasksLoading && (
                                                        <TableRow>
                                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                                <Typography color="text.secondary">
                                                                    {hasActiveFilters ? 'No tasks match the selected filters' : 'No tasks found for this solution'}
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

            <LicenseDialog
                open={licenseDialog}
                onClose={() => { setLicenseDialog(false); setEditingLicense(null); }}
                onSave={handleSaveLicense}
                license={editingLicense}
                availableProductLicenses={availableProductLicenses}
                title={editingLicense ? 'Edit Solution License' : 'Add Solution License'}
            />

            <SolutionReleaseDialog
                open={releaseDialog}
                onClose={() => setReleaseDialog(false)}
                onSave={handleSaveRelease}
                release={editingRelease}
                title={editingRelease ? "Edit Solution Release" : "Add Solution Release"}
                availableProductReleases={availableProductReleases}
            />

            <TagDialog
                open={tagDialog || (selectedSubSection === 'tags' && tagDialog)}
                onClose={() => setTagDialog(false)}
                onSave={handleSaveTag}
                tag={editingTag}
                existingNames={solutionTags.map((t: any) => t.name)}
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
                availableTags={solutionTags}
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
