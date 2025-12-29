import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import { Add, Edit, Delete, Download, Upload, Assessment, Sync } from '@shared/components/FAIcon';
import { gql, useQuery, useMutation } from '@apollo/client';
import { AssignSolutionDialog } from './AssignSolutionDialog';
import { EditSolutionLicensesDialog } from './EditSolutionLicensesDialog';
import { SolutionAdoptionPlanView } from '@features/adoption-plans';
import { importSolutionTelemetry, downloadFileFromUrl } from '@/features/telemetry/utils/telemetryOperations';


const GET_CUSTOMER_SOLUTIONS = gql`
  query CustomerSolutions($customerId: ID!) {
    customer(id: $customerId) {
      id
      name
      solutions {
        id
        name
        licenseLevel
        solution {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          needsSync
          lastSyncedAt
        }
      }
    }
  }
`;

const CREATE_SOLUTION_ADOPTION_PLAN = gql`
  mutation CreateSolutionAdoptionPlan($customerSolutionId: ID!) {
    createSolutionAdoptionPlan(customerSolutionId: $customerSolutionId) {
      id
      progressPercentage
    }
  }
`;



const REMOVE_SOLUTION_FROM_CUSTOMER = gql`
  mutation RemoveSolutionFromCustomer($id: ID!) {
    removeSolutionFromCustomerEnhanced(id: $id) {
      success
      message
    }
  }
`;

const GET_SOLUTION_ADOPTION_PLAN = gql`
  query SolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
    }
  }
`;

const EXPORT_SOLUTION_TELEMETRY_TEMPLATE = gql`
  mutation ExportSolutionTelemetryTemplate($solutionAdoptionPlanId: ID!) {
    exportSolutionAdoptionPlanTelemetryTemplate(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      url
      filename
      taskCount
      attributeCount
    }
  }
`;

const IMPORT_SOLUTION_TELEMETRY = gql`
  mutation ImportSolutionTelemetry($solutionAdoptionPlanId: ID!, $file: Upload!) {
    importSolutionAdoptionPlanTelemetry(solutionAdoptionPlanId: $solutionAdoptionPlanId, file: $file) {
      success
      batchId
      summary {
        tasksProcessed
        attributesUpdated
        criteriaEvaluated
        errors
      }
      taskResults {
        taskId
        taskName
        attributesUpdated
        criteriaMet
        criteriaTotal
        completionPercentage
        errors
      }
    }
  }
`;

const SYNC_SOLUTION_ADOPTION_PLAN = gql`
  mutation SyncSolutionAdoptionPlan($solutionAdoptionPlanId: ID!) {
    syncSolutionAdoptionPlan(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      needsSync
      lastSyncedAt
      products {
        id
        status
        progressPercentage
        totalTasks
        completedTasks
      }
    }
  }
`;

interface Props {
  customerId: string;
}

export const CustomerSolutionPanel: React.FC<Props> = ({ customerId }) => {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editLicensesDialogOpen, setEditLicensesDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER_SOLUTIONS, {
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: 'network-only'
  });

  // Auto-select last used solution or first available solution
  useEffect(() => {
    if (!data?.customer?.solutions || data.customer.solutions.length === 0) {
      setSelectedSolutionId(null);
      return;
    }

    const solutions = data.customer.solutions;

    // Try to load last selected solution from localStorage
    const lastSelectedKey = `lastSolutionAdoptionPlan_${customerId}`;
    const lastSelectedId = localStorage.getItem(lastSelectedKey);

    // Check if last selected solution still exists
    if (lastSelectedId && solutions.some((s: any) => s.id === lastSelectedId)) {
      setSelectedSolutionId(lastSelectedId);
    } else if (!selectedSolutionId) {
      // Default logic:
      // 1. Prioritize solution named "SASE" if available
      // 2. Otherwise prioritize first solution with an adoption plan
      // 3. Fallback to just the first solution in the list
      const saseSolution = solutions.find((s: any) => s.solution.name === 'SASE');
      const solutionWithPlan = solutions.find((s: any) => s.adoptionPlan);
      setSelectedSolutionId(saseSolution?.id || solutionWithPlan?.id || solutions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.customer?.solutions, customerId]); // Intentionally excluding selectedSolutionId to prevent infinite loop

  // Save selected solution to localStorage when it changes
  useEffect(() => {
    if (selectedSolutionId && customerId) {
      const lastSelectedKey = `lastSolutionAdoptionPlan_${customerId}`;
      localStorage.setItem(lastSelectedKey, selectedSolutionId);
    }
  }, [selectedSolutionId, customerId]);

  // Memoize selected solution and adoption plan ID to prevent unnecessary re-renders
  const selectedSolutionData = React.useMemo(() =>
    data?.customer?.solutions?.find((cs: any) => cs.id === selectedSolutionId),
    [data?.customer?.solutions, selectedSolutionId]
  );

  const adoptionPlanIdForQuery = selectedSolutionData?.adoptionPlan?.id;

  const { data: planData, refetch: refetchPlan } = useQuery(GET_SOLUTION_ADOPTION_PLAN, {
    variables: { id: adoptionPlanIdForQuery },
    skip: !selectedSolutionId || !selectedSolutionData?.adoptionPlan
  });

  const [createAdoptionPlan] = useMutation(CREATE_SOLUTION_ADOPTION_PLAN, {
    refetchQueries: ['Customers', 'CustomerSolutions'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetch();
    },
    onError: (err) => {
      console.error('Error creating adoption plan:', err);
    }
  });

  const [syncPlan, { loading: syncLoading }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
    refetchQueries: ['Customers', 'CustomerSolutions'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetch();
      refetchPlan();
    },
    onError: (err) => {
      console.error('Error syncing adoption plan:', err);
      alert('Failed to sync: ' + err.message);
    }
  });



  const [removeSolution, { loading: removeLoading }] = useMutation(REMOVE_SOLUTION_FROM_CUSTOMER, {
    refetchQueries: ['Customers', 'CustomerSolutions'],
    awaitRefetchQueries: true,
    onCompleted: (result) => {
      if (result.removeSolutionFromCustomerEnhanced.success) {
        setSelectedSolutionId(null);
        refetch();
        setDeleteConfirmDialogOpen(false);
      } else {
        alert('Failed to remove solution: ' + result.removeSolutionFromCustomerEnhanced.message);
      }
    },
    onError: (err) => {
      console.error('Error removing solution:', err);
      alert('Failed to remove solution: ' + err.message);
    }
  });

  const [exportTelemetryTemplate] = useMutation(EXPORT_SOLUTION_TELEMETRY_TEMPLATE, {
    onCompleted: async (data) => {
      const { url, filename } = data.exportSolutionAdoptionPlanTelemetryTemplate;

      try {
        await downloadFileFromUrl(url, filename);
      } catch (err: any) {
        console.error('Download error:', err);
        alert('Failed to download telemetry template: ' + err.message);
      }
    },
    onError: (err) => {
      console.error('Export error:', err);
      alert('Failed to export telemetry template: ' + err.message);
    }
  });





  const handleDelete = () => {
    if (selectedSolutionId) {
      removeSolution({ variables: { id: selectedSolutionId } });
    }
  };

  const handleExportTelemetry = () => {
    const adoptionPlanId = selectedCustomerSolution?.adoptionPlan?.id;
    if (adoptionPlanId) {
      exportTelemetryTemplate({ variables: { solutionAdoptionPlanId: adoptionPlanId } });
    }
  };

  const handleImportTelemetry = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const adoptionPlanId = selectedCustomerSolution?.adoptionPlan?.id;

    if (!file || !adoptionPlanId) {
      alert('Please select a file and solution');
      return;
    }

    try {
      const result = await importSolutionTelemetry(adoptionPlanId, file);

      if (result.success) {
        refetch();
        refetchPlan();
        alert(`Import completed successfully!\nTasks processed: ${result.summary.tasksProcessed}\nAttributes updated: ${result.summary.attributesUpdated}`);
      } else {
        alert(`Import failed: ${result.summary.errors || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      alert(`Failed to import telemetry: ${err.message}`);
    }

    // Reset the input so the same file can be re-uploaded
    event.target.value = '';
  };



  if (!customerId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No Customer Selected
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select a customer from the dropdown to view their solutions
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load customer solutions: {error.message}
      </Alert>
    );
  }

  const customer = data?.customer;
  const customerSolutions = customer?.solutions || [];
  const selectedCustomerSolution = customerSolutions.find((cs: any) => cs.id === selectedSolutionId);

  return (
    <Box>
      {/* Solution Selector and Actions */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          mb: { xs: 2, md: 3 },
          borderRadius: 2,
          border: '1.5px solid',
          borderColor: '#E0E0E0'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 2 }, alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 300, flex: '1 1 300px' }} size="small">
            <InputLabel>Select Deployment</InputLabel>
            <Select
              value={selectedSolutionId || ''}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setAssignDialogOpen(true);
                } else {
                  setSelectedSolutionId(e.target.value);
                }
              }}
              label="Select Deployment"
            >
              {customerSolutions.map((cs: any) => (
                <MenuItem key={cs.id} value={cs.id}>
                  {cs.name ? `${cs.name} - ${cs.solution.name}` : cs.solution.name} ({cs.licenseLevel})
                </MenuItem>
              ))}
              <Divider />
              <MenuItem value="__NEW__" sx={{ color: 'primary.main', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Add fontSize="small" />
                  Assign New Solution
                </Box>
              </MenuItem>
            </Select>
          </FormControl>


          {selectedSolutionId && (
            <>
              {selectedCustomerSolution?.adoptionPlan && (
                <>
                  <Tooltip title={syncLoading ? 'Syncing...' : selectedCustomerSolution.adoptionPlan.needsSync ? 'Sync Needed' : 'Sync with latest solution tasks'}>
                    <span>
                      <IconButton
                        size="small"
                        color={selectedCustomerSolution.adoptionPlan.needsSync ? 'warning' : 'primary'}
                        onClick={() => syncPlan({ variables: { solutionAdoptionPlanId: selectedCustomerSolution.adoptionPlan.id } })}
                        disabled={syncLoading}
                      >
                        {/* Badge functionality isn't imported, checking file... import Grid ... Badge is NOT imported. 
                             I will use simple color change or just the icon. 
                             Wait, I can import Badge. */}
                        <Sync fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
              <Tooltip title="Edit solution licenses">
                <IconButton
                  size="small"
                  onClick={() => setEditLicensesDialogOpen(true)}
                  color="primary"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove solution assignment">
                <IconButton
                  size="small"
                  onClick={() => setDeleteConfirmDialogOpen(true)}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Solution Summary Cards */}
        {
          customerSolutions.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 3,
                backgroundColor: 'background.default',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="500">
                No Solutions Assigned Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                Solutions bundle multiple products together for unified adoption tracking and comprehensive progress monitoring
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAssignDialogOpen(true)}
              >
                Assign First Solution
              </Button>
            </Box>
          )
        }
      </Paper >

      {/* Adoption Plan View */}
      {
        selectedCustomerSolution?.adoptionPlan && (
          <SolutionAdoptionPlanView
            solutionAdoptionPlanId={selectedCustomerSolution.adoptionPlan.id}
            customerName={customer.name}
            lastSyncedAt={selectedCustomerSolution.adoptionPlan.lastSyncedAt}
          />
        )
      }

      {
        selectedSolutionId && !selectedCustomerSolution?.adoptionPlan && (
          <Alert severity="warning" sx={{ mt: 2 }} action={
            <Button
              color="inherit"
              size="small"
              onClick={async () => {
                try {
                  await createAdoptionPlan({
                    variables: { customerSolutionId: selectedSolutionId }
                  });
                  refetch();
                } catch (err: any) {
                  console.error('Failed to create adoption plan:', err);
                  alert('Failed to create adoption plan: ' + err.message);
                }
              }}
            >
              Create Now
            </Button>
          }>
            This solution does not have an adoption plan yet.
          </Alert>
        )
      }

      {/* Assign Solution Dialog */}
      <AssignSolutionDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        customerId={customerId}
        onSuccess={() => {
          refetch();
          setAssignDialogOpen(false);
        }}
      />

      {/* Edit Licenses Dialog */}
      {
        selectedSolutionId && (
          <EditSolutionLicensesDialog
            open={editLicensesDialogOpen}
            onClose={() => setEditLicensesDialogOpen(false)}
            customerSolutionId={selectedSolutionId}
            onSuccess={() => {
              refetch();
              refetchPlan();
              setEditLicensesDialogOpen(false);
            }}
          />
        )
      }

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialogOpen}
        onClose={() => setDeleteConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this solution from the customer? This will also remove:
          </Typography>
          <Box component="ul" sx={{ mt: 2 }}>
            <li>The solution adoption plan</li>
            <li>All underlying product assignments created from this solution</li>
            <li>All product adoption plans for those products</li>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={removeLoading}
          >
            {removeLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};


