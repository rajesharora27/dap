import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { useMutation, gql } from '@apollo/client';
import {
  UPDATE_CUSTOMER_SOLUTION_TASK_STATUS,
  SYNC_SOLUTION_ADOPTION_PLAN
} from '../graphql/mutations';

const GET_SOLUTION_ADOPTION_PLAN = gql`
  query GetSolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      solutionName
      licenseLevel
      totalTasks
      completedTasks
      totalWeight
      completedWeight
      progressPercentage
      solutionTasksTotal
      solutionTasksComplete
      createdAt
      updatedAt
      lastSyncedAt
      needsSync
      products {
        id
        productName
        sequenceNumber
        status
        totalTasks
        completedTasks
        progressPercentage
      }
      tasks {
        id
        name
        description
        sequenceNumber
        estMinutes
        weight
        status
        isComplete
        sourceType
        sourceProductId
        licenseLevel
        statusNotes
        completedAt
      }
      customerSolution {
        id
        name
        customer {
          id
          name
        }
      }
    }
  }
`;

interface Task {
  id: string;
  name: string;
  description?: string;
  sequenceNumber: number;
  estMinutes: number;
  weight: number;
  status: string;
  isComplete: boolean;
  sourceType: string;
  sourceProductId?: string;
  licenseLevel: string;
  statusNotes?: string;
  completedAt?: string;
}

interface Product {
  id: string;
  productName: string;
  sequenceNumber: number;
  status: string;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

interface Props {
  planId: string;
  adoptionPlan: any;
  onRefetch: () => void;
}

export const SolutionAdoptionPlanView: React.FC<Props> = ({
  planId,
  adoptionPlan,
  onRefetch
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const [updateTaskStatus] = useMutation(UPDATE_CUSTOMER_SOLUTION_TASK_STATUS, {
    onCompleted: onRefetch
  });

  const [syncPlan, { loading: syncing }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
    onCompleted: onRefetch
  });

  const handleSync = async () => {
    await syncPlan({ variables: { solutionAdoptionPlanId: planId } });
  };

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) return;

    try {
      await updateTaskStatus({
        variables: {
          input: {
            customerSolutionTaskId: selectedTask.id,
            status: newStatus,
            notes,
            updateSource: 'MANUAL'
          }
        }
      });
      setUpdateDialogOpen(false);
      setSelectedTask(null);
      setNotes('');
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const openUpdateDialog = (task: Task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setNotes(task.statusNotes || '');
    setUpdateDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    return status === 'COMPLETED' || status === 'DONE' ? (
      <CheckCircle color="success" />
    ) : (
      <RadioButtonUnchecked color="action" />
    );
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: any } = {
      'NOT_STARTED': 'default',
      'IN_PROGRESS': 'primary',
      'COMPLETED': 'success',
      'DONE': 'success',
      'NOT_APPLICABLE': 'default'
    };
    return colors[status] || 'default';
  };

  const getLicenseLevelColor = (level: string) => {
    const colors: { [key: string]: any } = {
      'Essential': 'default',
      'Advantage': 'primary',
      'Signature': 'secondary'
    };
    return colors[level] || 'default';
  };

  // Group tasks by source (solution vs products)
  const solutionTasks = adoptionPlan.tasks.filter((t: Task) => t.sourceType === 'SOLUTION');
  const productTasksMap = new Map<string, Task[]>();
  
  adoptionPlan.products.forEach((product: Product) => {
    const tasks = adoptionPlan.tasks.filter(
      (t: Task) => t.sourceProductId === product.id
    );
    productTasksMap.set(product.id, tasks);
  });

  // Filter tasks
  const filterTasks = (tasks: Task[]) => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter(t => t.status === statusFilter);
  };

  const totalEstMinutes = adoptionPlan.tasks.reduce((sum: number, t: Task) => sum + t.estMinutes, 0);
  const completedEstMinutes = adoptionPlan.tasks
    .filter((t: Task) => t.isComplete)
    .reduce((sum: number, t: Task) => sum + t.estMinutes, 0);

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {adoptionPlan.solutionName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {adoptionPlan.customerSolution.customer.name} • {adoptionPlan.customerSolution.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={adoptionPlan.licenseLevel}
              color={getLicenseLevelColor(adoptionPlan.licenseLevel)}
            />
            {adoptionPlan.needsSync && (
              <Chip label="Sync needed" color="warning" size="small" />
            )}
          </Box>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {adoptionPlan.progressPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(adoptionPlan.progressPercentage, 100)}
            sx={{ height: 10, borderRadius: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {adoptionPlan.completedTasks} / {adoptionPlan.totalTasks} tasks completed
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {completedEstMinutes} / {totalEstMinutes} minutes
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${adoptionPlan.products.length} Products`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`${adoptionPlan.solutionTasksComplete}/${adoptionPlan.solutionTasksTotal} Solution Tasks`}
            variant="outlined"
            size="small"
            color={adoptionPlan.solutionTasksComplete === adoptionPlan.solutionTasksTotal ? 'success' : 'default'}
          />
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync Progress'}
          </Button>
        </Box>
      </Paper>

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FilterList />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Filter by Status"
          >
            <MenuItem value="all">All Tasks</MenuItem>
            <MenuItem value="NOT_STARTED">Not Started</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="DONE">Done</MenuItem>
            <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Product Progress */}
      {adoptionPlan.products.map((product: Product) => {
        const tasks = productTasksMap.get(product.id) || [];
        const filteredTasks = filterTasks(tasks);
        
        return (
          <Accordion key={product.id} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                <Chip label={`#${product.sequenceNumber}`} size="small" />
                <Typography fontWeight="medium">{product.productName}</Typography>
                <Chip label={product.status} size="small" color={getStatusColor(product.status)} />
                <Box sx={{ flexGrow: 1, mx: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(product.progressPercentage, 100)}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="caption">
                  {product.completedTasks}/{product.totalTasks}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {filteredTasks.map((task: Task) => (
                  <ListItem
                    key={task.id}
                    button
                    onClick={() => openUpdateDialog(task)}
                    sx={{
                      borderLeft: 3,
                      borderColor: task.isComplete ? 'success.main' : 'action.disabled',
                      mb: 0.5,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Box sx={{ mr: 2 }}>{getStatusIcon(task.status)}</Box>
                    <Chip label={`#${task.sequenceNumber}`} size="small" sx={{ mr: 1 }} />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{task.name}</Typography>
                          <Chip
                            label={task.status}
                            size="small"
                            color={getStatusColor(task.status)}
                          />
                          <Chip label={`${task.estMinutes}min`} size="small" variant="outlined" />
                          <Chip label={`${task.weight}%`} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={task.description}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Solution Tasks */}
      {solutionTasks.length > 0 && (
        <Accordion defaultExpanded sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography fontWeight="medium">Solution Tasks</Typography>
              <Chip
                label={`${adoptionPlan.solutionTasksComplete}/${adoptionPlan.solutionTasksTotal}`}
                size="small"
                color={adoptionPlan.solutionTasksComplete === adoptionPlan.solutionTasksTotal ? 'success' : 'default'}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {filterTasks(solutionTasks).map((task: Task) => (
                <ListItem
                  key={task.id}
                  button
                  onClick={() => openUpdateDialog(task)}
                  sx={{
                    borderLeft: 3,
                    borderColor: task.isComplete ? 'success.main' : 'action.disabled',
                    mb: 0.5,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box sx={{ mr: 2 }}>{getStatusIcon(task.status)}</Box>
                  <Chip label={`#${task.sequenceNumber}`} size="small" sx={{ mr: 1 }} />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{task.name}</Typography>
                        <Chip
                          label={task.status}
                          size="small"
                          color={getStatusColor(task.status)}
                        />
                        <Chip label={`${task.estMinutes}min`} size="small" variant="outlined" />
                        <Chip label={`${task.weight}%`} size="small" variant="outlined" />
                      </Box>
                    }
                    secondary={task.description}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Task Status</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>{selectedTask.name}</strong>
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="DONE">Done</MenuItem>
                  <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};








