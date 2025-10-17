import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';
import { List, ListItemButton, ListItemText, Box, Button, Typography, Stack, IconButton, Chip, Alert, Menu, MenuItem, Tooltip } from '@mui/material';
import { Add, Edit, DragIndicator } from '@mui/icons-material';
import { TaskDialog } from './dialogs/TaskDialog';

const TASKS = gql`query Tasks($productId:ID,$solutionId:ID,$first:Int,$after:String,$last:Int,$before:String){ 
  tasks(productId:$productId,solutionId:$solutionId,first:$first,after:$after,last:$last,before:$before){ 
    edges { 
      cursor 
      node { 
        id 
        name 
        description
        sequenceNumber
        weight
        licenseLevel
        howToDoc
        howToVideo
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
    id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo
    product { id name } outcomes { id name }
  } 
}`;
const UPDATE_TASK = gql`mutation UpdateTask($id:ID!,$input:TaskInput!){ 
  updateTask(id:$id,input:$input){ 
    id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo
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
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  
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
    console.log('�🚨🚨 TasksPanel.handleSave called!');
    console.log('�🔍 TasksPanel handleSave received data:', JSON.stringify(data, null, 2));
    const input = {
      ...data,
      ...(productId ? { productId } : { solutionId })
    };
    console.log('🔍 TasksPanel about to send input to GraphQL:', JSON.stringify(input, null, 2));
    console.log('🔍 TasksPanel input.howToDoc:', input.howToDoc);
    console.log('🔍 TasksPanel input.howToVideo:', input.howToVideo);
    console.log('🔍 TasksPanel input.notes:', input.notes);
    
    try {
      if (editingTask) {
        console.log('🔄 Calling updateTask mutation...');
        const result = await updateTask({ variables: { id: editingTask.id, input } });
        console.log('✅ updateTask completed:', result);
      } else {
        console.log('🚀 Calling createTask mutation...');
        const result = await createTask({ variables: { input } });
        console.log('✅ createTask completed:', result);
        console.log('✅ createTask result data:', result.data);
      }
    } catch (error) {
      console.error('💥 GraphQL mutation failed:', error);
      throw error;
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

    {/* Column Headers - Using ListItemButton for perfect alignment */}
    {tasks.length > 0 && (
      <ListItemButton
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#f5f5f5',
          mb: 1,
          cursor: 'default',
          '&:hover': {
            backgroundColor: '#f5f5f5'
          }
        }}
        disableRipple
      >
        <Box sx={{ minWidth: '32px', mr: 1 }}>
          {/* Empty space for drag handle */}
        </Box>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Sequence number */}
              <Box sx={{ minWidth: '56px', flexShrink: 0 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">#</Typography>
              </Box>
              
              {/* Task name with howTo */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">Task Name & How-To</Typography>
              </Box>
              
              {/* Weight */}
              <Box sx={{ minWidth: '105px', flexShrink: 0 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">Weight (%)</Typography>
              </Box>
              
              {/* Edit button space */}
              <Box sx={{ minWidth: '40px' }}></Box>
            </Box>
          }
        />
      </ListItemButton>
    )}

    <List dense sx={{ 
      bgcolor: 'background.paper',
      borderRadius: '8px',
      padding: '8px',
      '& .MuiListItemButton-root': {
        marginBottom: '4px',
        '&:last-child': {
          marginBottom: 0
        }
      }
    }}>
      {tasks.map((task: any) => (
        <Tooltip 
          key={task.id}
          title={task.description || 'No description available'}
          arrow
          placement="right"
          enterDelay={500}
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                fontSize: '0.875rem',
                maxWidth: '400px',
                padding: '12px 16px',
                '& .MuiTooltip-arrow': {
                  color: 'rgba(0, 0, 0, 0.9)',
                }
              }
            }
          }}
        >
          <ListItemButton
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
              borderRadius: '8px',
              marginBottom: '4px',
              transition: 'all 0.2s ease-in-out',
              userSelect: 'none', // Prevent text selection
              WebkitUserSelect: 'none', // Safari
              MozUserSelect: 'none', // Firefox
              msUserSelect: 'none', // IE/Edge
              touchAction: 'none', // Prevent scrolling during touch
              '&:hover': {
                backgroundColor: draggedTask && draggedTask !== task.id ? 'action.selected' : 'rgba(25, 118, 210, 0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                {/* Sequence number - fixed width */}
                <Box sx={{ minWidth: '56px', flexShrink: 0 }}>
                  {task.sequenceNumber && (
                    <Chip
                      size="small"
                      label={`#${task.sequenceNumber}`}
                      color="secondary"
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  )}
                </Box>
                
                {/* Task name with howTo chips - flexible width */}
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'text.primary'
                  }}>
                    {task.name}
                  </Typography>
                  
                  {/* How-to chips inline with task name */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {task.howToDoc && task.howToDoc.length > 0 && (
                      <Chip
                        size="small"
                        label={`Doc${task.howToDoc.length > 1 ? ` (${task.howToDoc.length})` : ''}`}
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.65rem', 
                          height: '20px',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'primary.light' }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (task.howToDoc.length === 1) {
                            window.open(task.howToDoc[0], '_blank');
                          } else {
                            setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc });
                          }
                        }}
                        title={task.howToDoc.length === 1 ? "How-to Documentation" : `${task.howToDoc.length} Documentation Links - Click to choose`}
                      />
                    )}
                    
                    {task.howToVideo && task.howToVideo.length > 0 && (
                      <Chip
                        size="small"
                        label={`Video${task.howToVideo.length > 1 ? ` (${task.howToVideo.length})` : ''}`}
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.65rem', 
                          height: '20px',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'primary.light' }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (task.howToVideo.length === 1) {
                            window.open(task.howToVideo[0], '_blank');
                          } else {
                            setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo });
                          }
                        }}
                        title={task.howToVideo.length === 1 ? "How-to Video" : `${task.howToVideo.length} Video Links - Click to choose`}
                      />
                    )}
                  </Box>
                </Box>
                
                {/* Weight - fixed width, editable */}
                <Box sx={{ minWidth: '105px', flexShrink: 0 }}>
                  <input
                    key={`weight-${task.id}-${task.weight}`}
                    type="number"
                    defaultValue={task.weight || 0}
                    onBlur={(e) => {
                      e.stopPropagation();
                      const newWeight = parseFloat(e.target.value) || 0;
                      if (newWeight >= 0 && newWeight <= 100) {
                        // Only update if weight changed
                        if (Math.abs(newWeight - task.weight) > 0.001) {
                          updateTask({
                            variables: {
                              id: task.id,
                              input: {
                                name: task.name,
                                weight: newWeight
                              }
                            }
                          }).then(() => {
                            console.log(`✅ Weight updated for task ${task.name}: ${task.weight} → ${newWeight}`);
                          }).catch((err) => {
                            console.error('❌ Failed to update weight:', err);
                          });
                        }
                      } else {
                        // Reset to original value if invalid
                        e.target.value = task.weight.toString();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur(); // Trigger save on Enter
                      }
                      if (e.key === 'Escape') {
                        e.currentTarget.value = task.weight.toString(); // Reset on Escape
                        e.currentTarget.blur();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => {
                      e.stopPropagation();
                      e.target.select();
                    }}
                    step="0.01"
                    min="0"
                    max="100"
                    className="weight-input-spinner"
                    style={{
                      width: '85px',
                      padding: '4px 8px',
                      border: '1px solid #1976d2',
                      borderRadius: '16px',
                      textAlign: 'center',
                      fontSize: '0.8125rem',
                      fontWeight: 'bold',
                      color: '#1976d2',
                      backgroundColor: 'transparent',
                      cursor: 'text'
                    }}
                    title="Click to edit weight (0-100), press Enter to save"
                  />
                </Box>
                
                {/* Edit button */}
                <Box sx={{ minWidth: '40px', flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={(ev) => { ev.stopPropagation(); openEditDialog(task); }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            }
          />
        </ListItemButton>
        </Tooltip>
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

    {/* Documentation Links Menu */}
    <Menu
      anchorEl={docMenuAnchor?.el}
      open={Boolean(docMenuAnchor)}
      onClose={() => setDocMenuAnchor(null)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: '1 !important' }}>
        Documentation Links:
      </MenuItem>
      {docMenuAnchor?.links.map((link, index) => (
        <MenuItem
          key={index}
          onClick={() => {
            window.open(link, '_blank');
            setDocMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem' }}
        >
          {link.length > 50 ? `${link.substring(0, 50)}...` : link}
        </MenuItem>
      ))}
      <MenuItem
        onClick={() => {
          docMenuAnchor?.links.forEach((link) => window.open(link, '_blank'));
          setDocMenuAnchor(null);
        }}
        sx={{ fontSize: '0.875rem', fontWeight: 'bold', borderTop: '1px solid #ddd' }}
      >
        Open All ({docMenuAnchor?.links.length})
      </MenuItem>
    </Menu>

    {/* Video Links Menu */}
    <Menu
      anchorEl={videoMenuAnchor?.el}
      open={Boolean(videoMenuAnchor)}
      onClose={() => setVideoMenuAnchor(null)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: '1 !important' }}>
        Video Links:
      </MenuItem>
      {videoMenuAnchor?.links.map((link, index) => (
        <MenuItem
          key={index}
          onClick={() => {
            window.open(link, '_blank');
            setVideoMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem' }}
        >
          {link.length > 50 ? `${link.substring(0, 50)}...` : link}
        </MenuItem>
      ))}
      <MenuItem
        onClick={() => {
          videoMenuAnchor?.links.forEach((link) => window.open(link, '_blank'));
          setVideoMenuAnchor(null);
        }}
        sx={{ fontSize: '0.875rem', fontWeight: 'bold', borderTop: '1px solid #ddd' }}
      >
        Open All ({videoMenuAnchor?.links.length})
      </MenuItem>
    </Menu>
  </Box>;
};
