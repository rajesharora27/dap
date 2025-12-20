/**
 * Shared Adoption Task Table Component
 * Used consistently across Products and Solutions tabs
 */
import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Collapse,
  Menu,
  MenuItem as MenuItemLink,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
} from '../../components/common/FAIcon';
import { getStatusBackgroundColor, getStatusColor, getUpdateSourceChipColor } from '../../utils/statusStyles';
import { TaskDetailsDialog, TaskDetailsData } from './TaskDetailsDialog';

export interface TaskData {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  status: string;
  sequenceNumber: number;
  weight?: number | string;
  licenseLevel?: string;
  estMinutes?: number;
  priority?: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  statusUpdateSource?: string;
  statusNotes?: string;
  howToDoc?: string[];
  howToVideo?: string[];
  releases?: Array<{ id: string; name: string; version?: string }>;
  outcomes?: Array<{ id: string; name: string }>;
  telemetryAttributes?: Array<{
    id: string;
    name: string;
    description?: string;
    dataType: string;
    successCriteria?: string;
    isMet?: boolean;
    values?: Array<{
      id: string;
      value: any;
      criteriaMet?: boolean;
      createdAt?: string;
    }>;
  }>;
}

interface StatusDialogState {
  open: boolean;
  taskId: string;
  taskName: string;
  currentStatus: string;
}

interface AdoptionTaskTableProps {
  tasks: TaskData[];
  onUpdateTaskStatus?: (taskId: string, newStatus: string, notes?: string) => void;
  title?: string;
  titleIcon?: string;
  titleColor?: string;
  bgColor?: string;
  borderColor?: string;
  filterInfo?: string;
  showHeader?: boolean;
  defaultExpanded?: boolean;
}

export const AdoptionTaskTable: React.FC<AdoptionTaskTableProps> = ({
  tasks,
  onUpdateTaskStatus,
  title = 'Tasks',
  titleIcon = '📋',
  titleColor = '#1976d2',
  bgColor = '#e3f2fd',
  borderColor = '#1976d2',
  filterInfo,
  showHeader = true,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    taskId: '',
    taskName: '',
    currentStatus: 'NOT_STARTED',
  });
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);

  const handleRowDoubleClick = (task: TaskData) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
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

  // Calculate progress
  const applicableTasks = tasks.filter(t => t.status !== 'NOT_APPLICABLE');
  const completedTasks = applicableTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const progress = applicableTasks.length > 0 ? Math.round((completedTasks / applicableTasks.length) * 100) : 0;

  const tableContent = (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell width={50}>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>#</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Task</Typography>
            </TableCell>
            <TableCell width={120}>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Resources</Typography>
            </TableCell>
            <TableCell width={80} sx={{ whiteSpace: 'nowrap' }}>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Weight</Typography>
            </TableCell>
            <TableCell width={140} sx={{ whiteSpace: 'nowrap' }}>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Telemetry</Typography>
            </TableCell>
            <TableCell width={100}>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Updated Via</Typography>
            </TableCell>
            <TableCell width={160}>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Action</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  No tasks found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow
                key={task.id}
                hover
                onDoubleClick={() => handleRowDoubleClick(task)}
                title={task.description || 'Double-click for details'}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: getStatusBackgroundColor(task.status),
                  borderLeft: `4px solid ${getStatusColor(task.status)}`,
                  opacity: task.status === 'NOT_APPLICABLE' ? 0.5 : 1,
                  textDecoration: task.status === 'NOT_APPLICABLE' ? 'line-through' : 'none',
                  '&:hover': {
                    backgroundColor: getStatusBackgroundColor(task.status),
                    filter: 'brightness(0.97)',
                  }
                }}
              >
                <TableCell>{task.sequenceNumber}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {task.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {task.howToDoc && task.howToDoc.length > 0 && (
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="caption" fontWeight="bold">Documentation</Typography>
                            {task.howToDoc.map((link, i) => (
                              <Typography key={i} variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                                {link}
                              </Typography>
                            ))}
                          </Box>
                        }
                        arrow
                      >
                        <Chip
                          size="small"
                          label={`Doc${task.howToDoc.length > 1 ? ` (${task.howToDoc.length})` : ''}`}
                          color="primary"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: '22px',
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (task.howToDoc!.length === 1) {
                              window.open(task.howToDoc![0], '_blank');
                            } else {
                              setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc! });
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                    {task.howToVideo && task.howToVideo.length > 0 && (
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="caption" fontWeight="bold">Video Resources</Typography>
                            {task.howToVideo.map((link, i) => (
                              <Typography key={i} variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                                {link}
                              </Typography>
                            ))}
                          </Box>
                        }
                        arrow
                      >
                        <Chip
                          size="small"
                          label={`Video${task.howToVideo.length > 1 ? ` (${task.howToVideo.length})` : ''}`}
                          color="error"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: '22px',
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'error.light', color: 'white' }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (task.howToVideo!.length === 1) {
                              window.open(task.howToVideo![0], '_blank');
                            } else {
                              setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo! });
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                    {(!task.howToDoc || task.howToDoc.length === 0) && (!task.howToVideo || task.howToVideo.length === 0) && (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{task.weight ? `${task.weight}%` : '-'}</TableCell>
                <TableCell>
                  {(() => {
                    const totalAttributes = task.telemetryAttributes?.length || 0;
                    const attributesWithValues = task.telemetryAttributes?.filter((attr: any) =>
                      attr.values && attr.values.length > 0
                    ).length || 0;

                    const attributesWithCriteriaMet = task.telemetryAttributes?.filter((attr: any) =>
                      attr.isMet === true
                    ).length || 0;

                    const attributesWithCriteria = task.telemetryAttributes?.filter((attr: any) =>
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
                            variant="outlined"
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
                                    ✓ All criteria met! Task can be marked as "Done via Telemetry"
                                  </Typography>
                                )}
                                {percentage < 100 && percentage > 0 && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'warning.light' }}>
                                    {percentage}% complete - Some criteria still need to be met
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
                              variant="outlined"
                              color={percentage === 100 ? 'success' : percentage > 0 ? 'warning' : 'default'}
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  {task.statusUpdateSource ? (
                    <Chip
                      label={task.statusUpdateSource}
                      size="small"
                      variant="outlined"
                      color={getUpdateSourceChipColor(task.statusUpdateSource)}
                      sx={{ fontSize: '0.7rem', height: '22px' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, task.name, e.target.value)}
                      variant="outlined"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '& .MuiSelect-select': {
                          py: 0.5,
                          fontSize: '0.8rem',
                        },
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
  );

  // Shared dialogs and menus
  const dialogsAndMenus = (
    <>
      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Update Status: {statusDialog.taskName}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Changing status to: <strong>{statusDialog.currentStatus.replace(/_/g, ' ')}</strong>
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            placeholder="Add notes about this status change..."
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ ...statusDialog, open: false })}>Cancel</Button>
          <Button onClick={handleStatusSave} variant="contained" color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Task Details Dialog - Using shared component */}
      <TaskDetailsDialog
        open={taskDetailsOpen}
        onClose={() => {
          setTaskDetailsOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />

      {/* Menus */}
      <Menu anchorEl={docMenuAnchor?.el} open={Boolean(docMenuAnchor)} onClose={() => setDocMenuAnchor(null)}>
        {docMenuAnchor?.links.map((link, idx) => (
          <MenuItemLink key={idx} onClick={() => { window.open(link, '_blank'); setDocMenuAnchor(null); }}>
            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
          </MenuItemLink>
        ))}
      </Menu>
      <Menu anchorEl={videoMenuAnchor?.el} open={Boolean(videoMenuAnchor)} onClose={() => setVideoMenuAnchor(null)}>
        {videoMenuAnchor?.links.map((link, idx) => (
          <MenuItemLink key={idx} onClick={() => { window.open(link, '_blank'); setVideoMenuAnchor(null); }}>
            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
          </MenuItemLink>
        ))}
      </Menu>
    </>
  );

  // If no header, just return the table
  if (!showHeader) {
    return (
      <>
        {tableContent}
        {dialogsAndMenus}
      </>
    );
  }

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
          bgcolor: bgColor,
          cursor: 'pointer',
          borderLeft: '4px solid',
          borderLeftColor: borderColor,
          transition: 'all 0.2s ease',
          '&:hover': {
            filter: 'brightness(0.95)',
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <IconButton size="small" sx={{ color: titleColor }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: titleColor, fontWeight: 600 }}>
                {titleIcon} {title}
              </Typography>
              <Chip
                label={`${progress}%`}
                size="small"
                variant="outlined"
                color={progress === 100 ? 'success' : progress > 0 ? 'primary' : 'default'}
                sx={{
                  fontWeight: 600,
                }}
              />
              <Typography variant="body2" sx={{ color: titleColor, opacity: 0.8 }}>
                {completedTasks} of {applicableTasks.length} tasks
              </Typography>
            </Box>
            {filterInfo && (
              <Typography variant="caption" sx={{ color: titleColor, opacity: 0.7, mt: 0.5, display: 'block' }}>
                🔍 {filterInfo}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Task Table */}
      <Collapse in={expanded}>
        {tableContent}
      </Collapse>

      {dialogsAndMenus}
    </Paper>
  );
};
