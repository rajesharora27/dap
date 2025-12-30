import React, { useState } from 'react';
import {
    Box, Paper, Typography, CircularProgress, Collapse, FormControl, InputLabel, Select, MenuItem,
    OutlinedInput, Checkbox, Chip, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Tooltip, IconButton, Badge
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Lock, LockOpen, FilterList, Clear, Add
} from '@shared/components/FAIcon';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { ColumnVisibilityToggle } from '@shared/components/ColumnVisibilityToggle';
import { useSolutionContext } from '../context/SolutionContext';
import { useSolutionDialogs } from '../hooks/useSolutionDialogs';
import { SortableTaskItem } from '@features/tasks/components/SortableTaskItem';
import { TaskDialog } from '@features/tasks';
import { useApolloClient } from '@apollo/client';
import { REORDER_TASKS, UPDATE_TASK, CREATE_TASK, DELETE_TASK } from '@features/tasks';

export function SolutionTasksTab() {
    const theme = useTheme();
    const client = useApolloClient();

    const {
        selectedSolutionId,
        selectedSolution,
        tasks,
        filteredTasks,
        loadingTasks,
        visibleColumns,
        handleToggleColumn,
        // Filters
        taskTagFilter, setTaskTagFilter,
        taskOutcomeFilter, setTaskOutcomeFilter,
        taskReleaseFilter, setTaskReleaseFilter,
        taskLicenseFilter, setTaskLicenseFilter,
        showFilters, setShowFilters,
        handleClearFilters
    } = useSolutionContext();

    const {
        isTaskDialogOpen,
        editingTask,
        openAddTask,
        openEditTask,
        closeTaskDialog
    } = useSolutionDialogs();

    const [isTasksLocked, setIsTasksLocked] = useState(false);

    // Filter check
    const hasActiveFilters = taskTagFilter.length > 0 || taskOutcomeFilter.length > 0 || taskReleaseFilter.length > 0 || taskLicenseFilter.length > 0;

    // Resizable columns
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: 'solutions-tasks-table',
        columns: [
            { key: 'order', minWidth: 40, defaultWidth: 80 },
            { key: 'name', minWidth: 200, defaultWidth: 400 },
            { key: 'tags', minWidth: 100, defaultWidth: 150 },
            { key: 'resources', minWidth: 100, defaultWidth: 150 },
            { key: 'weight', minWidth: 60, defaultWidth: 80 },
            { key: 'validationCriteria', minWidth: 150, defaultWidth: 200 },
            { key: 'actions', minWidth: 100, defaultWidth: 100 },
        ],
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Handlers ---
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
                input.solutionId = selectedSolutionId;
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
                    refetchQueries: ['SolutionTasks'],
                    awaitRefetchQueries: true
                });
            } else {
                await client.mutate({
                    mutation: CREATE_TASK,
                    variables: { input },
                    refetchQueries: ['SolutionTasks'], // Verify query name
                    awaitRefetchQueries: true
                });
            }
            closeTaskDialog();
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
                    refetchQueries: ['SolutionTasks'],
                    awaitRefetchQueries: true
                });
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Failed to delete task');
            }
        }
    };

    const handleWeightChange = async (taskId: string, taskName: string, newWeight: number) => {
        try {
            await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: taskId,
                    input: { weight: newWeight }
                },
                refetchQueries: ['SolutionTasks'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error updating task weight:', error);
            alert('Failed to update weight');
        }
    };

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
                variables: { solutionId: selectedSolutionId, order: newOrder },
                refetchQueries: ['SolutionTasks'],
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
                refetchQueries: ['SolutionTasks'],
                awaitRefetchQueries: true
            });
        } catch (error) {
            console.error('Error updating task tags:', error);
            alert('Failed to update task tags');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            const oldIndex = tasks.findIndex((t: any) => t.id === active.id);
            const newIndex = tasks.findIndex((t: any) => t.id === over.id);

            const newOrder = arrayMove(tasks, oldIndex, newIndex).map((t: any) => t.id);

            try {
                await client.mutate({
                    mutation: REORDER_TASKS,
                    variables: { solutionId: selectedSolutionId, order: newOrder },
                    refetchQueries: ['SolutionTasks'],
                    awaitRefetchQueries: true
                });
            } catch (error) {
                console.error('Error reordering tasks:', error);
            }
        }
    };

    return (
        <Box>
            {/* Toolbar */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {loadingTasks && <CircularProgress size={24} sx={{ mr: 2 }} />}

                <Tooltip title={isTasksLocked ? "Unlock Tasks to Edit" : "Lock Tasks"}>
                    <IconButton
                        size="small"
                        onClick={() => setIsTasksLocked(!isTasksLocked)}
                        sx={{ mr: 1, color: isTasksLocked ? 'text.secondary' : 'primary.main', border: `1px solid ${isTasksLocked ? 'divider' : 'primary.main'}`, borderRadius: 1 }}
                    >
                        {isTasksLocked ? <Lock /> : <LockOpen />}
                    </IconButton>
                </Tooltip>

                <Tooltip title={showFilters ? "Hide Filters" : hasActiveFilters ? "Filters Active" : "Show Filters"}>
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

                <ColumnVisibilityToggle
                    visibleColumns={visibleColumns}
                    onToggleColumn={handleToggleColumn}
                />

                <Tooltip title={isTasksLocked ? "Unlock Tasks to Add" : "Add Task"}>
                    <span>
                        <IconButton
                            color="primary"
                            disabled={isTasksLocked}
                            onClick={openAddTask}
                        >
                            <Add />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* Filters Collapse */}
            <Collapse in={showFilters}>
                <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Tag Filter */}
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Tags</InputLabel>
                        <Select
                            multiple
                            value={taskTagFilter}
                            onChange={(e) => setTaskTagFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                            input={<OutlinedInput label="Tags" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const tag = selectedSolution?.tags?.find((t: any) => t.id === value);
                                        return (
                                            <Chip key={value} label={tag?.name || value} size="small" style={{ backgroundColor: tag?.color || '#ccc', color: '#fff' }} sx={{ height: 20 }} />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {selectedSolution?.tags?.map((tag: any) => (
                                <MenuItem key={tag.id} value={tag.id}>
                                    <Checkbox checked={taskTagFilter.indexOf(tag.id) > -1} size="small" />
                                    <Typography>{tag.name}</Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Outcomes Filter */}
                    {selectedSolution?.outcomes && selectedSolution.outcomes.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Outcomes</InputLabel>
                            <Select
                                multiple
                                value={taskOutcomeFilter}
                                onChange={(e) => setTaskOutcomeFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                input={<OutlinedInput label="Outcomes" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const outcome = selectedSolution?.outcomes?.find((o: any) => o.id === value);
                                            return (
                                                <Chip key={value} label={outcome?.name || value} size="small" color="success" sx={{ height: 20 }} />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {selectedSolution?.outcomes?.map((outcome: any) => (
                                    <MenuItem key={outcome.id} value={outcome.id}>
                                        <Checkbox checked={taskOutcomeFilter.indexOf(outcome.id) > -1} size="small" />
                                        <Typography>{outcome.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Releases Filter */}
                    {selectedSolution?.releases && selectedSolution.releases.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Releases</InputLabel>
                            <Select
                                multiple
                                value={taskReleaseFilter}
                                onChange={(e) => setTaskReleaseFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                input={<OutlinedInput label="Releases" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const release = selectedSolution?.releases?.find((r: any) => r.id === value);
                                            return (
                                                <Chip key={value} label={release?.name || value} size="small" color="info" sx={{ height: 20 }} />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {selectedSolution?.releases?.map((release: any) => (
                                    <MenuItem key={release.id} value={release.id}>
                                        <Checkbox checked={taskReleaseFilter.indexOf(release.id) > -1} size="small" />
                                        <Typography>{release.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Licenses Filter */}
                    {selectedSolution?.licenses && selectedSolution.licenses.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Licenses</InputLabel>
                            <Select
                                multiple
                                value={taskLicenseFilter}
                                onChange={(e) => setTaskLicenseFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                input={<OutlinedInput label="Licenses" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const license = selectedSolution?.licenses?.find((l: any) => l.id === value);
                                            return (
                                                <Chip key={value} label={license?.name || value} size="small" color="warning" sx={{ height: 20 }} />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {selectedSolution?.licenses?.map((license: any) => (
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

            {/* Tasks Table */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell width={40}></TableCell>
                                <ResizableTableCell
                                    width={columnWidths['order']}
                                    resizable
                                    resizeHandleProps={getResizeHandleProps('order')}
                                    isResizing={isResizing}
                                    align="left"
                                >
                                    Order
                                </ResizableTableCell>
                                <ResizableTableCell
                                    width={columnWidths['name']}
                                    resizable
                                    resizeHandleProps={getResizeHandleProps('name')}
                                    isResizing={isResizing}
                                    align="left"
                                >
                                    Name
                                </ResizableTableCell>
                                {visibleColumns.includes('tags') && (
                                    <ResizableTableCell
                                        width={columnWidths['tags']}
                                        resizable
                                        resizeHandleProps={getResizeHandleProps('tags')}
                                        isResizing={isResizing}
                                        align="left"
                                    >
                                        Tags
                                    </ResizableTableCell>
                                )}
                                {visibleColumns.includes('resources') && (
                                    <ResizableTableCell
                                        width={columnWidths['resources']}
                                        resizable
                                        resizeHandleProps={getResizeHandleProps('resources')}
                                        isResizing={isResizing}
                                        align="left"
                                    >
                                        Resources
                                    </ResizableTableCell>
                                )}
                                {visibleColumns.includes('implPercent') && (
                                    <ResizableTableCell
                                        width={columnWidths['weight']}
                                        resizable
                                        resizeHandleProps={getResizeHandleProps('weight')}
                                        isResizing={isResizing}
                                        align="center"
                                    >
                                        Weight
                                    </ResizableTableCell>
                                )}
                                {visibleColumns.includes('validationCriteria') && (
                                    <ResizableTableCell
                                        width={columnWidths['validationCriteria']}
                                        resizable
                                        resizeHandleProps={getResizeHandleProps('validationCriteria')}
                                        isResizing={isResizing}
                                        align="center"
                                    >
                                        Validation Criteria
                                    </ResizableTableCell>
                                )}
                                <TableCell width={columnWidths['actions']} align="left">Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            <SortableContext items={filteredTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                                {filteredTasks.map((task: any) => (
                                    <SortableTaskItem
                                        key={task.id}
                                        task={task}
                                        onEdit={(t: any) => openEditTask(t)}
                                        onDelete={handleDeleteTask}
                                        onDoubleClick={(t: any) => openEditTask(t)}
                                        onWeightChange={handleWeightChange}
                                        onSequenceChange={handleSequenceChange}
                                        onTagChange={handleTagChange}
                                        availableTags={selectedSolution?.tags || []}
                                        disableDrag={hasActiveFilters}
                                        locked={isTasksLocked}
                                        visibleColumns={visibleColumns}
                                    />
                                ))}
                                {filteredTasks.length === 0 && !loadingTasks && (
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

            <TaskDialog
                open={isTaskDialogOpen}
                onClose={closeTaskDialog}
                title="Task Details"
                task={editingTask}
                solutionId={selectedSolutionId || undefined}
                onSave={handleSaveTask}
                existingTasks={tasks}
                outcomes={selectedSolution?.outcomes || []}
                availableLicenses={selectedSolution?.licenses || []}
                availableReleases={selectedSolution?.releases || []}
                availableTags={selectedSolution?.tags || []}
            />
        </Box>
    );
}
