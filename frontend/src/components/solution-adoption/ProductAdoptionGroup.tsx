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
  FormControl,
  Select,
  MenuItem,
  Menu,
  MenuItem as MenuItemLink,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  HourglassEmpty,
  NotInterested,
  Error as ErrorIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';

interface StatusDialogState {
  open: boolean;
  taskId: string;
  taskName: string;
  currentStatus: string;
}

interface ProductAdoptionGroupProps {
  product: {
    productId: string;
    productName: string;
    status: string;
    progressPercentage: number;
    totalTasks: number;
    completedTasks: number;
    productAdoptionPlanId?: string;
  };
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
      successCriteria?: string;
      isMet: boolean;
      values?: Array<{
        id: string;
        value: string;
        createdAt: string;
        notes?: string;
      }>;
    }>;
    outcomes?: Array<{
      id: string;
      name: string;
    }>;
    releases?: Array<{
      id: string;
      name: string;
    }>;
  }>;
  onUpdateTaskStatus?: (taskId: string, newStatus: string, notes?: string) => void;
  onViewProductPlan?: (productAdoptionPlanId: string) => void;
}

export const ProductAdoptionGroup: React.FC<ProductAdoptionGroupProps> = ({
  product,
  tasks,
  onUpdateTaskStatus,
  onViewProductPlan
}) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    taskId: '',
    taskName: '',
    currentStatus: 'NOT_STARTED',
  });
  const [statusNotes, setStatusNotes] = useState('');
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);

  // Calculate product status based on tasks
  const calculatedStatus = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return 'NOT_STARTED';
    
    const applicableTasks = tasks.filter(t => t.status !== 'NOT_APPLICABLE');
    if (applicableTasks.length === 0) return 'NOT_STARTED';
    
    const completedCount = applicableTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const inProgressCount = applicableTasks.filter(t => t.status === 'IN_PROGRESS').length;
    
    if (completedCount === applicableTasks.length) return 'COMPLETED';
    if (inProgressCount > 0 || completedCount > 0) return 'IN_PROGRESS';
    return 'NOT_STARTED';
  }, [tasks]);

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
        return <CheckCircle color="success" fontSize="small" />;
      case 'IN_PROGRESS':
        return <HourglassEmpty color="info" fontSize="small" />;
      case 'NOT_STARTED':
        return <HourglassEmpty color="disabled" fontSize="small" />;
      case 'NOT_APPLICABLE':
        return <NotInterested color="disabled" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'NOT_STARTED':
        return 'default';
      case 'BLOCKED':
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
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#E0F2F1',
          cursor: 'pointer',
          borderLeft: '4px solid',
          borderLeftColor: '#00897B',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: '#B2DFDB',
            boxShadow: 1
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">
                🔗 {product.productName}
              </Typography>
              {product.productAdoptionPlanId && onViewProductPlan && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProductPlan(product.productAdoptionPlanId!);
                  }}
                  title="View Product Adoption Plan"
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ flex: 1, maxWidth: 300 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={product.progressPercentage}
                    sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(product.progressPercentage)}%
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                {product.completedTasks} of {product.totalTasks} tasks
              </Typography>
              
              <Chip
                label={calculatedStatus}
                color={getStatusColor(calculatedStatus) as any}
                size="small"
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Collapsible Task Table */}
      <Collapse in={expanded}>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          {tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No tasks in this product
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="40"></TableCell>
                    <TableCell width="50">
                      <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>#</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Task Name</Typography>
                    </TableCell>
                    <TableCell width="80">
                      <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Weight</Typography>
                    </TableCell>
                    <TableCell width="100">
                      <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Resources</Typography>
                    </TableCell>
                    <TableCell width="100">
                      <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Telemetry</Typography>
                    </TableCell>
                    <TableCell width="180">
                      <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Status</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <React.Fragment key={task.id}>
                      {/* Main Task Row */}
                      <TableRow 
                        hover
                        sx={{ '& > *': { borderBottom: expandedTasks.has(task.id) ? 'none !important' : undefined } }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleTaskExpanded(task.id)}
                          >
                            {expandedTasks.has(task.id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{task.sequenceNumber}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(task.status)}
                            <Typography variant="body2">{task.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{task.weight}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', justifyContent: 'center' }}>
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
                                  if (task.howToDoc!.length === 1) {
                                    window.open(task.howToDoc![0], '_blank');
                                  } else {
                                    setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc! });
                                  }
                                }}
                                title={task.howToDoc.length === 1 
                                  ? `Documentation: ${task.howToDoc[0]}`
                                  : `Documentation (${task.howToDoc.length} links):\n${task.howToDoc.join('\n')}`
                                }
                              />
                            )}
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
                                  if (task.howToVideo!.length === 1) {
                                    window.open(task.howToVideo![0], '_blank');
                                  } else {
                                    setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo! });
                                  }
                                }}
                                title={task.howToVideo.length === 1 
                                  ? `Video: ${task.howToVideo[0]}`
                                  : `Videos (${task.howToVideo.length} links):\n${task.howToVideo.join('\n')}`
                                }
                              />
                            )}
                            {(!task.howToDoc || task.howToDoc.length === 0) && (!task.howToVideo || task.howToVideo.length === 0) && (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {task.telemetryAttributes && task.telemetryAttributes.length > 0 ? (
                            <Chip
                              label={`${task.telemetryAttributes.filter(a => a.isMet).length}/${task.telemetryAttributes.length}`}
                              size="small"
                              color={task.telemetryAttributes.every(a => a.isMet) ? 'success' : 'default'}
                              sx={{ fontSize: '0.7rem', height: '20px' }}
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

                      {/* Expanded Details Row */}
                      {expandedTasks.has(task.id) && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ bgcolor: 'background.default', p: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {/* Description and Notes */}
                              {(task.description || task.notes) && (
                                <Box>
                                  {task.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                      <strong>Description:</strong> {task.description}
                                    </Typography>
                                  )}
                                  {task.notes && (
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Notes:</strong> {task.notes}
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              {/* Resources */}
                              {((task.howToDoc && task.howToDoc.length > 0) || (task.howToVideo && task.howToVideo.length > 0)) && (
                                <Box>
                                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Resources:</Typography>
                                  {task.howToDoc && task.howToDoc.map((doc, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                      <DescriptionIcon fontSize="small" color="primary" />
                                      <Typography variant="body2" component="a" href={doc} target="_blank" rel="noopener">
                                        {doc}
                                      </Typography>
                                    </Box>
                                  ))}
                                  {task.howToVideo && task.howToVideo.map((video, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                      <VideoIcon fontSize="small" color="secondary" />
                                      <Typography variant="body2" component="a" href={video} target="_blank" rel="noopener">
                                        {video}
                    </Typography>
                  </Box>
                                  ))}
                                </Box>
                              )}

                              {/* Telemetry Attributes */}
                              {task.telemetryAttributes && task.telemetryAttributes.length > 0 && (
                                <Box>
                                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Telemetry Attributes:</Typography>
                                  {task.telemetryAttributes.map((attr) => (
                                    <Box key={attr.id} sx={{ ml: 2, mb: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2">
                                          <strong>{attr.name}</strong> ({attr.dataType})
                                        </Typography>
                  <Chip
                                          label={attr.isMet ? 'Met' : 'Not Met'}
                    size="small"
                                          color={attr.isMet ? 'success' : 'default'}
                                        />
                                      </Box>
                                      {attr.values && attr.values.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                          Latest: {attr.values[0].value} ({new Date(attr.values[0].createdAt).toLocaleString()})
                                        </Typography>
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {/* Status History */}
                              {task.statusUpdatedAt && (
                                <Box>
                                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Status History:</Typography>
                                  <Box sx={{ ml: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Updated:</strong> {new Date(task.statusUpdatedAt).toLocaleString()}
                                    </Typography>
                                    {task.statusUpdatedBy && (
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Updated By:</strong> {task.statusUpdatedBy} ({task.statusUpdateSource})
                                      </Typography>
                                    )}
                                    {task.statusNotes && (
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Notes:</strong> {task.statusNotes}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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

      {/* Documentation Links Menu */}
      <Menu
        anchorEl={docMenuAnchor?.el}
        open={Boolean(docMenuAnchor)}
        onClose={() => setDocMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {docMenuAnchor?.links.map((link, idx) => (
          <MenuItemLink
            key={idx}
            onClick={() => {
              window.open(link, '_blank');
              setDocMenuAnchor(null);
            }}
            sx={{ fontSize: '0.875rem' }}
          >
            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
          </MenuItemLink>
        ))}
      </Menu>

      {/* Video Links Menu */}
      <Menu
        anchorEl={videoMenuAnchor?.el}
        open={Boolean(videoMenuAnchor)}
        onClose={() => setVideoMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {videoMenuAnchor?.links.map((link, idx) => (
          <MenuItemLink
            key={idx}
            onClick={() => {
              window.open(link, '_blank');
              setVideoMenuAnchor(null);
            }}
            sx={{ fontSize: '0.875rem' }}
          >
            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
          </MenuItemLink>
        ))}
      </Menu>
    </Paper>
  );
};


