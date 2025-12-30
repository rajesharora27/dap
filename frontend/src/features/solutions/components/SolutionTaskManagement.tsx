import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore } from '@shared/components/FAIcon';
import { useMutation, gql } from '@apollo/client';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';

import { CREATE_TASK, DELETE_TASK, Task } from '@features/tasks';


interface Props {
  solutionId: string;
  solutionTasks: Task[];
  productTasks: Array<{ productName: string; tasks: Task[] }>;
  onRefetch: () => void;
  onEditTask?: (task: Task) => void;
}

export const SolutionTaskManagement: React.FC<Props> = ({
  solutionId,
  solutionTasks,
  productTasks,
  onRefetch,
  onEditTask
}) => {
  const [createTask] = useMutation(CREATE_TASK, { onCompleted: onRefetch });
  const [deleteTask] = useMutation(DELETE_TASK, { onCompleted: onRefetch });

  // Resizable columns state
  const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
    tableId: 'solution-task-management',
    columns: [
      { key: 'sequence', minWidth: 40, defaultWidth: 60 },
      { key: 'name', minWidth: 150, defaultWidth: 250 },
      { key: 'details', minWidth: 150, defaultWidth: 200 },
      { key: 'description', minWidth: 200, defaultWidth: 300 },
      { key: 'actions', minWidth: 100, defaultWidth: 100 },
    ],
  });

  const handleAddTask = async () => {
    const maxSeq = Math.max(...solutionTasks.map(t => t.sequenceNumber || 0), 0);
    const name = prompt('Enter task name:');
    if (!name) return;

    try {
      await createTask({
        variables: {
          input: {
            solutionId,
            name,
            estMinutes: 60,
            weight: 1.0,
            sequenceNumber: maxSeq + 1,
            licenseLevel: 'Essential'
          }
        }
      });
    } catch (error: any) {
      alert(`Failed to create task: ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Delete this task?')) {
      await deleteTask({ variables: { id: taskId } });
    }
  };

  const getLicenseLevelColor = (level: string) => {
    const colors: { [key: string]: any } = {
      'Essential': 'default',
      'Advantage': 'primary',
      'Signature': 'secondary'
    };
    return colors[level] || 'default';
  };

  return (
    <Box>
      {/* Solution Tasks */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Solution Tasks</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddTask}
            size="small"
          >
            Add Task
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <ResizableTableCell
                  width={columnWidths['sequence']}
                  resizable
                  resizeHandleProps={getResizeHandleProps('sequence')}
                  isResizing={isResizing}
                >
                  #
                </ResizableTableCell>
                <ResizableTableCell
                  width={columnWidths['name']}
                  resizable
                  resizeHandleProps={getResizeHandleProps('name')}
                  isResizing={isResizing}
                >
                  Task Name
                </ResizableTableCell>
                <ResizableTableCell
                  width={columnWidths['details']}
                  resizable
                  resizeHandleProps={getResizeHandleProps('details')}
                  isResizing={isResizing}
                >
                  Details
                </ResizableTableCell>
                <ResizableTableCell
                  width={columnWidths['description']}
                  resizable
                  resizeHandleProps={getResizeHandleProps('description')}
                  isResizing={isResizing}
                >
                  Description
                </ResizableTableCell>
                <ResizableTableCell
                  width={columnWidths['actions']}
                  align="right"
                  resizable
                  resizeHandleProps={getResizeHandleProps('actions')}
                  isResizing={isResizing}
                >
                  Actions
                </ResizableTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {solutionTasks.map((task: Task) => (
                <TableRow key={task.id} hover>
                  <TableCell>{task.sequenceNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{task.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label={task.licenseLevel || 'Essential'}
                        size="small"
                        color={getLicenseLevelColor(task.licenseLevel || 'Essential')}
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                      <Chip
                        label={`${task.estMinutes}m`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                      <Chip
                        label={`${task.weight}%`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                      {task.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {onEditTask && (
                        <IconButton
                          size="small"
                          onClick={() => onEditTask(task)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {solutionTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No solution-specific tasks. These are tasks unique to this solution.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Product Tasks (Read-only reference) */}
      {productTasks.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Product Tasks (Reference)
          </Typography>
          {productTasks.map(({ productName, tasks }) => (
            <Accordion key={productName} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{productName}</Typography>
                  <Chip label={`${tasks.length} tasks`} size="small" />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="50px">#</TableCell>
                      <TableCell>Task Name</TableCell>
                      <TableCell>License</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tasks.map((task: Task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.sequenceNumber}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{task.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={task.licenseLevel || 'Essential'}
                            size="small"
                            color={getLicenseLevelColor(task.licenseLevel || 'Essential')}
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
                            {task.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};








