import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useMutation, useApolloClient } from '@apollo/client';
import { arrayMove } from '@dnd-kit/sortable';
import { TasksTabContent } from '@features/tasks/components/TasksTabContent';
import {
    UPDATE_PERSONAL_TASK,
    DELETE_PERSONAL_TASK,
    REORDER_PERSONAL_TASKS,
    CREATE_PERSONAL_TASK
} from '../graphql/personal-sandbox';

interface PersonalProductTasksTabProps {
    product: any;
    tasks: any[];
    loading: boolean;
    refetch: () => void;
    // Lifted UI State
    isLocked: boolean;
    showFilters: boolean;
    visibleColumns: string[];
    // Filters
    filters: {
        tags: string[];
        outcomes: string[];
        releases: string[];
        licenses: string[];
    };
    onFilterChange: {
        setTags: (v: string[]) => void;
        setOutcomes: (v: string[]) => void;
        setReleases: (v: string[]) => void;
        setLicenses: (v: string[]) => void;
    };
}

export const PersonalProductTasksTab = forwardRef<any, PersonalProductTasksTabProps>(({
    product,
    tasks,
    loading,
    refetch,
    isLocked,
    showFilters,
    visibleColumns,
    filters,
    onFilterChange
}, ref) => {
    const client = useApolloClient();

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    useImperativeHandle(ref, () => ({
        triggerAdd: () => {
            setEditingTask(null);
            setIsDialogOpen(true);
        }
    }));

    // Filter Logic
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        return tasks.filter(task => {
            if (filters.tags.length > 0) {
                const taskTagIds = task.tags?.map((t: any) => t.id) || [];
                if (!taskTagIds.some((id: string) => filters.tags.includes(id))) return false;
            }
            if (filters.outcomes.length > 0) {
                const taskOutcomeIds = task.outcomes?.map((o: any) => o.id) || [];
                // If task has NO outcomes, it applies to ALL outcomes -> include it
                if (taskOutcomeIds.length > 0 && !taskOutcomeIds.some((id: string) => filters.outcomes.includes(id))) return false;
            }
            if (filters.releases.length > 0) {
                const taskReleaseIds = task.releases?.map((r: any) => r.id) || [];
                // If task has NO releases, it applies to ALL releases -> include it
                if (taskReleaseIds.length > 0 && !taskReleaseIds.some((id: string) => filters.releases.includes(id))) return false;
            }
            if (filters.licenses.length > 0) {
                // PersonalTask doesn't have license field yet in schema (only Outcomes/Releases/Tags)
                // For now skip filtering by license or handle if schema updated.
            }
            return true;
        }).sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
    }, [tasks, filters]);

    const progress = useMemo(() => {
        if (!tasks || tasks.length === 0) return 0;
        const completed = tasks.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length;
        return (completed / tasks.length) * 100;
    }, [tasks]);

    // Mutations
    const [updateTask] = useMutation(UPDATE_PERSONAL_TASK);
    const [deleteTask] = useMutation(DELETE_PERSONAL_TASK);
    const [createTask] = useMutation(CREATE_PERSONAL_TASK);
    const [reorderTasks] = useMutation(REORDER_PERSONAL_TASKS);

    // Handlers
    const handleStatusChange = async (taskId: string, status: string, statusNotes?: string) => {
        try {
            await updateTask({
                variables: {
                    id: taskId,
                    input: { status, statusNotes }
                }
            });
            refetch();
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        }
    };

    const handleSaveTask = async (taskData: any) => {
        try {
            const input: any = {
                name: taskData.name,
                description: taskData.description,
                estMinutes: taskData.estMinutes,
                weight: taskData.weight,
                howToDoc: taskData.howToDoc,
                howToVideo: taskData.howToVideo,
                outcomeIds: taskData.outcomeIds,
                releaseIds: taskData.releaseIds,
                tagIds: taskData.tagIds || (taskData.tags?.map((t: any) => t.id || t) || [])
            };

            if (editingTask) {
                await updateTask({
                    variables: { id: editingTask.id, input }
                });
            } else {
                input.personalProductId = product.id;
                await createTask({
                    variables: { input }
                });
            }
            setIsDialogOpen(false);
            setEditingTask(null);
            refetch();
        } catch (error) {
            console.error(error);
            alert('Failed to save task');
        }
    };

    const handleDelete = async (taskId: string) => {
        if (confirm('Delete task?')) {
            await deleteTask({ variables: { id: taskId } });
            refetch();
        }
    };

    const handleReorder = async (newOrder: string[]) => {
        await reorderTasks({
            variables: {
                personalProductId: product.id,
                taskIds: newOrder
            }
        });
        refetch();
    };

    const handleSequenceChange = async (taskId: string, taskName: string, newSeq: number) => {
        const currentOrder = tasks.map(t => t.id); // Use full tasks list for reorder baseline
        const currentIndex = currentOrder.indexOf(taskId);
        if (currentIndex === -1) return;

        const nextOrder = [...currentOrder];
        nextOrder.splice(currentIndex, 1);
        const targetIndex = Math.min(Math.max(0, newSeq - 1), nextOrder.length);
        nextOrder.splice(targetIndex, 0, taskId);

        await handleReorder(nextOrder);
    };

    const handleTagChange = async (taskId: string, newTagIds: string[]) => {
        try {
            const uniqueTags = [...new Set(newTagIds)];
            await updateTask({
                variables: {
                    id: taskId,
                    input: { tagIds: uniqueTags }
                }
            });
            refetch();
        } catch (error: any) {
            console.error(error);
            alert(`Failed to update tags: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <TasksTabContent
            loading={loading}
            tasks={tasks || []}
            filteredTasks={filteredTasks}
            entityId={product?.id}
            entityType="PRODUCT"
            isLocked={isLocked}
            progress={progress}
            tableId="personal-tasks-table"
            availableTags={product?.tags || []}
            availableOutcomes={product?.outcomes || []}
            availableReleases={product?.releases || []}
            availableLicenses={product?.licenses || []}
            filters={{
                ...filters,
                show: showFilters
            }}
            onFilterChange={{
                ...onFilterChange,
                clearAll: () => {
                    onFilterChange.setTags([]);
                    onFilterChange.setOutcomes([]);
                    onFilterChange.setReleases([]);
                    onFilterChange.setLicenses([]);
                }
            }}
            visibleColumns={visibleColumns}
            dialog={{
                isOpen: isDialogOpen,
                editingTask: editingTask,
                onOpenAdd: () => { setEditingTask(null); setIsDialogOpen(true); },
                onOpenEdit: (task) => { setEditingTask(task); setIsDialogOpen(true); },
                onClose: () => { setIsDialogOpen(false); setEditingTask(null); }
            }}
            actions={{
                onSave: handleSaveTask,
                onDelete: handleDelete,
                onReorder: handleReorder,
                onWeightChange: async (id, name, weight) => {
                    await updateTask({ variables: { id, input: { weight } } });
                    refetch();
                },
                onSequenceChange: handleSequenceChange,
                onTagChange: handleTagChange,
                onStatusChange: handleStatusChange
            }}
        />
    );
});
