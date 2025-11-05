import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Collapse,
  IconButton,
  LinearProgress,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  HourglassEmpty,
  NotInterested,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface SolutionTasksGroupProps {
  progress: number;
  totalTasks: number;
  completedTasks: number;
  tasks: Array<{
    id: string;
    name: string;
    description?: string;
    notes?: string;
    status: string;
    weight: number;
    sequenceNumber: number;
    statusUpdatedAt?: string;
    statusUpdatedBy?: string;
    statusUpdateSource?: string;
    statusNotes?: string;
    licenseLevel?: string;
    howToDoc?: string[];
    howToVideo?: string[];
    telemetryAttributes?: Array<{
      id: string;
      name: string;
      description?: string;
      dataType: string;
      successCriteria?: any;
      isMet?: boolean;
      values?: Array<{
        id: string;
        value: any;
        createdAt: string;
        notes?: string;
      }>;
    }>;
  }>;
  onUpdateTaskStatus?: (taskId: string, newStatus: string, notes?: string) => void;
}

interface StatusDialogState {
  open: boolean;
  taskId: string;
  taskName: string;
  currentStatus: string;
}

export const SolutionTasksGroup: React.FC<SolutionTasksGroupProps> = ({
  progress,
  totalTasks,
  completedTasks,
  tasks,
  onUpdateTaskStatus
}) => {
  const [expanded, setExpanded] = useState(false);
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    taskId: '',
    taskName: '',
    currentStatus: 'NOT_STARTED',
  });
  const [statusNotes, setStatusNotes] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
        return <CheckCircle sx={{ fontSize: '1rem' }} />;
      case 'IN_PROGRESS':
        return <HourglassEmpty sx={{ fontSize: '1rem' }} />;
      case 'BLOCKED':
      case 'NO_LONGER_USING':
        return <NotInterested sx={{ fontSize: '1rem' }} />;
      case 'NOT_STARTED':
        return <HourglassEmpty sx={{ fontSize: '1rem', opacity: 0.4 }} />;
      case 'NOT_APPLICABLE':
        return <NotInterested sx={{ fontSize: '1rem', opacity: 0.4 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string): 'success' | 'info' | 'error' | 'default' | 'warning' => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'NOT_STARTED':
        return 'default';
      case 'BLOCKED':
      case 'NO_LONGER_USING':
        return 'error';
      case 'NOT_APPLICABLE':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleStatusChange = (taskId: string, taskName: string, newStatus: string) => {
    setStatusDialog({
      open: true,
      taskId,
      taskName,
      currentStatus: newStatus,
    });
  };

  const handleStatusSave = () => {
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(statusDialog.taskId, statusDialog.currentStatus, statusNotes || undefined);
    }
    setStatusDialog({ ...statusDialog, open: false });
    setStatusNotes('');
  };

  return (
    <Paper 
      elevation={1}
      sx={{ 
        mb: 2, 
        border: '1.5px solid', 
        borderColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#F3E5F5',
          cursor: 'pointer',
          borderLeft: '4px solid',
          borderLeftColor: '#9C27B0',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: '#E1BEE7',
            boxShadow: 2
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <IconButton size="small" sx={{ color: '#7B1FA2' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#6A1B9A', fontWeight: 600 }}>
              🎯 Solution-Specific Tasks
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ flex: 1, maxWidth: 300 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ 
                      flex: 1, 
                      height: 8, 
                      borderRadius: 1,
                      bgcolor: '#E1BEE7',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#9C27B0'
                      }
                    }}
                  />
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#6A1B9A' }}>
                    {Math.round(progress)}%
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" fontWeight="500" sx={{ color: '#6A1B9A' }}>
                {completedTasks} of {totalTasks} tasks
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Collapsible Task Table */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: '#eeeeee',
                  borderBottom: '2px solid #d0d0d0'
                }}>
                  <TableCell width={60} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>#</Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200, maxWidth: 300 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Task Name</Typography>
                  </TableCell>
                  <TableCell width={140} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Resources</Typography>
                  </TableCell>
                  <TableCell width={80} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Weight</Typography>
                  </TableCell>
                  <TableCell width={130} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Status</Typography>
                  </TableCell>
                  <TableCell width={160} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Telemetry</Typography>
                  </TableCell>
                  <TableCell width={130} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Updated Via</Typography>
                  </TableCell>
                  <TableCell width={160} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No solution tasks found
            </Typography>
                    </TableCell>
                  </TableRow>
          ) : (
                  tasks.map((task) => (
                    <TableRow 
                  key={task.id}
                      hover
                      title={task.description || 'No description available'}
                  sx={{
                        cursor: 'pointer',
                        // Grey out NOT_APPLICABLE tasks
                        opacity: task.status === 'NOT_APPLICABLE' ? 0.4 : 1,
                        backgroundColor: task.status === 'NOT_APPLICABLE' ? 'rgba(0, 0, 0, 0.12)' : 'inherit',
                        color: task.status === 'NOT_APPLICABLE' ? 'text.disabled' : 'inherit',
                        textDecoration: task.status === 'NOT_APPLICABLE' ? 'line-through' : 'none',
                        '&:hover': {
                          backgroundColor: task.status === 'NOT_APPLICABLE' 
                            ? 'rgba(0, 0, 0, 0.12)'
                            : 'rgba(25, 118, 210, 0.08)',
                          boxShadow: task.status === 'NOT_APPLICABLE'
                            ? 'none'
                            : '0 2px 8px rgba(0,0,0,0.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{task.sequenceNumber}</TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {task.name}
                    </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', justifyContent: 'center' }}>
                          {/* How-to documentation links */}
                          {task.howToDoc && task.howToDoc.length > 0 && (
                            <Chip
                              size="small"
                              label={`Doc${task.howToDoc.length > 1 ? ` (${task.howToDoc.length})` : ''}`}
                              color="primary"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: '20px',
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'primary.light' }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task.howToDoc && task.howToDoc.length === 1) {
                                  window.open(task.howToDoc[0], '_blank');
                                } else if (task.howToDoc) {
                                  setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc });
                                }
                              }}
                              title={task.howToDoc.length === 1 
                                ? `Documentation: ${task.howToDoc[0]}`
                                : `Documentation (${task.howToDoc.length} links):\n${task.howToDoc.join('\n')}`
                              }
                            />
                          )}
                          {/* How-to video links */}
                          {task.howToVideo && task.howToVideo.length > 0 && (
                            <Chip
                              size="small"
                              label={`Video${task.howToVideo.length > 1 ? ` (${task.howToVideo.length})` : ''}`}
                              color="error"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: '20px',
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'error.light' }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task.howToVideo && task.howToVideo.length === 1) {
                                  window.open(task.howToVideo[0], '_blank');
                                } else if (task.howToVideo) {
                                  setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo });
                                }
                              }}
                              title={task.howToVideo.length === 1 
                                ? `Video: ${task.howToVideo[0]}`
                                : `Videos (${task.howToVideo.length} links):\n${task.howToVideo.join('\n')}`
                              }
                            />
                          )}
                          {!task.howToDoc && !task.howToVideo && (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                  </Box>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{task.weight}%</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Chip
                          icon={getStatusIcon(task.status)}
                          label={task.status.replace('_', ' ')}
                          color={getStatusColor(task.status)}
                    size="small"
                  />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalAttributes = task.telemetryAttributes?.length || 0;
                          const attributesWithValues = task.telemetryAttributes?.filter((attr) => 
                            attr.values && attr.values.length > 0
                          ).length || 0;
                          
                          const attributesWithCriteriaMet = task.telemetryAttributes?.filter((attr) => 
                            attr.isMet === true
                          ).length || 0;
                          
                          const attributesWithCriteria = task.telemetryAttributes?.filter((attr) => 
                            attr.successCriteria && attr.successCriteria !== 'No criteria'
                          ).length || 0;
                          
                          if (totalAttributes === 0) {
                            return <Typography variant="caption" color="text.secondary">-</Typography>;
                          }
                          
                          const hasData = attributesWithValues > 0;
                          const percentage = attributesWithCriteria > 0 ? Math.round((attributesWithCriteriaMet / attributesWithCriteria) * 100) : 0;
                          
                          return (
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'nowrap' }}>
                              <Tooltip 
                                title={
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Telemetry Values Filled</Typography>
                                    <Typography variant="caption" display="block">
                                      {attributesWithValues} out of {totalAttributes} telemetry attributes have imported values
                                    </Typography>
                                    {!hasData && (
                                      <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'warning.light' }}>
                                        No telemetry data imported yet
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                arrow
                              >
                                <Chip
                                  label={`${attributesWithValues}/${totalAttributes}`}
                                  size="small"
                                  color={hasData ? 'info' : 'default'}
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Tooltip>
                              {attributesWithCriteria > 0 && (
                                <Tooltip 
                                  title={
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Success Criteria Met</Typography>
                                      <Typography variant="caption" display="block">
                                        {attributesWithCriteriaMet} out of {attributesWithCriteria} success criteria are currently met
                                      </Typography>
                                      {percentage === 100 && (
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'success.light' }}>
                                          ✓ All criteria met!
                                        </Typography>
                                      )}
                                      {percentage < 100 && percentage > 0 && (
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'warning.light' }}>
                                          {percentage}% complete
                                        </Typography>
                                      )}
                                      {percentage === 0 && (
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'error.light' }}>
                                          No criteria met yet
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Chip
                                    label={`${attributesWithCriteriaMet}/${attributesWithCriteria} ✓`}
                                    size="small"
                                    color={percentage === 100 ? 'success' : percentage > 0 ? 'warning' : 'default'}
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {task.statusUpdateSource ? (
                          <Chip 
                            label={task.statusUpdateSource}
                      size="small"
                            color={
                              task.statusUpdateSource === 'MANUAL' ? 'primary' :
                              task.statusUpdateSource === 'TELEMETRY' ? 'success' :
                              task.statusUpdateSource === 'IMPORT' ? 'info' :
                              'default'
                            }
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, task.name, e.target.value)}
                      variant="outlined"
                            sx={{ 
                              '& .MuiSelect-select': { 
                                py: 0.5,
                                fontSize: '0.875rem'
                              }
                            }}
                          >
                            <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                            <MenuItem value="DONE">Done</MenuItem>
                            <MenuItem value="NO_LONGER_USING">No Longer Using</MenuItem>
                            <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>

      {/* Status Change Notes Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Update Task Status: {statusDialog.taskName}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Changing status to: <strong>{statusDialog.currentStatus.replace('_', ' ')}</strong>
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            placeholder="Add notes about this status change..."
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            helperText="These notes will be recorded with the status change"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ ...statusDialog, open: false })}>Cancel</Button>
          <Button onClick={handleStatusSave} variant="contained" color="primary">
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
