import * as React from 'react';
import { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { 
  CheckCircle, 
  Schedule, 
  DragIndicator,
  Edit 
} from '@mui/icons-material';

interface Props {
  tasks: any[];
  selectedTask: string;
  onTaskSelect: (taskId: string) => void;
  onTaskDoubleClick: (task: any) => void;
  showProductName?: boolean;
  title?: string;
}

export const TaskList: React.FC<Props> = ({ 
  tasks, 
  selectedTask, 
  onTaskSelect, 
  onTaskDoubleClick,
  showProductName = false,
  title = "Tasks"
}) => {
  const [editingTask, setEditingTask] = useState<any>(null);

  const getStatusColor = (task: any) => {
    if (task.completedAt) return 'success';
    switch (task.status?.toLowerCase()) {
      case 'active': case 'in-progress': return 'primary';
      case 'pending': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (task: any) => {
    if (task.completedAt) return <CheckCircle color="success" />;
    return <Schedule color="action" />;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleTaskEdit = (task: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingTask(task);
  };

  const handleTaskSave = async () => {
    setEditingTask(null);
    // Refresh will be handled by parent component
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title} ({tasks.length})
      </Typography>
      
      <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
        <List dense>
          {tasks.map((task: any, index: number) => {
            const isSelected = task.id === selectedTask;
            
            return (
              <ListItemButton
                key={task.id}
                selected={isSelected}
                onClick={() => onTaskSelect(task.id)}
                onDoubleClick={() => onTaskDoubleClick(task)}
                sx={{ 
                  '&:hover .action-buttons': { opacity: 1 },
                  borderLeft: isSelected ? 3 : 0,
                  borderLeftColor: 'primary.main',
                  pl: isSelected ? 1 : 2
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      {/* Left side: Sequence number and task name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                        {task.sequenceNumber && (
                          <Chip
                            size="small"
                            label={`#${task.sequenceNumber}`}
                            color="secondary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold', minWidth: '48px' }}
                          />
                        )}
                        <Typography variant="body2" fontWeight="medium" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {task.name}
                        </Typography>
                      </Box>
                      
                      {/* Right side: Weight and How-to links */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        {/* Weight */}
                        <Chip
                          size="small"
                          label={`${task.weight}%`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                        
                        {/* How-to links - compact */}
                        {task.howToDoc && (
                          <Chip
                            size="small"
                            label="📖"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: '20px', 
                              minWidth: '28px',
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'primary.light' }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(task.howToDoc, '_blank');
                            }}
                            title="How-to Documentation"
                          />
                        )}
                        {task.howToVideo && (
                          <Chip
                            size="small"
                            label="🎥"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: '20px', 
                              minWidth: '28px',
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'primary.light' }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(task.howToVideo, '_blank');
                            }}
                            title="How-to Video"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                  secondary={
                    showProductName && task.productName ? (
                      <Chip 
                        label={task.productName}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 16, mt: 0.5 }}
                      />
                    ) : undefined
                  }
                />
                <ListItemSecondaryAction>
                  <Box 
                    className="action-buttons"
                    sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.5 }}
                  >
                    <Tooltip title="Edit Task (Double-click)">
                      <IconButton
                        size="small"
                        onClick={(e) => handleTaskEdit(task, e)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <DragIndicator color="action" sx={{ cursor: 'grab' }} />
                  </Box>
                </ListItemSecondaryAction>
              </ListItemButton>
            );
          })}
          
          {tasks.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No tasks found
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

            {editingTask && (
        <Dialog
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Task: {editingTask.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Task editing functionality will be available when integrated with the main task management system.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Current task: {editingTask.name}
              </Typography>
              <Typography variant="body2">
                Status: {editingTask.status || 'No status'}
              </Typography>
              <Typography variant="body2">
                Description: {editingTask.description || 'No description'}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingTask(null)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
