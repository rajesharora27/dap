import React, { useState } from 'react';
import {
    Box, Paper, Typography, Collapse, FormControl, InputLabel, Select, MenuItem,
    OutlinedInput, Checkbox, Chip, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    useTheme, LinearProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskDialog } from './TaskDialog';

// Define the interface for the component props
export interface TasksTabContentProps {
    // Data
    loading: boolean;
    tasks: any[];
    filteredTasks: any[];
    progress?: number;

    // Configuration
    entityId: string;
    entityType: 'PRODUCT' | 'SOLUTION';
    isLocked: boolean;
    tableId: string; // unique ID for resizable columns

    // Metadata
    availableTags: any[];
    availableOutcomes: any[];
    availableReleases: any[];
    availableLicenses: any[];

    // Filter State
    filters: {
        tags: string[];
        outcomes: string[];
        releases: string[];
        licenses: string[];
        show: boolean;
    };
    onFilterChange: {
        setTags: (v: string[]) => void;
        setOutcomes: (v: string[]) => void;
        setReleases: (v: string[]) => void;
        setLicenses: (v: string[]) => void;
        clearAll: () => void;
    };

    // Columns
    visibleColumns: string[];

    // Dialog Control
    dialog: {
        isOpen: boolean;
        editingTask: any; // Task being edited or null for new
        onOpenAdd: () => void;
        onOpenEdit: (task: any) => void;
        onClose: () => void;
    };

    // Actions
    actions: {
        onSave: (taskData: any) => Promise<void>;
        onDelete: (taskId: string) => Promise<void>;
        onReorder: (newOrder: string[]) => Promise<void>;
        onWeightChange: (taskId: string, taskName: string, weight: number) => Promise<void>;
        onSequenceChange: (taskId: string, taskName: string, newSeq: number) => Promise<void>;
        onTagChange: (taskId: string, tagIds: string[]) => Promise<void>;
        onStatusChange?: (taskId: string, status: string, statusNotes?: string) => Promise<void>;
    }
}

export function TasksTabContent({
    loading,
    tasks,
    filteredTasks,
    progress = 0,
    entityId,
    entityType,
    isLocked,
    tableId,
    availableTags,
    availableOutcomes,
    availableReleases,
    availableLicenses,
    filters,
    onFilterChange,
    visibleColumns,
    dialog,
    actions
}: TasksTabContentProps) {
    const theme = useTheme();

    // Check if any filters are active
    const hasActiveFilters = filters.tags.length > 0 ||
        filters.outcomes.length > 0 ||
        filters.releases.length > 0 ||
        filters.licenses.length > 0;

    // Resizable columns
    const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
        tableId: tableId,
        columns: [
            { key: 'order', minWidth: 40, defaultWidth: 80 },
            { key: 'status', minWidth: 120, defaultWidth: 140 },
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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            const oldIndex = tasks.findIndex((t: any) => t.id === active.id);
            const newIndex = tasks.findIndex((t: any) => t.id === over.id);

            // Optimistic update logic could go here if we had local state, 
            // but we rely on the parent to refetch or update its state
            const newOrder = arrayMove(tasks, oldIndex, newIndex).map((t: any) => t.id);
            await actions.onReorder(newOrder);
        }
    };

    return (
        <Box>
            {/* Filters Section */}
            <Collapse in={filters.show}>
                <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Tag Filter */}
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Tags</InputLabel>
                        <Select
                            multiple
                            value={filters.tags}
                            onChange={(e) => onFilterChange.setTags(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                            input={<OutlinedInput label="Tags" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const tag = availableTags?.find((t: any) => t.id === value);
                                        return (
                                            <Chip key={value} label={tag?.name || value} size="small" style={{ backgroundColor: tag?.color || '#ccc', color: '#fff' }} sx={{ height: 20 }} />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {availableTags?.map((tag: any) => (
                                <MenuItem key={tag.id} value={tag.id}>
                                    <Checkbox checked={filters.tags.indexOf(tag.id) > -1} size="small" />
                                    <Typography>{tag.name}</Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Outcomes Filter */}
                    {availableOutcomes && availableOutcomes.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Outcomes</InputLabel>
                            <Select
                                multiple
                                value={filters.outcomes}
                                onChange={(e) => onFilterChange.setOutcomes(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                input={<OutlinedInput label="Outcomes" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const outcome = availableOutcomes?.find((o: any) => o.id === value);
                                            return (
                                                <Chip key={value} label={outcome?.name || value} size="small" color="success" sx={{ height: 20 }} />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {availableOutcomes?.map((outcome: any) => (
                                    <MenuItem key={outcome.id} value={outcome.id}>
                                        <Checkbox checked={filters.outcomes.indexOf(outcome.id) > -1} size="small" />
                                        <Typography>{outcome.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Releases Filter */}
                    {availableReleases && availableReleases.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Releases</InputLabel>
                            <Select
                                multiple
                                value={filters.releases}
                                onChange={(e) => onFilterChange.setReleases(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                input={<OutlinedInput label="Releases" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const release = availableReleases?.find((r: any) => r.id === value);
                                            return (
                                                <Chip key={value} label={release?.name || value} size="small" color="info" sx={{ height: 20 }} />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {availableReleases?.map((release: any) => (
                                    <MenuItem key={release.id} value={release.id}>
                                        <Checkbox checked={filters.releases.indexOf(release.id) > -1} size="small" />
                                        <Typography>{release.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Licenses Filter */}
                    {availableLicenses && availableLicenses.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Licenses</InputLabel>
                            <Select
                                multiple
                                value={filters.licenses}
                                onChange={(e) => onFilterChange.setLicenses(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                input={<OutlinedInput label="Licenses" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const license = availableLicenses?.find((l: any) => l.id === value);
                                            return (
                                                <Chip key={value} label={license?.name || value} size="small" color="warning" sx={{ height: 20 }} />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {availableLicenses?.map((license: any) => (
                                    <MenuItem key={license.id} value={license.id}>
                                        <Checkbox checked={filters.licenses.indexOf(license.id) > -1} size="small" />
                                        <Typography>{license.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <Button size="small" onClick={onFilterChange.clearAll} variant="outlined" color="secondary">
                            Clear All
                        </Button>
                    )}
                </Box>
            </Collapse>

            {/* Progress Bar Section */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Implementation Progress
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight={700}>
                        {Math.round(progress)}% Complete
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: progress === 100 ? theme.palette.success.main : theme.palette.primary.main
                        }
                    }}
                />
            </Box>

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
                                {visibleColumns.includes('updatedVia') && (
                                    <ResizableTableCell
                                        width={columnWidths['updatedVia'] || 100}
                                        resizable
                                        resizeHandleProps={getResizeHandleProps('updatedVia')}
                                        isResizing={isResizing}
                                        align="center"
                                    >
                                        Updated Via
                                    </ResizableTableCell>
                                )}
                                {visibleColumns.includes('license') && (
                                    <ResizableTableCell
                                        width={columnWidths['license'] || 80}
                                        resizable
                                        resizeHandleProps={getResizeHandleProps('license')}
                                        isResizing={isResizing}
                                        align="center"
                                    >
                                        License
                                    </ResizableTableCell>
                                )}
                                {visibleColumns.includes('status') && (
                                    <ResizableTableCell
                                        width={columnWidths['status']}
                                        resizable
                                        resizeHandleProps={getResizeHandleProps('status')}
                                        isResizing={isResizing}
                                        align="left"
                                    >
                                        Status
                                    </ResizableTableCell>
                                )}
                                <TableCell width={columnWidths['actions']} align="left">Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            <SortableContext items={filteredTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                                {filteredTasks.map((task: any, index: number) => (
                                    <SortableTaskItem
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        onEdit={dialog.onOpenEdit}
                                        onDelete={actions.onDelete}
                                        onDoubleClick={dialog.onOpenEdit}
                                        onWeightChange={actions.onWeightChange}
                                        onSequenceChange={actions.onSequenceChange}
                                        onTagChange={actions.onTagChange}
                                        onStatusChange={actions.onStatusChange}
                                        availableTags={availableTags || []}
                                        disableDrag={hasActiveFilters}
                                        locked={isLocked}
                                        visibleColumns={visibleColumns}
                                    />
                                ))}
                                {filteredTasks.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4 + visibleColumns.length} sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography color="text.secondary">
                                                {hasActiveFilters ? 'No tasks match the selected filters' : 'No tasks found'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </SortableContext>
                        </TableBody>
                    </Table>
                </TableContainer>
            </DndContext>

            {/* Task Dialog */}
            <TaskDialog
                open={dialog.isOpen}
                onClose={dialog.onClose}
                title="Task Details"
                task={dialog.editingTask}
                productId={entityType === 'PRODUCT' ? entityId : undefined}
                solutionId={entityType === 'SOLUTION' ? entityId : undefined}
                onSave={actions.onSave}
                existingTasks={tasks}
                outcomes={availableOutcomes || []}
                availableLicenses={availableLicenses || []}
                availableReleases={availableReleases || []}
                availableTags={availableTags || []}
            />
        </Box>
    );
}
