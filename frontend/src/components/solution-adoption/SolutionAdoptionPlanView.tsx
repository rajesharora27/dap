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
import { Sync, Assessment, FilterList } from '@mui/icons-material';
import { gql, useQuery, useMutation } from '@apollo/client';
import { ProductAdoptionGroup } from './ProductAdoptionGroup';
import { SolutionTasksGroup } from './SolutionTasksGroup';
import { TelemetryImportResultDialog } from '../shared/TelemetryImportResultDialog';
import {
  downloadFileFromUrl,
  importProductTelemetry,
  importSolutionTelemetry,
  ImportResultDialogState
} from '../../utils/telemetryOperations';

const ALL_RELEASES_ID = '__ALL_RELEASES__';
const ALL_OUTCOMES_ID = '__ALL_OUTCOMES__';
const ALL_TAGS_ID = '__ALL_TAGS__';

const GET_SOLUTION_ADOPTION_PLAN = gql`
  query GetSolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      solutionName
      solutionId
      licenseLevel
      selectedOutcomes {
        id
        name
        description
      }
      selectedReleases {
        id
        name
        description
        level
      }
      progressPercentage
      totalTasks
      completedTasks
      solutionTasksTotal
      solutionTasksComplete
      needsSync
      lastSyncedAt
      customerSolution {
        id
        name
        tags {
          id
          name
          color
        }
        solution {
          id
          name
          outcomes {
            id
            name
            description
          }
          releases {
            id
            name
            description
            level
          }
        }
      }
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
                criteriaMet
              }
            }
            outcomes {
              id
              name
            }
            releases {
              id
              name
              level
            }
            tags {
              id
              name
              color
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
            criteriaMet
          }
        }
        tags {
          id
          name
          color
        }
        outcomes {
          id
          name
        }
        releases {
          id
          name
          level
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

// Export telemetry template for product adoption plan
const EXPORT_PRODUCT_TELEMETRY_TEMPLATE = gql`
  mutation ExportTelemetryTemplate($adoptionPlanId: ID!) {
    exportAdoptionPlanTelemetryTemplate(adoptionPlanId: $adoptionPlanId) {
      url
      filename
      taskCount
      attributeCount
    }
  }
`;

// Export telemetry template for solution adoption plan
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
  const [importResultDialog, setImportResultDialog] = useState<ImportResultDialogState>({
    open: false,
    success: false,
  });


  // Filter states for UI display filtering
  const [filterReleases, setFilterReleases] = useState<string[]>([]);
  const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

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

  // Export product telemetry template mutation
  const [exportProductTelemetryTemplate] = useMutation(EXPORT_PRODUCT_TELEMETRY_TEMPLATE, {
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

    // Filter by releases (multiple selection - task must have at least one selected release)
    if (filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) {
      tasks = tasks.filter((task: any) => {
        const hasSelectedRelease = task.releases?.some((release: any) =>
          filterReleases.includes(release.id)
        );
        return hasSelectedRelease;
      });
    }

    // Filter by outcomes (multiple selection - task must have at least one selected outcome)
    if (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) {
      tasks = tasks.filter((task: any) => {
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

      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: { xs: 2, md: 3 },
          borderRadius: 2,
          border: '1.5px solid',
          borderColor: '#E0E0E0'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: { xs: 2, md: 3 }, gap: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom fontWeight="600" color="primary.main">
              {plan.customerSolution.name} - {plan.customerSolution.solution.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer: <strong>{customerName}</strong> • Solution Adoption Plan
              {plan.lastSyncedAt && (
                <span style={{ marginLeft: '8px' }}>
                  • Last synced: {new Date(plan.lastSyncedAt).toLocaleDateString()}
                </span>
              )}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip title="Sync with latest solution tasks">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Sync />}
                color={plan.needsSync ? 'warning' : 'primary'}
                onClick={handleSync}
                disabled={syncLoading}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {syncLoading ? 'Syncing...' : plan.needsSync ? '⚠️ Sync' : 'Sync'}
              </Button>
            </Tooltip>
            <Chip
              label={plan.licenseLevel}
              color="primary"
              sx={{ fontWeight: 600, height: 32 }}
            />
          </Box>
        </Box>

        {/* Overall Progress */}
        <Box sx={{ mt: 3, p: 2.5, bgcolor: 'background.default', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" fontWeight="600">Overall Progress</Typography>
            <Typography variant="h6" color="primary" fontWeight="700">
              {Math.round(plan.progressPercentage)}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={plan.progressPercentage}
            sx={{ height: 12, borderRadius: 1, mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="600">📊</Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{plan.completedTasks}</strong> of <strong>{plan.totalTasks}</strong> tasks completed
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="600">🔗</Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{plan.products.length}</strong> products included
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Interactive Filters for Solution Tasks */}
      {allSolutionTasks.length > 0 && (
        <Paper
          elevation={1}
          sx={{
            p: 2.5,
            mb: 2,
            bgcolor: '#E0F7FA',
            border: '1.5px solid',
            borderColor: '#B2EBF2',
            borderRadius: 2,
            borderLeft: '4px solid',
            borderLeftColor: '#00ACC1'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterList fontSize="small" sx={{ color: '#00838F' }} />
            <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#00838F' }}>
              Filter Solution Tasks
            </Typography>
            {((filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) ||
              (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) ||
              (filterTags.length > 0 && !filterTags.includes(ALL_TAGS_ID))) && (
                <Chip
                  label={`Showing ${solutionTasks.length} of ${allSolutionTasks.length} tasks`}
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: '#00ACC1',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* License Level Display */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" fontWeight="600">
                License Level:
              </Typography>
              <Chip label={plan.licenseLevel} size="small" color="secondary" />
              <Typography variant="caption" color="text.secondary">
                (Tasks filtered by license level at assignment)
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            {/* Releases Filter */}
            {availableReleases.length > 0 ? (
              <FormControl sx={{ minWidth: 250 }} size="small">
                <InputLabel>Filter by Release</InputLabel>
                <Select
                  multiple
                  value={filterReleases}
                  onChange={(e) => {
                    const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                    if (value.includes(ALL_RELEASES_ID)) {
                      if (filterReleases.includes(ALL_RELEASES_ID)) {
                        setFilterReleases([]);
                      } else {
                        setFilterReleases([ALL_RELEASES_ID]);
                      }
                    } else {
                      setFilterReleases(value);
                    }
                  }}
                  input={<OutlinedInput label="Filter by Release" />}
                  renderValue={(selected) => {
                    if (selected.includes(ALL_RELEASES_ID)) return 'All Releases';
                    if (selected.length === 0) return 'All Releases';
                    return `${selected.length} selected`;
                  }}
                >
                  <MenuItem value={ALL_RELEASES_ID}>
                    <Checkbox checked={filterReleases.includes(ALL_RELEASES_ID) || filterReleases.length === 0} />
                    <ListItemText primary="All Releases" />
                  </MenuItem>
                  {availableReleases.map((release: any) => (
                    <MenuItem key={release.id} value={release.id}>
                      <Checkbox checked={filterReleases.includes(release.id)} disabled={filterReleases.includes(ALL_RELEASES_ID)} />
                      <ListItemText primary={`${release.name} (v${release.level})`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ flex: 1 }}>
                <Typography variant="caption">
                  No releases tagged on solution tasks. Add releases to tasks to enable release filtering.
                </Typography>
              </Alert>
            )}

            {/* Tags Filter */}
            {availableTags.length > 0 ? (
              <FormControl sx={{ minWidth: 250 }} size="small">
                <InputLabel>Filter by Tag</InputLabel>
                <Select
                  multiple
                  value={filterTags}
                  onChange={(e) => {
                    const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                    if (value.includes(ALL_TAGS_ID)) {
                      if (filterTags.includes(ALL_TAGS_ID)) {
                        setFilterTags([]);
                      } else {
                        setFilterTags([ALL_TAGS_ID]);
                      }
                    } else {
                      setFilterTags(value);
                    }
                  }}
                  input={<OutlinedInput label="Filter by Tag" />}
                  renderValue={(selected) => {
                    if (selected.includes(ALL_TAGS_ID)) return 'All Tags';
                    if (selected.length === 0) return 'All Tags';
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const tag = availableTags.find((t: any) => t.id === value);
                          return (
                            <Chip
                              key={value}
                              label={tag?.name || 'Unknown'}
                              size="small"
                              sx={{
                                bgcolor: tag?.color,
                                color: '#fff',
                                height: 20,
                                '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 600 }
                              }}
                            />
                          );
                        })}
                      </Box>
                    );
                  }}
                >
                  <MenuItem value={ALL_TAGS_ID}>
                    <Checkbox checked={filterTags.includes(ALL_TAGS_ID) || filterTags.length === 0} />
                    <ListItemText primary="All Tags" />
                  </MenuItem>
                  {availableTags.map((tag: any) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      <Checkbox checked={filterTags.includes(tag.id)} disabled={filterTags.includes(ALL_TAGS_ID)} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: tag.color
                          }}
                        />
                        <ListItemText primary={tag.name} />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ flex: 1 }}>
                <Typography variant="caption">
                  No tags available.
                </Typography>
              </Alert>
            )}

            {/* Outcomes Filter */}
            {availableOutcomes.length > 0 ? (
              <FormControl sx={{ minWidth: 250 }} size="small">
                <InputLabel>Filter by Outcome</InputLabel>
                <Select
                  multiple
                  value={filterOutcomes}
                  onChange={(e) => {
                    const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                    if (value.includes(ALL_OUTCOMES_ID)) {
                      if (filterOutcomes.includes(ALL_OUTCOMES_ID)) {
                        setFilterOutcomes([]);
                      } else {
                        setFilterOutcomes([ALL_OUTCOMES_ID]);
                      }
                    } else {
                      setFilterOutcomes(value);
                    }
                  }}
                  input={<OutlinedInput label="Filter by Outcome" />}
                  renderValue={(selected) => {
                    if (selected.includes(ALL_OUTCOMES_ID)) return 'All Outcomes';
                    if (selected.length === 0) return 'All Outcomes';
                    return `${selected.length} selected`;
                  }}
                >
                  <MenuItem value={ALL_OUTCOMES_ID}>
                    <Checkbox checked={filterOutcomes.includes(ALL_OUTCOMES_ID) || filterOutcomes.length === 0} />
                    <ListItemText primary="All Outcomes" />
                  </MenuItem>
                  {availableOutcomes.map((outcome: any) => (
                    <MenuItem key={outcome.id} value={outcome.id}>
                      <Checkbox checked={filterOutcomes.includes(outcome.id)} disabled={filterOutcomes.includes(ALL_OUTCOMES_ID)} />
                      <ListItemText primary={outcome.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ flex: 1 }}>
                <Typography variant="caption">
                  No outcomes tagged on solution tasks. Add outcomes to tasks to enable outcome filtering.
                </Typography>
              </Alert>
            )}

            {/* Clear Filters Button */}
            {((filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) ||
              (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) ||
              (filterTags.length > 0 && !filterTags.includes(ALL_TAGS_ID))) && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setFilterReleases([]);
                    setFilterOutcomes([]);
                    setFilterTags([]);
                  }}
                  sx={{ alignSelf: 'center' }}
                >
                  Clear Filters
                </Button>
              )}
          </Box>
        </Paper>
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


