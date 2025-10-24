import * as React from 'react';
import { useState } from 'react';
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
  Divider
} from '@mui/material';
import { Add, Edit, Delete, Sync } from '@mui/icons-material';
import { gql, useQuery, useMutation } from '@apollo/client';
import { AssignSolutionDialog } from './dialogs/AssignSolutionDialog';
import { EditSolutionEntitlementsDialog } from './dialogs/EditSolutionEntitlementsDialog';
import { SolutionAdoptionPlanView } from './solution-adoption/SolutionAdoptionPlanView';

const GET_CUSTOMER_SOLUTIONS = gql`
  query GetCustomerSolutions($customerId: ID!) {
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

const SYNC_SOLUTION_ADOPTION_PLAN = gql`
  mutation SyncSolutionAdoptionPlan($solutionAdoptionPlanId: ID!) {
    syncSolutionAdoptionPlan(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
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
  query GetSolutionAdoptionPlan($id: ID!) {
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

interface Props {
  customerId: string;
}

export const CustomerSolutionPanel: React.FC<Props> = ({ customerId }) => {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editEntitlementsDialogOpen, setEditEntitlementsDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER_SOLUTIONS, {
    variables: { customerId },
    skip: !customerId
  });

  const { data: planData, refetch: refetchPlan } = useQuery(GET_SOLUTION_ADOPTION_PLAN, {
    variables: { id: data?.customer?.solutions?.find((cs: any) => cs.id === selectedSolutionId)?.adoptionPlan?.id },
    skip: !selectedSolutionId || !data?.customer?.solutions?.find((cs: any) => cs.id === selectedSolutionId)?.adoptionPlan
  });

  const [createAdoptionPlan] = useMutation(CREATE_SOLUTION_ADOPTION_PLAN, {
    onCompleted: () => {
      refetch();
    },
    onError: (err) => {
      console.error('Error creating adoption plan:', err);
    }
  });

  const [syncPlan, { loading: syncLoading }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
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

  const handleSync = () => {
    const adoptionPlanId = selectedCustomerSolution?.adoptionPlan?.id;
    if (adoptionPlanId) {
      syncPlan({ variables: { solutionAdoptionPlanId: adoptionPlanId } });
    }
  };

  const handleDelete = () => {
    if (selectedSolutionId) {
      removeSolution({ variables: { id: selectedSolutionId } });
    }
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 300, flex: '1 1 300px' }} size="small">
            <InputLabel>Select Solution</InputLabel>
            <Select
              value={selectedSolutionId || ''}
              onChange={(e) => setSelectedSolutionId(e.target.value)}
              label="Select Solution"
            >
              {customerSolutions.map((cs: any) => (
                <MenuItem key={cs.id} value={cs.id}>
                  {cs.solution.name} ({cs.licenseLevel})
                  {cs.name && ` - ${cs.name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setAssignDialogOpen(true)}
          >
            Assign Solution
          </Button>

          {selectedSolutionId && selectedCustomerSolution?.adoptionPlan && (
            <>
              <Tooltip title="Edit license and outcomes">
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<Edit />}
                  onClick={() => setEditEntitlementsDialogOpen(true)}
                >
                  Edit
                </Button>
              </Tooltip>
              <Tooltip title="Sync with latest solution/product tasks">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Sync />}
                  color={planData?.solutionAdoptionPlan?.needsSync ? 'warning' : 'primary'}
                  onClick={handleSync}
                  disabled={syncLoading}
                >
                  {syncLoading ? 'Syncing...' : `Sync ${planData?.solutionAdoptionPlan?.needsSync ? '⚠️' : ''}`}
                </Button>
              </Tooltip>
              <Tooltip title="Remove this solution from customer">
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteConfirmDialogOpen(true)}
                  disabled={removeLoading}
                >
                  Delete
                </Button>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Solution Summary Cards */}
        {customerSolutions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No solutions assigned to this customer yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Solutions bundle multiple products together for unified adoption tracking
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAssignDialogOpen(true)}
            >
              Assign First Solution
            </Button>
          </Box>
        )}
      </Paper>

      {/* Adoption Plan View */}
      {selectedCustomerSolution?.adoptionPlan && (
        <SolutionAdoptionPlanView
          solutionAdoptionPlanId={selectedCustomerSolution.adoptionPlan.id}
          customerName={customer.name}
        />
      )}

      {selectedSolutionId && !selectedCustomerSolution?.adoptionPlan && (
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
      )}

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

      {/* Edit Entitlements Dialog */}
      {selectedSolutionId && (
        <EditSolutionEntitlementsDialog
          open={editEntitlementsDialogOpen}
          onClose={() => setEditEntitlementsDialogOpen(false)}
          customerSolutionId={selectedSolutionId}
          onSuccess={() => {
            refetch();
            refetchPlan();
            setEditEntitlementsDialogOpen(false);
          }}
        />
      )}

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
    </Box>
  );
};


