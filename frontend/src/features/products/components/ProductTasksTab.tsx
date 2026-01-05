import React from 'react';
import { useTheme } from '@mui/material/styles';
import { useApolloClient } from '@apollo/client';
import { useProductContext } from '../context/ProductContext';
import { arrayMove } from '@dnd-kit/sortable';
import { REORDER_TASKS, UPDATE_TASK, CREATE_TASK, DELETE_TASK } from '@features/tasks';
import { TasksTabContent } from '@features/tasks/components/TasksTabContent';

export function ProductTasksTab() {
    const theme = useTheme();
    const client = useApolloClient();

    const {
        selectedProductId,
        selectedProduct,
        tasks,
        filteredTasks,
        loadingTasks,
        visibleColumns,
        handleToggleColumn,
        isTasksLocked,
        // Filters
        taskTagFilter, setTaskTagFilter,
        taskOutcomeFilter, setTaskOutcomeFilter,
        taskReleaseFilter, setTaskReleaseFilter,
        taskLicenseFilter, setTaskLicenseFilter,
        showFilters, setShowFilters,
        handleClearFilters,
        // Task Dialog (from context - shared state)
        isTaskDialogOpen,
        editingTask,
        openAddTask,
        openEditTask,
        closeTaskDialog
    } = useProductContext();

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
                input.productId = selectedProductId;
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
                    refetchQueries: ['ProductTasks'],
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
                refetchQueries: ['ProductTasks'],
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
                variables: { productId: selectedProductId, order: newOrder },
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

    return (
        <TasksTabContent
            loading={loadingTasks}
            tasks={tasks}
            filteredTasks={filteredTasks}
            entityId={selectedProductId || ''}
            entityType="PRODUCT"
            isLocked={isTasksLocked}
            tableId="products-tasks-table"
            availableTags={selectedProduct?.tags || []}
            availableOutcomes={selectedProduct?.outcomes || []}
            availableReleases={selectedProduct?.releases || []}
            availableLicenses={selectedProduct?.licenses || []}
            filters={{
                tags: taskTagFilter,
                outcomes: taskOutcomeFilter,
                releases: taskReleaseFilter,
                licenses: taskLicenseFilter,
                show: showFilters
            }}
            onFilterChange={{
                setTags: setTaskTagFilter,
                setOutcomes: setTaskOutcomeFilter,
                setReleases: setTaskReleaseFilter,
                setLicenses: setTaskLicenseFilter,
                clearAll: handleClearFilters
            }}
            visibleColumns={visibleColumns}
            dialog={{
                isOpen: isTaskDialogOpen,
                editingTask: editingTask,
                onOpenAdd: openAddTask,
                onOpenEdit: openEditTask,
                onClose: closeTaskDialog
            }}
            actions={{
                onSave: handleSaveTask,
                onDelete: handleDeleteTask,
                onReorder: async (newOrder) => {
                    await client.mutate({
                        mutation: REORDER_TASKS,
                        variables: { productId: selectedProductId, order: newOrder },
                        refetchQueries: ['ProductTasks'],
                        awaitRefetchQueries: true
                    });
                },
                onWeightChange: handleWeightChange,
                onSequenceChange: handleSequenceChange,
                onTagChange: handleTagChange
            }}
        />
    );
}
