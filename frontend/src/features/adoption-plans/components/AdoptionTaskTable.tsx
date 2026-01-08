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
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Article,
  OndemandVideo
} from '@shared/components/FAIcon';
import { getStatusBackgroundColor, getStatusColor, getUpdateSourceChipColor } from '@shared/theme/statusStyles';
import { TaskDetailsDialog, TaskDetailsData } from '@features/tasks/components/TaskDetailsDialog';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { TagsDropdown, TagItem } from '@shared/components/TagsDropdown';

const TASK_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started', color: '#9FA6B2' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
  { value: 'COMPLETED', label: 'Completed', color: '#10B981' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable', color: '#6B7280' },
  { value: 'NO_LONGER_USING', label: 'No Longer Using', color: '#EF4444' },
];

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
  tags?: Array<{
    id: string;
    name: string;
    description?: string;
    color?: string;
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
  accentColor?: string;
  filterInfo?: string;
  showHeader?: boolean;
  defaultExpanded?: boolean;
  visibleColumns?: string[];
}

// Default visible columns for adoption task tables
export const ADOPTION_TASK_COLUMNS = [
  { key: 'tags', label: 'Tags', alwaysVisible: false },
  { key: 'resources', label: 'Resources', alwaysVisible: false },
  { key: 'weight', label: 'Weight', alwaysVisible: false },
  { key: 'telemetry', label: 'Validation Criteria', alwaysVisible: false },
  { key: 'updatedVia', label: 'Updated Via', alwaysVisible: false },
];

export const DEFAULT_ADOPTION_VISIBLE_COLUMNS = ADOPTION_TASK_COLUMNS.map(c => c.key);

export const AdoptionTaskTable: React.FC<AdoptionTaskTableProps> = ({
  tasks,
  onUpdateTaskStatus,
  title = 'Tasks',
  titleIcon = '📋',
  accentColor,
  titleColor,
  bgColor,
  borderColor,
  filterInfo,
  showHeader = true,
  defaultExpanded = true,
  visibleColumns = DEFAULT_ADOPTION_VISIBLE_COLUMNS,
}) => {
  const theme = useTheme();

  // Default values based on accentColor
  const finalAccentColor = accentColor || '#049FD9';
  const finalTitleColor = titleColor || finalAccentColor;
  const finalBgColor = bgColor || alpha(finalAccentColor, 0.08);
  const finalBorderColor = borderColor || finalAccentColor;

  // Helper function to check if a column is visible
  const isColumnVisible = (columnKey: string) => visibleColumns.includes(columnKey);
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

  // Resizable columns
  const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
    tableId: 'adoption-task-table',
    columns: [
      { key: 'sequence', minWidth: 40, defaultWidth: 50 },
      { key: 'task', minWidth: 150, defaultWidth: 300 },
      { key: 'tags', minWidth: 80, defaultWidth: 120 },
      { key: 'resources', minWidth: 80, defaultWidth: 120 },
      { key: 'weight', minWidth: 60, defaultWidth: 80 },
      { key: 'telemetry', minWidth: 100, defaultWidth: 140 },
      { key: 'updatedVia', minWidth: 80, defaultWidth: 100 },
      { key: 'action', minWidth: 100, defaultWidth: 160 },
    ],
  });

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
          <TableRow sx={{ backgroundColor: 'action.hover' }}>
            <ResizableTableCell
              width={columnWidths['sequence']}
              resizable
              resizeHandleProps={getResizeHandleProps('sequence')}
              isResizing={isResizing}
            >
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>#</Typography>
            </ResizableTableCell>
            <ResizableTableCell
              width={columnWidths['task']}
              resizable
              resizeHandleProps={getResizeHandleProps('task')}
              isResizing={isResizing}
            >
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Task</Typography>
            </ResizableTableCell>
            {isColumnVisible('tags') && (
              <ResizableTableCell
                width={columnWidths['tags']}
                resizable
                resizeHandleProps={getResizeHandleProps('tags')}
                isResizing={isResizing}
              >
                <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Tags</Typography>
              </ResizableTableCell>
            )}
            {isColumnVisible('resources') && (
              <ResizableTableCell
                width={columnWidths['resources']}
                resizable
                resizeHandleProps={getResizeHandleProps('resources')}
                isResizing={isResizing}
              >
                <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Resources</Typography>
              </ResizableTableCell>
            )}
            {isColumnVisible('weight') && (
              <ResizableTableCell
                width={columnWidths['weight']}
                resizable
                resizeHandleProps={getResizeHandleProps('weight')}
                isResizing={isResizing}
                sx={{ whiteSpace: 'nowrap' }}
              >
                <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Weight</Typography>
              </ResizableTableCell>
            )}
            {isColumnVisible('telemetry') && (
              <ResizableTableCell
                width={columnWidths['telemetry']}
                resizable
                resizeHandleProps={getResizeHandleProps('telemetry')}
                isResizing={isResizing}
                sx={{ whiteSpace: 'nowrap' }}
              >
                <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Validation Criteria</Typography>
              </ResizableTableCell>
            )}
            {isColumnVisible('updatedVia') && (
              <ResizableTableCell
                width={columnWidths['updatedVia']}
                resizable
                resizeHandleProps={getResizeHandleProps('updatedVia')}
                isResizing={isResizing}
              >
                <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Updated Via</Typography>
              </ResizableTableCell>
            )}
            <TableCell width={160}>
              <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Action</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3 + visibleColumns.length} align="center">
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
                {isColumnVisible('tags') && (
                  <TableCell>
                    <TagsDropdown
                      tags={(task.tags || []) as TagItem[]}
                      disabled
                    />
                  </TableCell>
                )}
                {isColumnVisible('resources') && (
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
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task.howToDoc!.length === 1) {
                                window.open(task.howToDoc![0], '_blank');
                              } else {
                                setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc! });
                              }
                            }}
                            sx={{
                              padding: 0.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              color: 'text.secondary',
                              '&:hover': { bgcolor: 'action.hover', color: 'primary.main', borderColor: 'primary.main' }
                            }}
                          >
                            <Article style={{ fontSize: '1rem' }} />
                          </IconButton>
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
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task.howToVideo!.length === 1) {
                                window.open(task.howToVideo![0], '_blank');
                              } else {
                                setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo! });
                              }
                            }}
                            sx={{
                              padding: 0.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              color: 'text.secondary',
                              '&:hover': { bgcolor: 'action.hover', color: 'error.main', borderColor: 'error.main' }
                            }}
                          >
                            <OndemandVideo style={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(!task.howToDoc || task.howToDoc.length === 0) && (!task.howToVideo || task.howToVideo.length === 0) && (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </Box>
                  </TableCell>
                )}
                {isColumnVisible('weight') && (
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{task.weight ? `${task.weight}%` : '-'}</TableCell>
                )}
                {isColumnVisible('telemetry') && (
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
                )}
                {isColumnVisible('updatedVia') && (
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
                )}
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        },
                      }}
                    >
                      {TASK_STATUSES.map((s) => (
                        <MenuItem key={s.value} value={s.value} sx={{ fontSize: '0.8rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                            {s.label}
                          </Box>
                        </MenuItem>
                      ))}
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
        borderColor: 'divider',
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
          bgcolor: finalBgColor,
          cursor: 'pointer',
          borderLeft: '4px solid',
          borderLeftColor: finalBorderColor,
          transition: 'all 0.2s ease',
          '&:hover': {
            filter: 'brightness(0.95)',
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <IconButton size="small" sx={{ color: finalTitleColor }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: finalTitleColor, fontWeight: 600 }}>
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
              <Typography variant="body2" sx={{ color: finalTitleColor, opacity: 0.8 }}>
                {completedTasks} of {applicableTasks.length} tasks
              </Typography>
            </Box>
            {filterInfo && (
              <Typography variant="caption" sx={{ color: finalTitleColor, opacity: 0.7, mt: 0.5, display: 'block' }}>
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
