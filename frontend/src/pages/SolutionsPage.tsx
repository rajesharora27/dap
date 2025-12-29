import React, { useState, useEffect } from 'react';
import { EntitySummary } from '@features/telemetry';
import {
    Box, Paper, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem, Button,
    IconButton, Tabs, Tab, Grid, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText, CircularProgress, Card, CardContent, Checkbox, OutlinedInput, Collapse, Alert, Divider, Badge
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Edit, Delete, Add, Description, CheckCircle, Extension, Inventory2, Label, FilterList, ExpandMore, ExpandLess, VerifiedUser, NewReleases, FileUpload, FileDownload, Lock, LockOpen, Clear } from '@shared/components/FAIcon';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '@shared/components/FAIcon';

import { SOLUTIONS, SOLUTION, DELETE_SOLUTION, UPDATE_SOLUTION, EXPORT_SOLUTION_V2, SolutionDialog, SolutionSummaryDashboard, useSolutionEditing } from '@features/solutions';
import { PRODUCTS } from '@features/products';
import { TASKS_FOR_SOLUTION, REORDER_TASKS, UPDATE_TASK, DELETE_TASK, CREATE_TASK, TaskDialog } from '@features/tasks';
import { SOLUTION_TAGS, CREATE_SOLUTION_TAG, UPDATE_SOLUTION_TAG, DELETE_SOLUTION_TAG, SET_SOLUTION_TASK_TAGS, REORDER_SOLUTION_TAGS, TagDialog } from '@features/tags';
import { OutcomeDialog, CREATE_OUTCOME, UPDATE_OUTCOME, DELETE_OUTCOME, REORDER_OUTCOMES } from '@features/product-outcomes';
import { ReleaseDialog, SolutionReleaseDialog, CREATE_RELEASE, UPDATE_RELEASE, DELETE_RELEASE } from '@features/product-releases';
import { LicenseDialog, CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE } from '@features/product-licenses';
import { SortableTaskItem } from '@features/tasks/components/SortableTaskItem';
import { ColumnVisibilityToggle, DEFAULT_VISIBLE_COLUMNS } from '@shared/components/ColumnVisibilityToggle';

import { useAuth } from '@features/auth';
import { InlineEditableText } from '@shared/components/InlineEditableText';
import { BulkImportDialog } from '@features/data-management/components/BulkImportDialog';

// Shared Table Components (same as ProductsPage)
import { OutcomesTable } from '../features/products/components/shared/OutcomesTable';
import { TagsTable } from '../features/products/components/shared/TagsTable';
import { ReleasesTable } from '../features/products/components/shared/ReleasesTable';
import { LicensesTable } from '../features/products/components/shared/LicensesTable';
import { AttributesTable } from '../features/products/components/shared/AttributesTable';
import { ResourcesTable } from '../features/products/components/shared/ResourcesTable';

export const SolutionsPage: React.FC = () => {
    // State
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [selectedSolution, setSelectedSolution] = useState<string | null>(localStorage.getItem('lastSelectedSolutionId'));
    const [selectedSubSection, setSelectedSubSection] = useState<'summary' | 'resources' | 'tasks' | 'products' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes' | 'tags'>('summary');
    const [isExporting, setIsExporting] = useState(false);

    // Column visibility state with localStorage persistence
    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem('dap_solution_task_columns');
        return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
    });

    // Persist column visibility to localStorage
    useEffect(() => {
        localStorage.setItem('dap_solution_task_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Handle column toggle
    const handleToggleColumn = (columnKey: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(k => k !== columnKey)
                : [...prev, columnKey]
        );
    };

    const [taskTagFilter, setTaskTagFilter] = useState<string[]>([]);
    const [taskOutcomeFilter, setTaskOutcomeFilter] = useState<string[]>([]);
    const [taskReleaseFilter, setTaskReleaseFilter] = useState<string[]>([]);
    const [taskLicenseFilter, setTaskLicenseFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [isTasksLocked, setIsTasksLocked] = useState(false);

    // Dialog States - must be before any conditional returns
    const [importDialog, setImportDialog] = useState(false);
    const [solutionDialog, setSolutionDialog] = useState(false);
    const [editingSolutionId, setEditingSolutionId] = useState<string | null>(null);
    const [solutionDialogInitialTab, setSolutionDialogInitialTab] = useState<'general' | 'products' | 'outcomes' | 'releases' | 'licenses' | 'customAttributes'>('general');

    const [taskDialog, setTaskDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    const [tagDialog, setTagDialog] = useState(false);
    const [editingTag, setEditingTag] = useState<any>(null);

    const [licenseDialog, setLicenseDialog] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);

    const [releaseDialog, setReleaseDialog] = useState(false);
    const [editingRelease, setEditingRelease] = useState<any>(null);

    // Inline editing state for outcomes
    const [inlineEditingOutcome, setInlineEditingOutcome] = useState<string | null>(null);
    const [inlineOutcomeName, setInlineOutcomeName] = useState('');

    // External add mode state - used by + icon in tabs row (same as ProductsPage)
    const [externalAddMode, setExternalAddMode] = useState<string | null>(null);

    // Queries - must be before any conditional returns (skip handles auth)
    const { data: solutionsData, loading: solutionsLoading, error: solutionsError, refetch: refetchSolutions } = useQuery(SOLUTIONS, {
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated || authLoading
    });
    const solutions = solutionsData?.solutions?.edges?.map((e: any) => e.node) || [];

    const { data: productsData } = useQuery(PRODUCTS, {
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated || authLoading
    });
    const allProducts = productsData?.products?.edges?.map((e: any) => e.node) || [];



    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(TASKS_FOR_SOLUTION, {
        variables: { solutionId: selectedSolution },
        skip: !selectedSolution || !isAuthenticated || authLoading
    });
    const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

    // Fetch single solution details if selected
    const { data: solutionData, refetch: refetchSolutionDetail } = useQuery(SOLUTION, {
        variables: { id: selectedSolution },
        skip: !selectedSolution || !isAuthenticated || authLoading,
        fetchPolicy: 'cache-and-network'
    });
    const fetchedSolution = solutionData?.solution;
    const listSolution = solutions.find((s: any) => s.id === selectedSolution);
    const displaySolution = (fetchedSolution?.id === selectedSolution) ? fetchedSolution : listSolution;

    // Filter available releases to only those from products that are part of the solution
    const availableProductReleases = React.useMemo(() => {
        if (!selectedSolution || !displaySolution?.products?.edges) return [];
        const releases: any[] = [];

        displaySolution.products.edges.forEach((edge: any) => {
            const product = edge.node;
            // Use allProducts which has detailed info including releases
            const fullProduct = allProducts.find((p: any) => p.id === product?.id || p.id === product?.product?.id);

            if (fullProduct && fullProduct.releases) {
                fullProduct.releases.forEach((r: any) => {
                    releases.push({
                        id: r.id,
                        name: r.name,
                        level: r.level,
                        productId: fullProduct.id,
                        productName: fullProduct.name,
                        description: r.description
                    });
                });
            }
        });
        return releases;
    }, [selectedSolution, displaySolution, allProducts]);

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

    // Use shared hook for CRUD operations (same code as SolutionDialog)
    const solutionEditing = useSolutionEditing(selectedSolution);

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

    const handleExport = async () => {
        if (!selectedSolution) return;
        setIsExporting(true);
        try {
            const { data } = await client.query({
                query: EXPORT_SOLUTION_V2,
                variables: { solutionId: selectedSolution },
                fetchPolicy: 'network-only'
            });

            if (!data || !data.exportSolutionV2) {
                console.error('No data returned from Export Solution V2');
                return;
            }

            const { filename, content, mimeType } = data.exportSolutionV2;

            // Convert base64 to blob and download
            const binaryString = window.atob(content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export Solution V2 failed:', error);
            alert('Export Solution V2 failed');
        }
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
        // Filter out all internal keys
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

    // Attribute Drag End - uses shared hook
    const handleAttributeDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!displaySolution || active.id === over?.id) return;

        const currentAttrs = displaySolution.customAttrs || {};
        const keys = getSortedAttributes(currentAttrs).map(([k]) => k);
        const oldIndex = keys.indexOf(active.id);
        const newIndex = keys.indexOf(over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(keys, oldIndex, newIndex);
            await solutionEditing.handleAttributeReorder(newOrder);
        }
    };


    const handleInlineSolutionUpdate = async (field: 'name' | 'description', value: string) => {
        if (!displaySolution) return;
        try {
            const input: any = {
                name: field === 'name' ? value : displaySolution.name,
                customAttrs: displaySolution.customAttrs
            };

            if (field === 'description') {
                input.resources = value ? [{ label: 'Description', url: value }] : [];
            } else {
                // Strip __typename from resources to avoid GraphQL input error
                input.resources = (displaySolution.resources || []).map((r: any) => ({ label: r.label, url: r.url }));
            }

            await client.mutate({
                mutation: UPDATE_SOLUTION,
                variables: {
                    id: displaySolution.id,
                    input
                },
                refetchQueries: ['Solutions', 'Solution'],
                awaitRefetchQueries: true
            });
        } catch (error: any) {
            console.error('Error updating solution:', error);
            alert('Failed to update solution');
        }
    };


    const handleInlineSolutionReleaseUpdate = async (releaseId: string, field: 'name' | 'description', value: string) => {
        try {
            const release = displaySolution.releases.find((r: any) => r.id === releaseId);
            if (!release) return;

            await client.mutate({
                mutation: UPDATE_RELEASE,
                variables: {
                    id: releaseId,
                    input: {
                        name: field === 'name' ? value : release.name,
                        description: field === 'description' ? value : release.description,
                        level: release.level,
                        isActive: release.isActive,
                        solutionId: selectedSolution,
                        customAttrs: release.customAttrs
                    }
                },
                refetchQueries: ['Solution', 'Solutions']
            });
        } catch (error) {
            console.error('Error updating release:', error);
        }
    };

    const handleInlineSolutionLicenseUpdate = async (licenseId: string, field: 'name' | 'description', value: string) => {
        try {
            const license = displaySolution.licenses.find((l: any) => l.id === licenseId);
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
                        solutionId: selectedSolution,
                        customAttrs: license.customAttrs
                    }
                },
                refetchQueries: ['Solution', 'Solutions']
            });
        } catch (error) {
            console.error('Error updating license:', error);
        }
    };

    // Inline editing for outcomes
    const handleSaveInlineOutcome = async (outcomeId: string) => {
        if (!inlineOutcomeName.trim()) {
            setInlineEditingOutcome(null);
            return;
        }
        try {
            const outcome = currentSolution?.outcomes?.find((o: any) => o.id === outcomeId);
            await client.mutate({
                mutation: UPDATE_OUTCOME,
                variables: {
                    id: outcomeId,
                    input: {
                        name: inlineOutcomeName.trim(),
                        description: outcome?.description || '',
                        solutionId: selectedSolution
                    }
                },
                refetchQueries: ['Solution', 'Solutions']
            });
            setInlineEditingOutcome(null);
        } catch (error: any) {
            console.error('Error updating outcome:', error);
            alert('Error updating outcome: ' + error.message);
        }
    };

    const handleDeleteOutcome = async (outcomeId: string) => {
        if (!window.confirm('Are you sure you want to delete this outcome?')) return;
        try {
            await client.mutate({
                mutation: DELETE_OUTCOME,
                variables: { id: outcomeId },
                refetchQueries: ['Solution', 'Solutions']
            });
        } catch (error: any) {
            console.error('Error deleting outcome:', error);
            alert('Error deleting outcome: ' + error.message);
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

    // Handle tag change from inline edit
    const handleTagChange = async (taskId: string, newTagIds: string[]) => {
        try {
            await client.mutate({
                mutation: SET_SOLUTION_TASK_TAGS,
                variables: {
                    taskId,
                    tagIds: newTagIds
                },
                refetchQueries: ['TasksForSolution'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error updating task tags:', error);
            alert('Failed to update task tags');
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
                            description: tagData.description,
                            color: tagData.color,
                            displayOrder: tagData.displayOrder
                        }
                    },
                    refetchQueries: [
                        { query: SOLUTION_TAGS, variables: { solutionId: selectedSolution } },
                        { query: SOLUTION, variables: { id: selectedSolution } },
                        'Solutions'
                    ]
                });
            } else {
                await client.mutate({
                    mutation: CREATE_SOLUTION_TAG,
                    variables: {
                        input: {
                            solutionId: selectedSolution,
                            name: tagData.name,
                            description: tagData.description,
                            color: tagData.color,
                            displayOrder: tagData.displayOrder
                        }
                    },
                    refetchQueries: [
                        { query: SOLUTION_TAGS, variables: { solutionId: selectedSolution } },
                        { query: SOLUTION, variables: { id: selectedSolution } },
                        'Solutions'
                    ]
                });
            }
            // Also refetch tasks and solution detail to update tag display
            refetchTasks && refetchTasks();
            refetchSolutionDetail && refetchSolutionDetail();
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
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <FormControl sx={{ flex: '1 1 250px', minWidth: 200 }} size="small">
                            <InputLabel>Select Solution</InputLabel>
                            <Select
                                value={selectedSolution || ''}
                                label="Select Solution"
                                onChange={(e) => {
                                    if (e.target.value === '__add_new__') {
                                        setEditingSolutionId(null);
                                        setSolutionDialog(true);
                                    } else {
                                        handleSolutionChange(e.target.value);
                                    }
                                }}
                            >
                                {solutions.map((s: any) => (
                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                ))}
                                {displaySolution && !solutions.find((s: any) => s.id === displaySolution.id) && (
                                    <MenuItem key={displaySolution.id} value={displaySolution.id}>{displaySolution.name}</MenuItem>
                                )}
                                <Divider />
                                <MenuItem value="__add_new__" sx={{ color: 'warning.main', fontWeight: 600 }}>
                                    <Add sx={{ mr: 1, fontSize: '1rem' }} /> Add New Solution
                                </MenuItem>
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
                                            setEditingSolutionId(displaySolution?.id || null);
                                            setSolutionDialog(true);
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
                                        onClick={handleDeleteSolution}
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
                                <Tab label="Summary" value="summary" />
                                <Tab label="Resources" value="resources" />
                                <Tab label={`Tasks${tasks.length > 0 ? ` (${hasActiveFilters ? `${filteredTasks.length}/${tasks.length}` : tasks.length})` : ''}`} value="tasks" />
                                <Tab label="Tags" value="tags" />
                                <Tab label="Products" value="products" />
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
                                                        onClick={() => {
                                                            setTaskTagFilter([]);
                                                            setTaskOutcomeFilter([]);
                                                            setTaskReleaseFilter([]);
                                                            setTaskLicenseFilter([]);
                                                        }}
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
                                                selectedSubSection === 'products' ? 'Add Product' :
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
                                                    } else if (selectedSubSection === 'tags') {
                                                        setExternalAddMode('tags');
                                                    } else if (selectedSubSection === 'resources') {
                                                        setExternalAddMode('resources');
                                                    } else if (selectedSubSection === 'outcomes') {
                                                        setExternalAddMode('outcomes');
                                                    } else if (selectedSubSection === 'releases') {
                                                        setExternalAddMode('releases');
                                                    } else if (selectedSubSection === 'licenses') {
                                                        setExternalAddMode('licenses');
                                                    } else if (selectedSubSection === 'customAttributes') {
                                                        setExternalAddMode('customAttributes');
                                                    } else if (selectedSubSection === 'products') {
                                                        // Open solution dialog for products management
                                                        setEditingSolutionId(displaySolution?.id || null);
                                                        setSolutionDialog(true);
                                                        setSolutionDialogInitialTab('products');
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

                        {/* Filters for Tasks */}
                        {selectedSubSection === 'tasks' && (
                            <>

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
                                                                    <Tooltip key={value} title={tag?.description || tag?.name || value} arrow>
                                                                        <Chip label={tag?.name} size="small" sx={{ bgcolor: tag?.color, color: '#fff', height: 20 }} />
                                                                    </Tooltip>
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                >
                                                    {solutionTags.map((tag: any) => (
                                                        <MenuItem key={tag.id} value={tag.id}>
                                                            <Checkbox checked={taskTagFilter.indexOf(tag.id) > -1} size="small" />
                                                            <ListItemText primary={tag.name} secondary={tag.description} />
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

                        {selectedSubSection === 'summary' && (
                            <Box sx={{ mt: 2 }}>
                                <SolutionSummaryDashboard
                                    solution={{
                                        ...displaySolution,
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
                                            const outcome = displaySolution?.outcomes?.find((o: any) => o.name === outcomeName);
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
                                            items={displaySolution?.resources || []}
                                            onUpdate={solutionEditing.handleResourceUpdate}
                                            onDelete={solutionEditing.handleResourceDelete}
                                            onCreate={solutionEditing.handleResourceCreate}
                                            onReorder={solutionEditing.handleResourceReorder}
                                            externalAddMode={externalAddMode === 'resources'}
                                            onExternalAddComplete={() => setExternalAddMode(null)}
                                        />
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}

                        {selectedSubSection === 'products' && (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Drag to reorder products in this solution.
                                        </Typography>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={async (event) => {
                                                const { active, over } = event;
                                                if (active.id !== over?.id && currentSolution?.products?.edges) {
                                                    const edges = currentSolution.products.edges;
                                                    const oldIndex = edges.findIndex((e: any) => e.node.id === active.id);
                                                    const newIndex = edges.findIndex((e: any) => e.node.id === over?.id);
                                                    const newOrder = arrayMove(edges, oldIndex, newIndex);
                                                    const productOrders = newOrder.map((e: any, idx: number) => ({
                                                        productId: e.node.id,
                                                        order: idx + 1
                                                    }));
                                                    await solutionEditing.handleProductReorder(productOrders);
                                                }
                                            }}
                                        >
                                            <SortableContext
                                                items={currentSolution?.products?.edges?.map((e: any) => e.node.id) || []}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <List>
                                                    {(currentSolution.products?.edges || []).map((edge: any, idx: number) => (
                                                        <SortableSolutionProductRow
                                                            key={edge.node.id}
                                                            product={edge.node}
                                                            idx={idx}
                                                            onRemove={async () => {
                                                                if (confirm(`Remove "${edge.node.name}" from this solution?`)) {
                                                                    await solutionEditing.handleProductRemove(edge.node.id);
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                    {(currentSolution.products?.edges || []).length === 0 && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                                            No products linked
                                                        </Typography>
                                                    )}
                                                </List>
                                            </SortableContext>
                                        </DndContext>
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}

                        {selectedSubSection === 'outcomes' && (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <OutcomesTable
                                            items={currentSolution?.outcomes || []}
                                            onUpdate={solutionEditing.handleOutcomeUpdate}
                                            onDelete={solutionEditing.handleOutcomeDelete}
                                            onCreate={solutionEditing.handleOutcomeCreate}
                                            onReorder={solutionEditing.handleOutcomeReorder}
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
                                            items={currentSolution?.releases || []}
                                            onUpdate={solutionEditing.handleReleaseUpdate}
                                            onDelete={solutionEditing.handleReleaseDelete}
                                            onCreate={solutionEditing.handleReleaseCreate}
                                            onReorder={() => { }} // Releases are auto-sorted by level
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
                                            items={currentSolution?.licenses || []}
                                            onUpdate={solutionEditing.handleLicenseUpdate}
                                            onDelete={solutionEditing.handleLicenseDelete}
                                            onCreate={solutionEditing.handleLicenseCreate}
                                            onReorder={() => { }} // Licenses are auto-sorted by level
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
                                            items={solutionEditing.getAttributesList(currentSolution?.customAttrs)}
                                            onUpdate={solutionEditing.handleAttributeUpdate}
                                            onDelete={solutionEditing.handleAttributeDelete}
                                            onCreate={solutionEditing.handleAttributeCreate}
                                            onReorder={solutionEditing.handleAttributeReorder}
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
                                            items={solutionTags || []}
                                            onUpdate={solutionEditing.handleTagUpdate}
                                            onDelete={solutionEditing.handleTagDelete}
                                            onCreate={solutionEditing.handleTagCreate}
                                            onReorder={solutionEditing.handleTagReorder}
                                            externalAddMode={externalAddMode === 'tags'}
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
                                                            onDoubleClick={(t: any) => { setEditingTask(t); setTaskDialog(true); }}
                                                            onDelete={handleDeleteTask}
                                                            onWeightChange={handleWeightChange}
                                                            onSequenceChange={handleSequenceChange}
                                                            onTagChange={handleTagChange}
                                                            availableTags={displaySolution?.tags || []}
                                                            disableDrag={hasActiveFilters}
                                                            locked={isTasksLocked}
                                                            visibleColumns={visibleColumns}
                                                        />
                                                    ))}
                                                    {filteredTasks.length === 0 && !tasksLoading && (
                                                        <TableRow>
                                                            <TableCell colSpan={4 + visibleColumns.length} sx={{ textAlign: 'center', py: 4 }}>
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
                onClose={() => {
                    setSolutionDialog(false);
                    setEditingSolutionId(null);
                }}
                onSave={() => {
                    // Refetch handled by mutation refetchQueries
                    setSolutionDialog(false);
                    setEditingSolutionId(null);
                }}
                solutionId={editingSolutionId}
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
                availableTags={displaySolution?.tags || []}
            />

            {/* Bulk Import V2 Dialog */}
            {importDialog && (
                <BulkImportDialog
                    open={importDialog}
                    onClose={() => setImportDialog(false)}
                    onSuccess={() => {
                        refetchSolutionDetail && refetchSolutionDetail();
                        refetchSolutions && refetchSolutions();
                        refetchTasks && refetchTasks();
                    }}
                    entityType="SOLUTION"
                />
            )}
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

// Sortable Tag Row Component (Internal)
const SortableSolutionTagRow = ({ tag, idx, onEdit, onDelete }: { tag: any; idx: number; onEdit: () => void; onDelete: () => void }) => {
    const theme = useTheme();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: tag.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : (idx % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent'),
        zIndex: isDragging ? 1 : undefined,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            sx={{
                '&:hover .drag-handle': { opacity: 1 },
                borderBottom: `1px solid ${theme.palette.divider}`
            }}
            secondaryAction={
                <Box>
                    <IconButton edge="end" onClick={onEdit}>
                        <Edit />
                    </IconButton>
                    <IconButton edge="end" onClick={onDelete} color="error">
                        <Delete />
                    </IconButton>
                </Box>
            }
        >
            <IconButton
                size="small"
                className="drag-handle"
                sx={{ opacity: 0.3, cursor: 'grab', mr: 1 }}
                {...attributes}
                {...listeners}
            >
                <DragIndicator fontSize="small" />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: tag.color,
                        flexShrink: 0
                    }}
                />
                <ListItemText
                    primary={tag.name}
                    secondary={tag.description}
                />
            </Box>
        </ListItem>
    );
};

// Sortable Solution Outcome Row Component (Internal)
const SortableSolutionOutcomeRow = ({
    outcome,
    idx,
    inlineEditingOutcome,
    setInlineEditingOutcome,
    inlineOutcomeName,
    setInlineOutcomeName,
    handleSaveInlineOutcome,
    handleDeleteOutcome
}: {
    outcome: any;
    idx: number;
    inlineEditingOutcome: string | null;
    setInlineEditingOutcome: (id: string | null) => void;
    inlineOutcomeName: string;
    setInlineOutcomeName: (name: string) => void;
    handleSaveInlineOutcome: (id: string) => void;
    handleDeleteOutcome: (id: string) => void;
}) => {
    const theme = useTheme();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: outcome.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            sx={{
                cursor: 'default',
                '&:hover': { bgcolor: 'action.hover' },
                '&:hover .drag-handle': { opacity: 1 },
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: idx % 2 === 0 ? alpha(theme.palette.success.main, 0.02) : 'transparent'
            }}
            secondaryAction={
                <Box>
                    {inlineEditingOutcome === outcome.id ? (
                        <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleSaveInlineOutcome(outcome.id)}
                        >
                            <CheckCircle fontSize="small" />
                        </IconButton>
                    ) : (
                        <IconButton
                            size="small"
                            onClick={() => {
                                setInlineEditingOutcome(outcome.id);
                                setInlineOutcomeName(outcome.name);
                            }}
                        >
                            <Edit fontSize="small" />
                        </IconButton>
                    )}
                    <IconButton
                        size="small"
                        onClick={inlineEditingOutcome === outcome.id ? () => setInlineEditingOutcome(null) : () => handleDeleteOutcome(outcome.id)}
                        color="error"
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>
            }
        >
            <IconButton
                size="small"
                className="drag-handle"
                sx={{ opacity: 0.3, cursor: 'grab', mr: 1 }}
                {...attributes}
                {...listeners}
            >
                <DragIndicator fontSize="small" />
            </IconButton>
            <Box sx={{ mr: 2 }}>
                <CheckCircle sx={{ color: theme.palette.success.main }} />
            </Box>
            {inlineEditingOutcome === outcome.id ? (
                <OutlinedInput
                    fullWidth
                    size="small"
                    value={inlineOutcomeName}
                    onChange={(e) => setInlineOutcomeName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveInlineOutcome(outcome.id);
                        if (e.key === 'Escape') setInlineEditingOutcome(null);
                    }}
                    autoFocus
                />
            ) : (
                <Tooltip title={outcome.description || ''} placement="top" arrow>
                    <ListItemText
                        primary={<Typography fontWeight={500}>{outcome.name}</Typography>}
                        secondary={outcome.description}
                        onDoubleClick={() => {
                            setInlineEditingOutcome(outcome.id);
                            setInlineOutcomeName(outcome.name);
                        }}
                    />
                </Tooltip>
            )}
        </ListItem>
    );
};

// Sortable Solution Product Row Component (Internal)
const SortableSolutionProductRow = ({
    product,
    idx,
    onRemove
}: {
    product: any;
    idx: number;
    onRemove: () => void;
}) => {
    const theme = useTheme();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? alpha('#000', 0.05) : (idx % 2 === 0 ? alpha(theme.palette.info.main, 0.02) : 'transparent'),
        zIndex: isDragging ? 1 : undefined,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            sx={{
                '&:hover .drag-handle': { opacity: 1 },
                borderBottom: `1px solid ${theme.palette.divider}`
            }}
            secondaryAction={
                <IconButton edge="end" onClick={onRemove} color="error" size="small">
                    <Delete fontSize="small" />
                </IconButton>
            }
        >
            <IconButton
                size="small"
                className="drag-handle"
                sx={{ opacity: 0.3, cursor: 'grab', mr: 1 }}
                {...attributes}
                {...listeners}
            >
                <DragIndicator fontSize="small" />
            </IconButton>
            <Box sx={{ mr: 2 }}>
                <Inventory2 sx={{ color: theme.palette.info.main }} />
            </Box>
            <ListItemText
                primary={<Typography fontWeight={500}>{product.name}</Typography>}
            />
        </ListItem>
    );
};

