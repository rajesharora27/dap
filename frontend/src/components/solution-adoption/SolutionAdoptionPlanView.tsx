import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Sync, Assessment, FileDownload } from '@mui/icons-material';
import { gql, useQuery, useMutation } from '@apollo/client';
import { ProductAdoptionGroup } from './ProductAdoptionGroup';
import { SolutionTasksGroup } from './SolutionTasksGroup';

const GET_SOLUTION_ADOPTION_PLAN = gql`
  query GetSolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      solutionName
      licenseLevel
      progressPercentage
      totalTasks
      completedTasks
      solutionTasksTotal
      solutionTasksComplete
      products {
        id
        productId
        productName
        status
        progressPercentage
        totalTasks
        completedTasks
        productAdoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
          tasks {
            id
            name
            description
            notes
            status
            weight
            sequenceNumber
            statusUpdatedAt
            statusUpdatedBy
            statusUpdateSource
            statusNotes
            licenseLevel
            howToDoc
            howToVideo
            telemetryAttributes {
              id
              name
              description
              dataType
              successCriteria
              isMet
              values {
                id
                value
                createdAt
                notes
              }
            }
            outcomes {
              id
              name
            }
            releases {
              id
              name
            }
          }
        }
      }
      tasks {
        id
        originalTaskId
        name
        description
        notes
        status
        weight
        sequenceNumber
        sourceType
        sourceProductId
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        statusNotes
        licenseLevel
        howToDoc
        howToVideo
        telemetryAttributes {
          id
          name
          description
          dataType
          successCriteria
          isMet
          values {
            id
            value
            createdAt
            notes
          }
        }
      }
    }
  }
`;

const UPDATE_CUSTOMER_SOLUTION_TASK_STATUS = gql`
  mutation UpdateCustomerSolutionTaskStatus($input: UpdateCustomerSolutionTaskStatusInput!) {
    updateCustomerSolutionTaskStatus(input: $input) {
      id
      status
    }
  }
`;

const UPDATE_CUSTOMER_TASK_STATUS = gql`
  mutation UpdateCustomerTaskStatus($input: UpdateCustomerTaskStatusInput!) {
    updateCustomerTaskStatus(input: $input) {
      id
      status
      statusUpdatedAt
      statusUpdatedBy
      statusUpdateSource
      statusNotes
    }
  }
`;

const SYNC_SOLUTION_ADOPTION_PLAN = gql`
  mutation SyncSolutionAdoptionPlan($solutionAdoptionPlanId: ID!) {
    syncSolutionAdoptionPlan(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
    }
  }
`;

interface Props {
  solutionAdoptionPlanId: string;
  customerName: string;
}

export const SolutionAdoptionPlanView: React.FC<Props> = ({
  solutionAdoptionPlanId,
  customerName
}) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, error: queryError, refetch } = useQuery(GET_SOLUTION_ADOPTION_PLAN, {
    variables: { id: solutionAdoptionPlanId },
    skip: !solutionAdoptionPlanId
  });

  const [updateSolutionTaskStatus] = useMutation(UPDATE_CUSTOMER_SOLUTION_TASK_STATUS, {
    onCompleted: () => {
      refetch();
      setSuccess('Solution task status updated successfully');
    },
    onError: (err) => setError(err.message)
  });

  const [updateProductTaskStatus] = useMutation(UPDATE_CUSTOMER_TASK_STATUS, {
    refetchQueries: ['GetSolutionAdoptionPlan'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetch();
      setSuccess('Product task status updated successfully');
    },
    onError: (err) => setError(err.message)
  });

  const [syncPlan, { loading: syncLoading }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
    onCompleted: () => {
      refetch();
      setSuccess('Solution adoption plan synced successfully');
    },
    onError: (err) => setError(err.message)
  });

  if (!solutionAdoptionPlanId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No Solution Adoption Plan Selected
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select a solution from the dropdown to view its adoption plan
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (queryError || !data?.solutionAdoptionPlan) {
    return (
      <Alert severity="error">
        Failed to load solution adoption plan: {queryError?.message}
      </Alert>
    );
  }

  const plan = data.solutionAdoptionPlan;

  // Get solution-specific tasks (not product tasks)
  const solutionTasks: any[] = [];
  plan.tasks.forEach((task: any) => {
    if (task.sourceType === 'SOLUTION') {
      solutionTasks.push(task);
    }
  });

  // Get product tasks from their actual AdoptionPlans (not from stale CustomerSolutionTask entries)
  const productTasks: { [productId: string]: any[] } = {};
  plan.products.forEach((product: any) => {
    if (product.productAdoptionPlan && product.productAdoptionPlan.tasks) {
      productTasks[product.productId] = product.productAdoptionPlan.tasks;
    }
  });

  // Calculate solution-specific task progress using WEIGHTS (excluding NOT_APPLICABLE)
  const applicableSolutionTasks = solutionTasks.filter(t => t.status !== 'NOT_APPLICABLE');
  const solutionTasksCompleted = applicableSolutionTasks.filter(t => 
    t.status === 'COMPLETED' || t.status === 'DONE'
  ).length;
  
  // Use weight-based progress calculation
  const totalSolutionWeight = applicableSolutionTasks.reduce((sum, task) => sum + (Number(task.weight) || 0), 0);
  const completedSolutionWeight = applicableSolutionTasks
    .filter(t => t.status === 'COMPLETED' || t.status === 'DONE')
    .reduce((sum, task) => sum + (Number(task.weight) || 0), 0);
  
  const solutionTasksProgress = totalSolutionWeight > 0 
    ? (completedSolutionWeight / totalSolutionWeight) * 100 
    : 0;

  const handleUpdateSolutionTaskStatus = (taskId: string, newStatus: string, notes?: string) => {
    updateSolutionTaskStatus({
      variables: {
        input: {
          customerSolutionTaskId: taskId,
          status: newStatus,
          notes: notes || undefined,
          updateSource: 'MANUAL'
        }
      }
    });
  };

  const handleUpdateProductTaskStatus = (taskId: string, newStatus: string, notes?: string) => {
    updateProductTaskStatus({
      variables: {
        input: {
          customerTaskId: taskId,
          status: newStatus,
          notes: notes || undefined
        }
      }
    });
  };

  const handleSync = () => {
    syncPlan({
      variables: {
        solutionAdoptionPlanId
      }
    });
  };

  return (
    <Box>
      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {plan.solutionName} - Adoption Plan
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Customer: {customerName}
            </Typography>
          </Box>
          
          <Chip label={`License: ${plan.licenseLevel}`} color="primary" />
        </Box>

        {/* Overall Progress */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Overall Progress</Typography>
            <Typography variant="h6" color="primary">
              {Math.round(plan.progressPercentage)}%
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={plan.progressPercentage}
            sx={{ height: 12, borderRadius: 1, mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              📊 {plan.completedTasks} of {plan.totalTasks} tasks completed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🔗 {plan.products.length} products included
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Sync />}
            onClick={handleSync}
            disabled={syncLoading}
          >
            {syncLoading ? 'Syncing...' : 'Sync Plan'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            disabled
          >
            Re-evaluate Tasks
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            disabled
          >
            Generate Report
          </Button>
        </Box>
      </Paper>

      {/* Product Groups */}
      {plan.products.map((product: any) => (
      <ProductAdoptionGroup
        key={product.id}
        product={{
          ...product,
          progressPercentage: product.progressPercentage || 0
        }}
        tasks={productTasks[product.productId] || []}
          onUpdateTaskStatus={handleUpdateProductTaskStatus}
          onViewProductPlan={(planId) => {
            console.log('Navigate to product plan:', planId);
          }}
        />
      ))}

      {/* Solution-Specific Tasks */}
      {solutionTasks.length > 0 && (
        <SolutionTasksGroup
          progress={solutionTasksProgress}
          totalTasks={applicableSolutionTasks.length}
          completedTasks={solutionTasksCompleted}
          tasks={solutionTasks}
          onUpdateTaskStatus={handleUpdateSolutionTaskStatus}
        />
      )}

      {plan.products.length === 0 && solutionTasks.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No tasks found in this adoption plan. Click "Sync Plan" to refresh.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};


