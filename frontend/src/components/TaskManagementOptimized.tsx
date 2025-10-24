import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  DragIndicator,
  Article,
  OndemandVideo
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasksForProduct } from '../hooks/useProducts';
import { TaskDialog } from './dialogs/TaskDialog';
import { useApolloClient } from '@apollo/client';
import { DELETE_TASK, REORDER_TASKS, PROCESS_DELETION_QUEUE } from '../graphql/mutations';

interface TaskManagementOptimizedProps {
  productId: string;
  productLicenses: any[];
  productOutcomes: any[];
  productReleases: any[];
}

function SortableTaskItem({ task, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ListItem
        divider
        secondaryAction={
          <Box display="flex" gap={1}>
            {task.howToDoc && task.howToDoc.length > 0 && (
              <Tooltip title={`Documentation (${task.howToDoc.length} links)`}>
                <IconButton size="small">
                  <Article />
                </IconButton>
              </Tooltip>
            )}
            {task.howToVideo && task.howToVideo.length > 0 && (
              <Tooltip title={`Videos (${task.howToVideo.length} links)`}>
                <IconButton size="small">
                  <OndemandVideo />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Edit Task">
              <IconButton size="small" onClick={() => onEdit(task)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Task">
              <IconButton size="small" color="error" onClick={() => onDelete(task.id)}>
                <Delete />
              </IconButton>
            </Tooltip>
            <Box {...listeners} sx={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
              <DragIndicator />
            </Box>
          </Box>
        }
      >
        <Box width="100%">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2">
              #{task.sequenceNumber} {task.name}
            </Typography>
            <Chip 
              label={`${task.weight}%`}
              size="small"
              color={task.weight > 20 ? 'warning' : 'default'}
            />
          </Box>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {task.description || 'No description'}
          </Typography>
          
          <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
            {task.license && (
              <Chip 
                label={`${task.license.name} (L${task.license.level})`}
                size="small"
                variant="outlined"
              />
            )}
            
            {task.outcomes?.map((outcome: any) => (
              <Chip 
                key={outcome.id}
                label={outcome.name}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
            
            {task.releases?.map((release: any) => (
              <Chip 
                key={release.id}
                label={`v${release.level}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>

          {task.telemetryAttributes && task.telemetryAttributes.length > 0 && (
            <Box mt={1}>
              <Typography variant="caption" color="textSecondary">
                Telemetry: {task.telemetryCompletionPercentage || 0}% complete
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={task.telemetryCompletionPercentage || 0} 
                sx={{ height: 4, mt: 0.5 }}
              />
            </Box>
          )}
        </Box>
      </ListItem>
    </div>
  );
}

export function TaskManagementOptimized({ 
  productId, 
  productLicenses, 
  productOutcomes, 
  productReleases 
}: TaskManagementOptimizedProps) {
  const client = useApolloClient();
  const { tasks, loading, refetch } = useTasksForProduct(productId);
  const [addTaskDialog, setAddTaskDialog] = useState(false);
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task: any) => task.id === active.id);
      const newIndex = tasks.findIndex((task: any) => task.id === over.id);
      
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      const taskIds = newTasks.map((task: any) => task.id);

      try {
        await client.mutate({
          mutation: REORDER_TASKS,
          variables: {
            productId,
            order: taskIds
          },
          refetchQueries: ['TasksForProduct'],
          awaitRefetchQueries: true
        });
      } catch (error) {
        console.error('Error reordering tasks:', error);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await client.mutate({
        mutation: DELETE_TASK,
        variables: { id: taskId },
        refetchQueries: ['TasksForProduct'],
        awaitRefetchQueries: true
      });

      // Process deletion queue
      await client.mutate({
        mutation: PROCESS_DELETION_QUEUE
      });

      alert('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setEditTaskDialog(true);
  };

  if (loading) return <div>Loading tasks...</div>;

  if (!productId) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Select a product to view tasks
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddTaskDialog(true)}
        >
          Add Task
        </Button>
      </Box>

      <Paper>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tasks.map((task: any) => task.id)} strategy={verticalListSortingStrategy}>
            <List>
              {tasks.map((task: any) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>

        {tasks.length === 0 && (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              No tasks found. Add your first task to get started.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Task Dialogs */}
      <TaskDialog
        open={addTaskDialog}
        onClose={() => setAddTaskDialog(false)}
        onSave={async () => {
          await refetch();
          setAddTaskDialog(false);
        }}
        productId={productId}
        availableLicenses={productLicenses}
        outcomes={productOutcomes}
        releases={productReleases}
      />

      <TaskDialog
        open={editTaskDialog}
        onClose={() => {
          setEditTaskDialog(false);
          setEditingTask(null);
        }}
        onSave={async () => {
          await refetch();
          setEditTaskDialog(false);
          setEditingTask(null);
        }}
        task={editingTask}
        productId={productId}
        availableLicenses={productLicenses}
        outcomes={productOutcomes}
        releases={productReleases}
      />
    </Box>
  );
}
