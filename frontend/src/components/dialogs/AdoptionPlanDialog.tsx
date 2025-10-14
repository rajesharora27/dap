import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  NotStarted,
  Block,
  MoreVert,
  Sync,
  Assessment,
} from '@mui/icons-material';
import { UpdateTaskStatusDialog } from './UpdateTaskStatusDialog';

const GET_ADOPTION_PLAN = gql`
  query GetAdoptionPlan($id: ID!) {
    adoptionPlan(id: $id) {
      id
      productId
      productName
      licenseLevel
      totalTasks
      completedTasks
      totalWeight
      completedWeight
      progressPercentage
      needsSync
      lastSyncedAt
      createdAt
      updatedAt
      selectedOutcomes {
        id
        name
      }
      tasks {
        id
        originalTaskId
        name
        description
        estMinutes
        weight
        sequenceNumber
        priority
        licenseLevel
        status
        statusUpdatedAt
        statusUpdatedBy
        statusNotes
        isComplete
        completedAt
        telemetryProgress {
          totalAttributes
          requiredAttributes
          metAttributes
          metRequiredAttributes
          completionPercentage
          allRequiredMet
        }
        outcomes {
          id
          name
        }
      }
    }
  }
`;

const SYNC_ADOPTION_PLAN = gql`
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      totalTasks
      progressPercentage
      needsSync
      lastSyncedAt
    }
  }
`;

const EVALUATE_ALL_TASKS_TELEMETRY = gql`
  mutation EvaluateAllTasksTelemetry($adoptionPlanId: ID!) {
    evaluateAllTasksTelemetry(adoptionPlanId: $adoptionPlanId) {
      id
      progressPercentage
      completedTasks
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  adoptionPlanId: string | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const AdoptionPlanDialog: React.FC<Props> = ({ open, onClose, adoptionPlanId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const { data, loading, refetch } = useQuery(GET_ADOPTION_PLAN, {
    variables: { id: adoptionPlanId },
    skip: !adoptionPlanId || !open,
    fetchPolicy: 'cache-and-network',
  });

  const [syncPlan, { loading: syncing }] = useMutation(SYNC_ADOPTION_PLAN, {
    onCompleted: () => {
      refetch();
    },
  });

  const [evaluateAllTelemetry, { loading: evaluating }] = useMutation(EVALUATE_ALL_TASKS_TELEMETRY, {
    onCompleted: () => {
      refetch();
    },
  });

  const adoptionPlan = data?.adoptionPlan;
  const tasks = adoptionPlan?.tasks || [];

  const handleSyncPlan = async () => {
    if (!adoptionPlanId) return;
    try {
      await syncPlan({ variables: { adoptionPlanId } });
    } catch (error: any) {
      alert(`Error syncing plan: ${error.message}`);
    }
  };

  const handleEvaluateTelemetry = async () => {
    if (!adoptionPlanId) return;
    try {
      await evaluateAllTelemetry({ variables: { adoptionPlanId } });
    } catch (error: any) {
      alert(`Error evaluating telemetry: ${error.message}`);
    }
  };

  const handleUpdateTaskStatus = (task: any) => {
    setSelectedTask(task);
    setUpdateStatusDialogOpen(true);
  };

  const handleTaskStatusUpdated = () => {
    refetch();
    setUpdateStatusDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle fontSize="small" color="success" />;
      case 'IN_PROGRESS':
        return <HourglassEmpty fontSize="small" color="primary" />;
      case 'NOT_STARTED':
        return <NotStarted fontSize="small" color="disabled" />;
      case 'NOT_APPLICABLE':
        return <Block fontSize="small" color="action" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'NOT_STARTED':
        return 'default';
      case 'NOT_APPLICABLE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredTasks = filterStatus
    ? tasks.filter((task: any) => task.status === filterStatus)
    : tasks;

  const statusCounts = {
    DONE: tasks.filter((t: any) => t.status === 'DONE').length,
    IN_PROGRESS: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
    NOT_STARTED: tasks.filter((t: any) => t.status === 'NOT_STARTED').length,
    NOT_APPLICABLE: tasks.filter((t: any) => t.status === 'NOT_APPLICABLE').length,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Adoption Plan Details</Typography>
            {adoptionPlan && (
              <Typography variant="caption" color="text.secondary">
                {adoptionPlan.productName} • {adoptionPlan.licenseLevel}
              </Typography>
            )}
          </Box>
          <Box>
            {adoptionPlan?.needsSync && (
              <Tooltip title="Product has been updated. Sync to get latest tasks.">
                <Chip label="Needs Sync" color="warning" size="small" sx={{ mr: 1 }} />
              </Tooltip>
            )}
            <IconButton onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={() => setMenuAnchorEl(null)}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchorEl(null);
                  handleSyncPlan();
                }}
                disabled={syncing}
              >
                <Sync fontSize="small" sx={{ mr: 1 }} />
                Sync with Product
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchorEl(null);
                  handleEvaluateTelemetry();
                }}
                disabled={evaluating}
              >
                <Assessment fontSize="small" sx={{ mr: 1 }} />
                Evaluate All Telemetry
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <LinearProgress />
        ) : !adoptionPlan ? (
          <Alert severity="error">Adoption plan not found</Alert>
        ) : (
          <>
            {/* Progress Overview */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Overall Progress
                      </Typography>
                      <Typography variant="h4" gutterBottom>
                        {adoptionPlan.progressPercentage.toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(adoptionPlan.progressPercentage, 100)}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {adoptionPlan.completedTasks} of {adoptionPlan.totalTasks} tasks completed
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Weight Progress
                      </Typography>
                      <Typography variant="h4" gutterBottom>
                        {adoptionPlan.completedWeight.toFixed(1)} / {adoptionPlan.totalWeight.toFixed(1)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          label={`✓ ${statusCounts.DONE}`}
                          color="success"
                          size="small"
                          onClick={() => setFilterStatus(filterStatus === 'DONE' ? null : 'DONE')}
                        />
                        <Chip
                          label={`⏳ ${statusCounts.IN_PROGRESS}`}
                          color="primary"
                          size="small"
                          onClick={() => setFilterStatus(filterStatus === 'IN_PROGRESS' ? null : 'IN_PROGRESS')}
                        />
                        <Chip
                          label={`○ ${statusCounts.NOT_STARTED}`}
                          color="default"
                          size="small"
                          onClick={() => setFilterStatus(filterStatus === 'NOT_STARTED' ? null : 'NOT_STARTED')}
                        />
                        <Chip
                          label={`⊗ ${statusCounts.NOT_APPLICABLE}`}
                          color="warning"
                          size="small"
                          onClick={() => setFilterStatus(filterStatus === 'NOT_APPLICABLE' ? null : 'NOT_APPLICABLE')}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label={`Tasks (${filteredTasks.length})`} />
                <Tab label="Details" />
              </Tabs>
            </Box>

            {/* Tasks Tab */}
            <TabPanel value={tabValue} index={0}>
              {filterStatus && (
                <Alert
                  severity="info"
                  onClose={() => setFilterStatus(null)}
                  sx={{ mb: 2 }}
                >
                  Showing {getStatusLabel(filterStatus)} tasks only
                </Alert>
              )}
              <List>
                {filteredTasks.map((task: any, index: number) => (
                  <React.Fragment key={task.id}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        '&:hover': { bgcolor: 'action.hover' },
                        cursor: 'pointer',
                      }}
                      onClick={() => handleUpdateTaskStatus(task)}
                    >
                      <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {getStatusIcon(task.status)}
                            <Typography variant="body2" fontWeight="medium">
                              #{task.sequenceNumber} {task.name}
                            </Typography>
                            <Chip
                              label={getStatusLabel(task.status)}
                              color={getStatusColor(task.status) as any}
                              size="small"
                            />
                            {task.priority && (
                              <Chip label={task.priority} size="small" variant="outlined" />
                            )}
                          </Box>
                          {task.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>
                              {task.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Weight: {task.weight}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.estMinutes} min
                          </Typography>
                        </Box>
                      </Box>

                      {/* Telemetry Progress */}
                      {task.telemetryProgress.totalAttributes > 0 && (
                        <Box sx={{ pl: 3, mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Telemetry:
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={task.telemetryProgress.completionPercentage}
                              sx={{ flex: 1, height: 6, borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {task.telemetryProgress.metAttributes}/{task.telemetryProgress.totalAttributes}
                            </Typography>
                            {task.telemetryProgress.allRequiredMet && (
                              <Tooltip title="All required telemetry criteria met">
                                <CheckCircle fontSize="small" color="success" />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Status Notes */}
                      {task.statusNotes && (
                        <Box sx={{ pl: 3, mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Note: {task.statusNotes}
                          </Typography>
                        </Box>
                      )}
                    </ListItem>
                    {index < filteredTasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </TabPanel>

            {/* Details Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Product
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {adoptionPlan.productName}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    License Level
                  </Typography>
                  <Chip label={adoptionPlan.licenseLevel} color="primary" />

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Selected Outcomes
                  </Typography>
                  {adoptionPlan.selectedOutcomes?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      All tasks included (no outcome filter)
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {adoptionPlan.selectedOutcomes?.map((outcome: any) => (
                        <Chip key={outcome.id} label={outcome.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </Box>

                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Created
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {new Date(adoptionPlan.createdAt).toLocaleString()}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {new Date(adoptionPlan.updatedAt).toLocaleString()}
                  </Typography>

                  {adoptionPlan.lastSyncedAt && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                        Last Synced
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {new Date(adoptionPlan.lastSyncedAt).toLocaleString()}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </TabPanel>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Update Task Status Dialog */}
      {selectedTask && (
        <UpdateTaskStatusDialog
          open={updateStatusDialogOpen}
          onClose={() => {
            setUpdateStatusDialogOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onUpdated={handleTaskStatusUpdated}
        />
      )}
    </Dialog>
  );
};
