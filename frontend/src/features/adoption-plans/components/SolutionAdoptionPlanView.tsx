import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Tooltip
} from '@mui/material';
import { Sync, Assessment } from '@shared/components/FAIcon';
import { ColumnVisibilityToggle } from '@shared/components/ColumnVisibilityToggle';
import { ADOPTION_TASK_COLUMNS, DEFAULT_ADOPTION_VISIBLE_COLUMNS } from './AdoptionTaskTable';
import { AdoptionPlanProgressCard } from './AdoptionPlanProgressCard';
import { AdoptionPlanFilterSection } from './AdoptionPlanFilterSection';
import { gql, useQuery, useMutation } from '@apollo/client';
import { ProductAdoptionGroup } from './ProductAdoptionGroup';
import { SolutionTasksGroup } from './SolutionTasksGroup';
import { TelemetryImportResultDialog } from './TelemetryImportResultDialog';
import {
  downloadFileFromUrl,
  importProductTelemetry,
  importSolutionTelemetry,
  ImportResultDialogState
} from '@/features/telemetry/utils/telemetryOperations';

const ALL_RELEASES_ID = '__ALL_RELEASES__';
const ALL_OUTCOMES_ID = '__ALL_OUTCOMES__';
const ALL_TAGS_ID = '__ALL_TAGS__';

import {
  SOLUTION_ADOPTION_PLAN,
  SYNC_SOLUTION_ADOPTION_PLAN,
  EXPORT_TELEMETRY_TEMPLATE,
  EXPORT_SOLUTION_TELEMETRY_TEMPLATE,
  UPDATE_TASK_STATUS
} from '@features/customers';

const UPDATE_CUSTOMER_SOLUTION_TASK_STATUS = gql`
  mutation UpdateCustomerSolutionTaskStatus($input: UpdateCustomerSolutionTaskStatusInput!) {
    updateCustomerSolutionTaskStatus(input: $input) {
      id
      status
    }
  }
`;

interface Props {
  solutionAdoptionPlanId: string;
  customerName: string;
  lastSyncedAt?: string;
}

export const SolutionAdoptionPlanView: React.FC<Props> = ({
  solutionAdoptionPlanId,
  customerName,
  lastSyncedAt
}) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importResultDialog, setImportResultDialog] = useState<ImportResultDialogState>({
    open: false,
    success: false,
  });


  // Filter states for UI display filtering
  const [filterReleases, setFilterReleases] = useState<string[]>([]);
  const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // Column visibility state with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('dap_adoption_plan_columns_v2');
    return saved ? JSON.parse(saved) : DEFAULT_ADOPTION_VISIBLE_COLUMNS;
  });

  // Persist column visibility to localStorage
  React.useEffect(() => {
    localStorage.setItem('dap_adoption_plan_columns_v2', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Handle column toggle
  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const { data, loading, error: queryError, refetch } = useQuery(SOLUTION_ADOPTION_PLAN, {
    variables: { id: solutionAdoptionPlanId },
    skip: !solutionAdoptionPlanId
  });

  // Refetch when lastSyncedAt changes (triggered by parent sync)
  React.useEffect(() => {
    if (lastSyncedAt) {
      refetch();
    }
  }, [lastSyncedAt, refetch]);

  const [updateSolutionTaskStatus] = useMutation(UPDATE_CUSTOMER_SOLUTION_TASK_STATUS, {
    refetchQueries: ['Customers', 'SolutionAdoptionPlan'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetch();
      setSuccess('Solution task status updated successfully');
    },
    onError: (err) => setError(err.message)
  });

  const [updateProductTaskStatus] = useMutation(UPDATE_TASK_STATUS, {
    refetchQueries: ['Customers', 'SolutionAdoptionPlan'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetch();
      setSuccess('Product task status updated successfully');
    },
    onError: (err) => setError(err.message)
  });


  const [syncPlan, { loading: syncLoading }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
    refetchQueries: ['Customers', 'SolutionAdoptionPlan'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetch();
      setSuccess('Solution adoption plan synced successfully');
    },
    onError: (err) => setError(err.message)
  });


  // Export product telemetry template mutation
  const [exportProductTelemetryTemplate] = useMutation(EXPORT_TELEMETRY_TEMPLATE, {
    onCompleted: async (data) => {
      const { url, filename } = data.exportAdoptionPlanTelemetryTemplate;
      try {
        await downloadFileFromUrl(url, filename);
        setSuccess('Template exported successfully');
      } catch (err: any) {
        setError(`Download failed: ${err.message}`);
      }
    },
    onError: (err) => setError(`Export failed: ${err.message}`)
  });

  // Export solution telemetry template mutation
  const [exportSolutionTelemetryTemplate] = useMutation(EXPORT_SOLUTION_TELEMETRY_TEMPLATE, {
    onCompleted: async (data) => {
      const { url, filename } = data.exportSolutionAdoptionPlanTelemetryTemplate;
      try {
        await downloadFileFromUrl(url, filename);
        setSuccess('Template exported successfully');
      } catch (err: any) {
        setError(`Download failed: ${err.message}`);
      }
    },
    onError: (err) => setError(`Export failed: ${err.message}`)
  });

  // Extract solution tasks (must be called before any conditional returns - rules of hooks)
  const allSolutionTasks = useMemo(() => {
    if (!data?.solutionAdoptionPlan) return [];
    const tasks: any[] = [];
    data.solutionAdoptionPlan.tasks.forEach((task: any) => {
      if (task.sourceType === 'SOLUTION') {
        tasks.push(task);
      }
    });
    return tasks;
  }, [data]);

  // Get available releases and outcomes for filters - use ALL solution outcomes/releases, not just those on tasks
  const availableReleases = useMemo(() => {
    if (!data?.solutionAdoptionPlan?.customerSolution?.solution?.releases) return [];
    // Return all solution-level releases, sorted by level
    return [...data.solutionAdoptionPlan.customerSolution.solution.releases]
      .sort((a: any, b: any) => a.level - b.level);
  }, [data]);

  const availableOutcomes = useMemo(() => {
    if (!data?.solutionAdoptionPlan?.customerSolution?.solution?.outcomes) return [];
    // Return all solution-level outcomes, sorted by name
    return [...data.solutionAdoptionPlan.customerSolution.solution.outcomes]
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [data]);

  // Get available tags for filter dropdown - from customerSolution.tags
  const availableTags = useMemo(() => {
    if (!data?.solutionAdoptionPlan?.customerSolution?.tags) return [];
    return [...data.solutionAdoptionPlan.customerSolution.tags]
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [data]);

  // Apply UI filters to solution tasks
  const solutionTasks = useMemo(() => {
    let tasks = [...allSolutionTasks];

    // Filter by releases (include tasks with NO releases - applies to all)
    if (filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) {
      tasks = tasks.filter((task: any) => {
        // Tasks with no releases apply to ALL releases
        if (!task.releases || task.releases.length === 0) return true;
        const hasSelectedRelease = task.releases?.some((release: any) =>
          filterReleases.includes(release.id)
        );
        return hasSelectedRelease;
      });
    }

    // Filter by outcomes (multiple selection - task must have at least one selected outcome)
    if (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) {
      tasks = tasks.filter((task: any) => {
        // Include tasks with NO outcomes (generic tasks)
        if (!task.outcomes || task.outcomes.length === 0) return true;

        const hasSelectedOutcome = task.outcomes?.some((outcome: any) =>
          filterOutcomes.includes(outcome.id)
        );
        return hasSelectedOutcome;
      });
    }

    // Filter by tags (multiple selection - task must have at least one selected tag)
    if (filterTags.length > 0 && !filterTags.includes(ALL_TAGS_ID)) {
      tasks = tasks.filter((task: any) => {
        const hasSelectedTag = task.tags?.some((tag: any) =>
          tag && filterTags.includes(tag.id)
        );
        return hasSelectedTag;
      });
    }

    return tasks;
  }, [allSolutionTasks, filterReleases, filterOutcomes, filterTags]);

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

  // Handlers for product telemetry
  const handleExportProductTelemetry = (adoptionPlanId: string) => {
    exportProductTelemetryTemplate({ variables: { adoptionPlanId } });
  };

  const handleImportProductTelemetry = async (adoptionPlanId: string, file: File) => {
    try {
      const result = await importProductTelemetry(adoptionPlanId, file);
      refetch();
      setImportResultDialog({
        open: true,
        success: result.success,
        summary: result.summary,
        taskResults: result.taskResults,
        errorMessage: result.error,
      });
    } catch (err: any) {
      setImportResultDialog({
        open: true,
        success: false,
        errorMessage: err.message,
      });
    }
  };

  // Handlers for solution telemetry
  const handleExportSolutionTelemetry = () => {
    exportSolutionTelemetryTemplate({ variables: { solutionAdoptionPlanId } });
  };

  const handleImportSolutionTelemetry = async (file: File) => {
    try {
      const result = await importSolutionTelemetry(solutionAdoptionPlanId, file);
      refetch();
      setImportResultDialog({
        open: true,
        success: result.success,
        summary: result.summary,
        taskResults: result.taskResults,
        errorMessage: result.error,
      });
    } catch (err: any) {
      setImportResultDialog({
        open: true,
        success: false,
        errorMessage: err.message,
      });
    }
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

      <AdoptionPlanProgressCard
        licenseLevel={plan.licenseLevel}
        completedTasks={plan.completedTasks}
        totalTasks={plan.totalTasks}
        percentage={plan.progressPercentage}
        productsCount={plan.products.length}
        color="#3B82F6"
      />

      {/* Interactive Filters for Solution Tasks */}
      {allSolutionTasks.length > 0 && (
        <AdoptionPlanFilterSection
          filterTags={filterTags}
          setFilterTags={setFilterTags}
          availableTags={availableTags}
          filterOutcomes={filterOutcomes}
          setFilterOutcomes={setFilterOutcomes}
          availableOutcomes={availableOutcomes}
          filterReleases={filterReleases}
          setFilterReleases={setFilterReleases}
          availableReleases={availableReleases}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          columns={ADOPTION_TASK_COLUMNS}
          totalFilteredTasks={solutionTasks.length}
          totalTasks={allSolutionTasks.length}
          title="Filter Solution Tasks"
        />
      )}

      {/* Solution-Specific Tasks - Shown First */}
      {solutionTasks.length > 0 && (
        <SolutionTasksGroup
          progress={solutionTasksProgress}
          totalTasks={applicableSolutionTasks.length}
          completedTasks={solutionTasksCompleted}
          tasks={solutionTasks}
          onUpdateTaskStatus={handleUpdateSolutionTaskStatus}
          onExportTelemetry={handleExportSolutionTelemetry}
          onImportTelemetry={handleImportSolutionTelemetry}
          visibleColumns={visibleColumns}
        />
      )}

      {/* Product Groups - Shown After Solution Tasks */}
      {plan.products.map((product: any) => (
        <ProductAdoptionGroup
          key={product.id}
          product={{
            ...product,
            progressPercentage: product.progressPercentage || 0,
            productAdoptionPlanId: product.productAdoptionPlan?.id
          }}
          tasks={productTasks[product.productId] || []}
          onUpdateTaskStatus={handleUpdateProductTaskStatus}
          onViewProductPlan={(planId) => {
            console.log('Navigate to product plan:', planId);
          }}
          onExportTelemetry={handleExportProductTelemetry}
          onImportTelemetry={handleImportProductTelemetry}
          visibleColumns={visibleColumns}
          planOutcomes={product.productAdoptionPlan?.selectedOutcomes || []}
          planReleases={product.productAdoptionPlan?.selectedReleases || []}
          isPartOfSolution={true}
        />
      ))}

      {plan.products.length === 0 && solutionTasks.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No tasks found in this adoption plan. Click "Sync Plan" to refresh.
          </Typography>
        </Paper>
      )}

      {/* Import Result Dialog */}
      <TelemetryImportResultDialog
        state={importResultDialog}
        onClose={() => setImportResultDialog({ ...importResultDialog, open: false })}
      />
    </Box>
  );
};


