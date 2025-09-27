import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';
import { List, ListItemButton, ListItemText, Box, Button, Typography, Stack, IconButton, Chip, Alert } from '@mui/material';
import { Add, Edit, DragIndicator } from '@mui/icons-material';
import { TaskDialog } from './dialogs/TaskDialog';

const TASKS = gql`query Tasks($productId:ID,$solutionId:ID,$first:Int,$after:String,$last:Int,$before:String){ 
  tasks(productId:$productId,solutionId:$solutionId,first:$first,after:$after,last:$last,before:$before){ 
    edges { 
      cursor 
      node { 
        id 
        name 
        weight 
        estMinutes 
        description 
        notes 
        sequenceNumber
        licenseLevel
        priority
        product { id name }
        solution { id name }
        outcomes { id name }
      } 
    } 
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor } 
  } 
}`;
const OUTCOMES = gql`
  query Outcomes($productId: ID) {
    outcomes(productId: $productId) {
      id
      name
      description
      product {
        id
        name
      }
    }
  }
`;
const TASK_UPDATED = gql`subscription { taskUpdated { id name product { id } weight priority } }`;
const CREATE_TASK = gql`mutation CreateTask($input:TaskInput!){ 
  createTask(input:$input){ 
    id name description estMinutes weight notes priority licenseLevel 
    product { id name } outcomes { id name }
  } 
}`;
const UPDATE_TASK = gql`mutation UpdateTask($id:ID!,$input:TaskInput!){ 
  updateTask(id:$id,input:$input){ 
    id name description estMinutes weight notes priority licenseLevel 
    product { id name } outcomes { id name }
  } 
}`;
const REORDER_TASKS = gql`mutation ReorderTasks($productId:ID!,$order:[ID!]!){ reorderTasks(productId:$productId,order:$order) }`;

interface Props {
  productId?: string;
  solutionId?: string;
  onSelect: (id: string) => void
}
export const TasksPanel: React.FC<Props> = ({ productId, solutionId, onSelect }) => {
  const [args, setArgs] = useState<{ first?: number; after?: string | null; last?: number; before?: string | null }>({ first: 50 });
  const { data, refetch } = useQuery(TASKS, {
    variables: { productId, solutionId, ...args },
    skip: !productId && !solutionId
  });
  const { data: outcomesData } = useQuery(OUTCOMES, {
    variables: { productId },
    skip: !productId
  });
  const [createTask] = useMutation(CREATE_TASK, { onCompleted: () => refetch() });
  const [updateTask] = useMutation(UPDATE_TASK, { onCompleted: () => refetch() });
  const [reorderTasks] = useMutation(REORDER_TASKS, { onCompleted: () => refetch() });
  useSubscription(TASK_UPDATED, {
    onData: ({ data: sub }) => {
      const taskUpdated = sub.data?.taskUpdated;
      if (taskUpdated && (
        (productId && taskUpdated.product?.id === productId) ||
        (solutionId && taskUpdated.solution?.id === solutionId)
      )) {
        refetch();
      }
    }
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverTask, setDragOverTask] = useState<string | null>(null);

  const conn = data?.tasks;
  const tasks = conn?.edges.map((e: any) => e.node) || [];
  const outcomes = outcomesData?.outcomes || [];

  // Calculate total weight and validation
  const totalWeight = tasks.reduce((sum: number, task: any) => sum + (task.weight || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01; // Allow small floating point differences

  const openCreateDialog = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const openEditDialog = (task: any) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    const input = {
      ...data,
      ...(productId ? { productId } : { solutionId })
    };
    if (editingTask) {
      await updateTask({ variables: { id: editingTask.id, input } });
    } else {
      await createTask({ variables: { input } });
    }
  };

  // Task completion removed in simplified schema
  // const handleMarkDone = async (id: string) => {
  //   const reason = prompt('Completion reason (optional):') || '';
  //   await markTaskDone({ variables: { id, reason } });
  // };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    console.log('🚀 Drag started for task:', taskId);
    console.log('🚀 Event details:', e);
    console.log('🚀 DataTransfer available:', !!e.dataTransfer);
    setDraggedTask(taskId);
    setDragOverTask(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);

    // Add visual feedback to dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    console.log('🎯 Drag over task:', taskId, 'dragged:', draggedTask);
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTask && taskId !== draggedTask) {
      setDragOverTask(taskId);
    }
  };

  const handleDragEnter = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTask && taskId !== draggedTask) {
      setDragOverTask(taskId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear dragOverTask if we're really leaving the drop zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverTask(null);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag ended');
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    console.log('💫 Drop event:', { draggedTask, targetTaskId });
    console.log('💫 Event details:', e);
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask || draggedTask === targetTaskId) {
      console.log('💫 Invalid drop - same task or no dragged task');
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    // Only allow reordering for products, not solutions (backend limitation)
    if (!productId) {
      console.warn('💫 Reordering is only supported for product tasks');
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    const taskIds = tasks.map((t: any) => t.id);
    const draggedIndex = taskIds.indexOf(draggedTask);
    const targetIndex = taskIds.indexOf(targetTaskId);

    console.log('💫 Drag indices:', { draggedIndex, targetIndex, taskIds });

    if (draggedIndex === -1 || targetIndex === -1) {
      console.log('💫 Invalid indices');
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    // Reorder array
    const newOrder = [...taskIds];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTask);

    console.log('💫 Reordering tasks:', { from: draggedIndex, to: targetIndex, newOrder });

    reorderTasks({
      variables: {
        productId: productId,
        order: newOrder
      }
    }).then(() => {
      console.log('💫 Reorder completed successfully');
    }).catch((error) => {
      console.error('💫 Reorder failed:', error);
    });

    setDraggedTask(null);
    setDragOverTask(null);
  };
  return <Box>
    <Typography variant="subtitle2" sx={{ pl: 1, pt: 1 }}>Tasks</Typography>

    {totalWeight !== 0 && (
      <Alert
        severity={isWeightValid ? 'success' : 'warning'}
        sx={{ mx: 1, mb: 1 }}
      >
        Total weight: {totalWeight.toFixed(1)}%
        {!isWeightValid && ` (should be 100%)`}
      </Alert>
    )}

    <Stack direction="row" spacing={1} px={1} pb={1}>
      <Button size="small" startIcon={<Add />} onClick={openCreateDialog}>Add Task</Button>
      {productId && (
        <Button
          size="small"
          variant="outlined"
          onClick={async () => {
            console.log('Testing reorder: Moving first task to last position');
            const taskIds = tasks.map((t: any) => t.id);
            if (taskIds.length >= 2) {
              const reorderedIds = [...taskIds.slice(1), taskIds[0]]; // Move first to last
              try {
                await reorderTasks({ variables: { productId, order: reorderedIds } });
                console.log('Test reorder completed');
              } catch (error) {
                console.error('Test reorder failed:', error);
              }
            }
          }}
        >
          Test Reorder
        </Button>
      )}
      {!productId && (
        <Typography variant="caption" color="text.secondary">
          Note: Drag & drop reordering is only available for product tasks
        </Typography>
      )}
    </Stack>

    <List dense>
      {tasks.map((task: any) => (
        <ListItemButton
          key={task.id}
          onClick={(e) => {
            // Only handle click if not dragging
            if (!draggedTask) {
              onSelect(task.id);
            }
          }}
          onMouseDown={(e) => {
            // Prevent text selection during drag
            if (productId) {
              e.preventDefault();
            }
          }}
          onTouchStart={(e) => {
            // Support for touch devices
            if (productId) {
              console.log('🔵 Touch start for task:', task.id);
            }
          }}
          draggable={!!productId} // Only enable drag for products
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={(e) => handleDragOver(e, task.id)}
          onDragEnter={(e) => handleDragEnter(e, task.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, task.id)}
          onDragEnd={handleDragEnd}
          sx={{
            opacity: draggedTask === task.id ? 0.5 : 1,
            cursor: productId ? 'grab' : 'default',
            '&:active': { cursor: productId ? 'grabbing' : 'default' },
            backgroundColor: dragOverTask === task.id ? 'action.hover' : 'inherit',
            border: dragOverTask === task.id ? '2px solid #1976d2' : '2px solid transparent',
            transition: 'all 0.2s ease-in-out',
            userSelect: 'none', // Prevent text selection
            WebkitUserSelect: 'none', // Safari
            MozUserSelect: 'none', // Firefox
            msUserSelect: 'none', // IE/Edge
            touchAction: 'none', // Prevent scrolling during touch
            '&:hover': {
              backgroundColor: draggedTask && draggedTask !== task.id ? 'action.selected' : 'action.hover'
            },
            // Additional styling for drag indication
            '&[draggable="true"]': {
              cursor: 'grab',
            },
            '&[draggable="true"]:active': {
              cursor: 'grabbing',
            }
          }}
        >
          <DragIndicator
            sx={{
              mr: 1,
              color: productId ? 'text.secondary' : 'text.disabled',
              cursor: productId ? 'grab' : 'not-allowed'
            }}
          />
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={`#${task.sequenceNumber || '?'}`}
                  color="secondary"
                  variant="filled"
                  sx={{
                    fontWeight: 'bold',
                    minWidth: '40px',
                    '& .MuiChip-label': { fontSize: '0.75rem', fontWeight: 'bold' }
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
                  {task.name}
                </Typography>
                <Chip
                  size="small"
                  label={`${task.weight}%`}
                  color={task.weight > 0 ? 'primary' : 'default'}
                />
                <Chip
                  size="small"
                  label={`${task.estMinutes}m`}
                  variant="outlined"
                />
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Chip
                  size="small"
                  label={task.priority || 'Medium'}
                  color={task.priority === 'High' ? 'error' : task.priority === 'Low' ? 'default' : 'primary'}
                />
                <IconButton
                  size="small"
                  onClick={(ev) => { ev.stopPropagation(); openEditDialog(task); }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                {/* Done button removed in simplified schema */}
                {/* <IconButton
                  size="small"
                  onClick={(ev) => { ev.stopPropagation(); handleMarkDone(task.id); }}
                  color="success"
                >
                  <Done fontSize="small" />
                </IconButton> */}
              </Box>
            }
          />
        </ListItemButton>
      ))}
    </List>

    <Box display="flex" justifyContent="space-between" px={1} pb={1}>
      <Button size="small" disabled={!conn?.pageInfo.hasPreviousPage} onClick={() => setArgs({ last: 50, before: conn.pageInfo.startCursor })}>Previous</Button>
      <Button size="small" disabled={!conn?.pageInfo.hasNextPage} onClick={() => setArgs({ first: 50, after: conn.pageInfo.endCursor })}>Next</Button>
    </Box>

    <TaskDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onSave={handleSave}
      task={editingTask}
      title={editingTask ? 'Edit Task' : 'Create Task'}
      productId={productId}
      solutionId={solutionId}
      existingTasks={tasks}
      outcomes={outcomes}
    />
  </Box>;
};
