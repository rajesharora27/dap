import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore } from '@mui/icons-material';
import { useMutation, gql } from '@apollo/client';

const CREATE_SOLUTION_TASK = gql`
  mutation CreateTask($input: TaskCreateInput!) {
    createTask(input: $input) {
      id
      name
      description
      estMinutes
      weight
      sequenceNumber
      licenseLevel
    }
  }
`;

const DELETE_SOLUTION_TASK = gql`
  mutation DeleteTask($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

interface Task {
  id: string;
  name: string;
  description?: string;
  estMinutes: number;
  weight: number;
  sequenceNumber: number;
  licenseLevel: string;
  outcomes?: any[];
  releases?: any[];
}

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
  const [createTask] = useMutation(CREATE_SOLUTION_TASK, { onCompleted: onRefetch });
  const [deleteTask] = useMutation(DELETE_SOLUTION_TASK, { onCompleted: onRefetch });

  const handleAddTask = async () => {
    const maxSeq = Math.max(...solutionTasks.map(t => t.sequenceNumber), 0);
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

        <Paper variant="outlined">
          <List>
            {solutionTasks.map((task: Task, index: number) => (
              <React.Fragment key={task.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    '&:hover .action-buttons': { opacity: 1 },
                    display: 'flex',
                    gap: 1
                  }}
                >
                  <Chip
                    label={`#${task.sequenceNumber}`}
                    size="small"
                    sx={{ minWidth: 50 }}
                  />
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {task.name}
                        </Typography>
                        <Chip
                          label={task.licenseLevel}
                          size="small"
                          color={getLicenseLevelColor(task.licenseLevel)}
                        />
                        <Chip
                          label={`${task.estMinutes}min`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${task.weight}%`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={task.description}
                  />

                  <Box
                    className="action-buttons"
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                  >
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
                </ListItem>
              </React.Fragment>
            ))}

            {solutionTasks.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No solution-specific tasks. These are tasks unique to this solution.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Product tasks are shown below (read-only).
                </Typography>
              </Box>
            )}
          </List>
        </Paper>
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
              <AccordionDetails>
                <List dense>
                  {tasks.map((task: Task) => (
                    <ListItem key={task.id}>
                      <Chip
                        label={`#${task.sequenceNumber}`}
                        size="small"
                        sx={{ minWidth: 50, mr: 1 }}
                      />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {task.name}
                            </Typography>
                            <Chip
                              label={task.licenseLevel}
                              size="small"
                              color={getLicenseLevelColor(task.licenseLevel)}
                            />
                          </Box>
                        }
                        secondary={task.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};



