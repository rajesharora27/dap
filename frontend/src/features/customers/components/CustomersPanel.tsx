import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';
import { ALL_OUTCOMES_ID, ALL_RELEASES_ID } from '@features/tasks';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Checkbox,
  OutlinedInput,
  Menu,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Download,
  Upload,
  Sync,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  HourglassEmpty,
  TrendingUp,
  TrendingDown,
  NotInterested,
  Article,
  OndemandVideo,
  Assessment,
  Label,
  KeyboardArrowDown,
  Link as LinkIcon,
} from '@shared/components/FAIcon';
import { Widgets as ProductIcon, Settings } from '@mui/icons-material';
import {
  Grid,
  Avatar,
  ListItemAvatar,
  Stack,
  CircularProgress as MuiCircularProgress,
} from '@mui/material';
import { CustomerDialog } from './CustomerDialog';
import { AssignProductDialog } from '@features/products';
import { EditEntitlementsDialog } from './EditEntitlementsDialog';
import { AssignSolutionDialog } from './AssignSolutionDialog';
import { EditSolutionEntitlementsDialog } from './EditSolutionEntitlementsDialog';
import { CustomerSolutionPanel } from './CustomerSolutionPanel';
import { getApiUrl } from '@/config/frontend.config';
import { getStatusBackgroundColor, getStatusColor, getStatusChipColor, getUpdateSourceChipColor, formatStatus } from '@/utils/statusStyles';
import { formatSuccessCriteria } from '@/utils/criteriaFormatter';
import { TaskDetailsDialog, TaskDetailsData } from '@shared/components/TaskDetailsDialog';
import { useAuth } from '@features/auth';
import { importProductTelemetry, downloadFileFromUrl } from '@/utils/telemetryOperations';



// GraphQL Queries
const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      description
      products {
        id
        name
        customerSolutionId
        product {
          id
          name
        }
        licenseLevel
        selectedOutcomes {
          id
          name
          description
        }
        selectedReleases {
          id
          name
          level
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
        }
      }
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
          totalTasks
          completedTasks
          needsSync
        }
      }
      overviewMetrics {
        adoption
        velocity
        totalTasks
        completedTasks
        productsCount
        solutionsCount
        directProductsCount
        solutionProductsCount
      }
    }
  }
`;


const GET_ADOPTION_PLAN = gql`
  query GetAdoptionPlan($id: ID!) {
    adoptionPlan(id: $id) {
      id
      progressPercentage
      totalTasks
      completedTasks
      totalWeight
      completedWeight
      needsSync
      lastSyncedAt
      licenseLevel
      filterPreference {
        id
        filterReleases
        filterOutcomes
        filterTags
      }
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
        level
      }
      customerProduct {
        tags {
          id
          name
          color
          description
        }
      }
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
          description
        }
      }
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($input: UpdateCustomerTaskStatusInput!) {
    updateCustomerTaskStatus(input: $input) {
      id
      status
      statusUpdatedAt
      statusUpdatedBy
      statusUpdateSource
      statusNotes
      adoptionPlan {
        id
        totalTasks
        completedTasks
        progressPercentage
      }
      tags {
        id
        name
        color
        description
      }
    }
  }
`;

const UPDATE_FILTER_PREFERENCE = gql`
  mutation UpdateAdoptionPlanFilterPreference($input: UpdateFilterPreferenceInput!) {
    updateAdoptionPlanFilterPreference(input: $input) {
      id
      adoptionPlanId
      filterReleases
      filterOutcomes
      filterTags
    }
  }
`;

const SYNC_ADOPTION_PLAN = gql`
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
        level
      }
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
          description
        }
      }
    }
  }
`;



const UPDATE_CUSTOMER_PRODUCT = gql`
  mutation UpdateCustomerProduct($id: ID!, $input: UpdateCustomerProductInput!) {
    updateCustomerProduct(id: $id, input: $input) {
      id
      licenseLevel
      selectedOutcomes {
        id
        name
        description
      }
      selectedReleases {
        id
        name
        level
      }
      adoptionPlan {
        id
        needsSync
        licenseLevel
        selectedOutcomes {
          id
          name
        }
        selectedReleases {
          id
          name
          level
        }
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
  }
`;

const REMOVE_PRODUCT_FROM_CUSTOMER = gql`
  mutation RemoveProductFromCustomer($id: ID!) {
    removeProductFromCustomerEnhanced(id: $id) {
      success
      message
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

const SYNC_SOLUTION_ADOPTION_PLAN = gql`
  mutation SyncSolutionAdoptionPlan($solutionAdoptionPlanId: ID!) {
    syncSolutionAdoptionPlan(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
      tasks {
        id
        tags {
          id
          name
          color
          description
        }
      }
      products {
        id
        productAdoptionPlan {
          id
          customerProduct {
            tags {
              id
              name
              color
              description
            }
          }
          tasks {
            id
            tags {
              id
              name
              color
              description
            }
          }
        }
      }
    }
  }
`;

const EXPORT_CUSTOMER_ADOPTION = gql`
  mutation ExportCustomerAdoption($customerId: ID!, $customerProductId: ID!) {
    exportCustomerAdoptionToExcel(customerId: $customerId, customerProductId: $customerProductId) {
      filename
      content
      mimeType
      size
    }
  }
`;

const IMPORT_CUSTOMER_ADOPTION = gql`
  mutation ImportCustomerAdoption($content: String!) {
    importCustomerAdoptionFromExcel(content: $content) {
      success
      message
      stats {
        telemetryValuesAdded
      }
    }
  }
`;

const EXPORT_TELEMETRY_TEMPLATE = gql`
  mutation ExportTelemetryTemplate($adoptionPlanId: ID!) {
    exportAdoptionPlanTelemetryTemplate(adoptionPlanId: $adoptionPlanId) {
      url
      filename
      taskCount
      attributeCount
    }
  }
`;

const IMPORT_TELEMETRY = gql`
  mutation ImportTelemetry($adoptionPlanId: ID!, $file: Upload!) {
    importAdoptionPlanTelemetry(adoptionPlanId: $adoptionPlanId, file: $file) {
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

const EVALUATE_ALL_SOLUTION_TASKS_TELEMETRY = gql`
  mutation EvaluateAllSolutionTasksTelemetry($solutionAdoptionPlanId: ID!) {
    evaluateAllSolutionTasksTelemetry(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      tasks {
        id
        name
        status
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        telemetryAttributes {
          id
          isMet
        }
      }
    }
  }
`;

interface StatusDialogState {
  open: boolean;
  taskId: string;
  taskName: string;
  currentStatus: string;
}

interface ImportResultDialog {
  open: boolean;
  success: boolean;
  summary?: {
    tasksProcessed: number;
    attributesUpdated: number;
    criteriaEvaluated: number;
    errors: string[];
  };
  taskResults?: Array<{
    taskName: string;
    criteriaMet: number;
    criteriaTotal: number;
    completionPercentage: number;
  }>;
  errorMessage?: string;
}

interface CustomersPanelProps {
  selectedCustomerId: string | null;
  onRequestAddCustomer?: () => void;
  forceTab?: 'main' | 'products' | 'solutions';
  hideTabs?: boolean;
}

export function CustomersPanel({ selectedCustomerId, onRequestAddCustomer, forceTab, hideTabs }: CustomersPanelProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'products' | 'solutions'>(forceTab || 'main');

  // Sync activeTab with forceTab when it changes
  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab);
    }
  }, [forceTab]);
  const [selectedCustomerProductId, setSelectedCustomerProductId] = useState<string | null>(null);
  const [selectedCustomerSolutionId, setSelectedCustomerSolutionId] = useState<string | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
  const [assignSolutionDialogOpen, setAssignSolutionDialogOpen] = useState(false);
  const [editEntitlementsDialogOpen, setEditEntitlementsDialogOpen] = useState(false);
  const [editSolutionEntitlementsDialogOpen, setEditSolutionEntitlementsDialogOpen] = useState(false);
  const [cannotEditProductDialogOpen, setCannotEditProductDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [deleteSolutionDialogOpen, setDeleteSolutionDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Collapsible sections state
  const [productAssignmentsExpanded, setProductAssignmentsExpanded] = useState(true);
  const [solutionAssignmentsExpanded, setSolutionAssignmentsExpanded] = useState(true);

  // Individual sync loading states
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);
  const [syncingSolutionId, setSyncingSolutionId] = useState<string | null>(null);

  // Filter states - releases and outcomes support multiple selections
  // Note: License filter removed - tasks are pre-filtered by assigned license level
  const [filterReleases, setFilterReleases] = useState<string[]>([]);
  const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    taskId: '',
    taskName: '',
    currentStatus: 'NOT_STARTED',
  });
  const [statusNotes, setStatusNotes] = useState('');
  const [importResultDialog, setImportResultDialog] = useState<ImportResultDialog>({
    open: false,
    success: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State for howToDoc and howToVideo dropdown menus
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);

  const { data, loading, refetch } = useQuery(GET_CUSTOMERS, {
    fetchPolicy: 'cache-and-network',
  });

  const selectedCustomer = React.useMemo(() =>
    data?.customers?.find((c: any) => c.id === selectedCustomerId),
    [data?.customers, selectedCustomerId]
  );

  // Calculate Overview Metrics
  const overviewMetrics = React.useMemo(() => {
    if (selectedCustomer?.overviewMetrics) {
      return selectedCustomer.overviewMetrics;
    }

    // Fallback for when data is still loading or not available
    return { adoption: 0, velocity: 0, totalTasks: 0, completedTasks: 0, productsCount: 0, solutionsCount: 0, directProductsCount: 0, solutionProductsCount: 0 };
  }, [selectedCustomer?.overviewMetrics]);


  // Sort products: directly assigned first, then solution-based
  const sortedProducts = React.useMemo(() => {
    if (!selectedCustomer?.products) return [];

    return [...selectedCustomer.products].sort((a: any, b: any) => {
      const aIsDirect = !a.customerSolutionId;
      const bIsDirect = !b.customerSolutionId;

      // Direct products come first
      if (aIsDirect && !bIsDirect) return -1;
      if (!aIsDirect && bIsDirect) return 1;

      // Within each group, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [selectedCustomer?.products]);

  const selectedCustomerProduct = React.useMemo(() =>
    sortedProducts?.find((cp: any) => cp.id === selectedCustomerProductId),
    [sortedProducts, selectedCustomerProductId]
  );

  const adoptionPlanId = selectedCustomerProduct?.adoptionPlan?.id;

  const { data: planData, loading: planLoading, error: planError, refetch: refetchPlan } = useQuery(GET_ADOPTION_PLAN, {
    variables: { id: adoptionPlanId },
    skip: !adoptionPlanId,
    fetchPolicy: 'cache-and-network',
  });

  // Mutation for saving filter preferences
  const [saveFilterPreference] = useMutation(UPDATE_FILTER_PREFERENCE);

  // Track if we've initialized filters from loaded preference
  const [filtersInitialized, setFiltersInitialized] = React.useState(false);

  // Initialize filters from persisted preference when plan data loads
  useEffect(() => {
    if (planData?.adoptionPlan?.filterPreference && !filtersInitialized) {
      const pref = planData.adoptionPlan.filterPreference;
      setFilterReleases(pref.filterReleases || []);
      setFilterOutcomes(pref.filterOutcomes || []);
      setFilterTags(pref.filterTags || []);
      setFiltersInitialized(true);
    }
  }, [planData?.adoptionPlan?.filterPreference, filtersInitialized]);

  // Reset initialization flag when adoption plan changes
  useEffect(() => {
    setFiltersInitialized(false);
  }, [adoptionPlanId]);

  // Save filter preference when filters change (debounced)
  const saveFiltersTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Don't save if we haven't initialized yet or if no plan ID
    if (!filtersInitialized || !adoptionPlanId) return;

    // Debounce saves to avoid too many requests
    if (saveFiltersTimeoutRef.current) {
      clearTimeout(saveFiltersTimeoutRef.current);
    }

    saveFiltersTimeoutRef.current = setTimeout(() => {
      saveFilterPreference({
        variables: {
          input: {
            adoptionPlanId,
            filterReleases,
            filterOutcomes,
            filterTags,
          },
        },
      }).catch((err: any) => {
        console.error('Failed to save filter preference:', err);
      });
    }, 500); // 500ms debounce

    return () => {
      if (saveFiltersTimeoutRef.current) {
        clearTimeout(saveFiltersTimeoutRef.current);
      }
    };
  }, [filterReleases, filterOutcomes, filterTags, adoptionPlanId, filtersInitialized, saveFilterPreference]);

  // Auto-select first product when customer is selected or products change
  useEffect(() => {
    if (sortedProducts.length > 0 && !selectedCustomerProductId) {
      // Prioritize Cisco Secure Access
      const defaultProduct = sortedProducts.find((p: any) => p.name.includes("Cisco Secure Access")) || sortedProducts[0];
      setSelectedCustomerProductId(defaultProduct.id);
    }
  }, [selectedCustomerId, sortedProducts.length, selectedCustomerProductId, sortedProducts]);

  // Filter tasks based on release and outcome
  // Note: Tasks are already pre-filtered by license level (based on product assignment)
  const filteredTasks = React.useMemo(() => {
    if (!planData?.adoptionPlan?.tasks) return [];

    let tasks = planData.adoptionPlan.tasks.filter((task: any) => {
      // Filter by releases (multiple selection - task must have at least one selected release)
      // Skip filtering if "All" is selected or no filter is active
      if (filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) {
        const hasSelectedRelease = task.releases?.some((release: any) =>
          filterReleases.includes(release.id)
        );
        if (!hasSelectedRelease) return false;
      }

      // Filter by outcomes (multiple selection - task must have at least one selected outcome)
      // Skip filtering if "All" is selected or no filter is active
      if (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID)) {
        const hasSelectedOutcome = task.outcomes?.some((outcome: any) =>
          filterOutcomes.includes(outcome.id)
        );
        if (!hasSelectedOutcome) return false;
      }

      // Filter by tags
      if (filterTags.length > 0) {
        // Check if task has any of the selected tags
        // task.tags is array of Tag { id, name, color }
        const hasSelectedTag = task.tags?.some((tag: any) =>
          tag && filterTags.includes(tag.id)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    });

    // Sort by sequence number (natural order from product definition)
    tasks = [...tasks].sort((a: any, b: any) => {
      const aSeq = a.sequenceNumber || 0;
      const bSeq = b.sequenceNumber || 0;
      return aSeq - bSeq;
    });

    return tasks;
  }, [planData?.adoptionPlan?.tasks, filterReleases, filterOutcomes, filterTags]);

  // Get releases and outcomes for filter dropdowns - always from entitlements (synced from product)
  const availableReleases = React.useMemo(() => {
    // Use entitlements directly - sync populates these with all product releases
    if (!planData?.adoptionPlan?.selectedReleases) return [];
    return [...planData.adoptionPlan.selectedReleases].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [planData?.adoptionPlan?.selectedReleases]);

  const availableOutcomes = React.useMemo(() => {
    // Use entitlements directly - sync populates these with all product outcomes
    if (!planData?.adoptionPlan?.selectedOutcomes) return [];
    return [...planData.adoptionPlan.selectedOutcomes].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [planData?.adoptionPlan?.selectedOutcomes]);

  const availableTags = React.useMemo(() => {
    // Use synced tags from customer product (similar to outcomes)
    if (!planData?.adoptionPlan?.customerProduct?.tags) return [];

    // Sort tags by name
    return [...planData.adoptionPlan.customerProduct.tags].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [planData?.adoptionPlan?.customerProduct?.tags]);

  // Calculate progress based on filtered tasks using WEIGHTS (excluding NOT_APPLICABLE)
  const filteredProgress = React.useMemo(() => {
    // Filter out NOT_APPLICABLE tasks - they should not count towards progress
    const applicableTasks = filteredTasks.filter((task: any) => task.status !== 'NOT_APPLICABLE');

    if (!applicableTasks.length) return { totalTasks: 0, completedTasks: 0, totalWeight: 0, completedWeight: 0, percentage: 0 };

    const completedTasks = applicableTasks.filter((task: any) =>
      task.status === 'COMPLETED' || task.status === 'DONE'
    ).length;

    // Calculate WEIGHT-BASED progress (not task count)
    const totalWeight = applicableTasks.reduce((sum: number, task: any) => sum + (Number(task.weight) || 0), 0);
    const completedWeight = applicableTasks
      .filter((task: any) => task.status === 'COMPLETED' || task.status === 'DONE')
      .reduce((sum: number, task: any) => sum + (Number(task.weight) || 0), 0);

    const percentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    return {
      totalTasks: applicableTasks.length,
      completedTasks,
      totalWeight,
      completedWeight,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    };
  }, [filteredTasks]);

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setSuccess('Customer created successfully');
      setCustomerDialogOpen(false);
    },
    onError: (err) => setError(err.message),
  });

  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setSuccess('Customer updated successfully');
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
    },
    onError: (err) => setError(err.message),
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setSuccess('Customer deleted successfully');
      // Note: Customer will be deselected in the parent App component
      setSelectedCustomerProductId(null);
    },
    onError: (err) => setError(err.message),
  });

  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS, {
    refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetchPlan();
      refetch(); // Refresh to update progress in customer list
      setSuccess('Task status updated successfully');
      setStatusDialog({ ...statusDialog, open: false });
      setStatusNotes('');
    },
    onError: (err) => setError(err.message),
  });

  const [syncAdoptionPlan, { loading: syncLoading }] = useMutation(SYNC_ADOPTION_PLAN, {
    refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setSyncingProductId(null);
      refetchPlan();
      refetch();
      setSuccess('Adoption plan synced successfully');
    },
    onError: (err) => {
      setSyncingProductId(null);
      console.error('Sync error:', err);
      setError(`Failed to sync: ${err.message}`);
    },
  });



  const [updateCustomerProduct] = useMutation(UPDATE_CUSTOMER_PRODUCT, {
    refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setEditEntitlementsDialogOpen(false);
      refetchPlan();
      refetch();
      setSuccess('Product entitlements updated successfully. Use the Sync button to update tasks.');
    },
    onError: (err) => setError(err.message),
  });

  const [removeProduct, { loading: removeLoading }] = useMutation(REMOVE_PRODUCT_FROM_CUSTOMER, {
    refetchQueries: ['GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setSelectedCustomerProductId(null);
      refetch();
      setSuccess('Product removed from customer successfully');
    },
    onError: (err) => {
      console.error('Remove product error:', err);
      setError(`Failed to remove product: ${err.message}`);
    },
  });

  const [removeSolution, { loading: removeSolutionLoading }] = useMutation(REMOVE_SOLUTION_FROM_CUSTOMER, {
    refetchQueries: ['GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setSelectedCustomerSolutionId(null);
      refetch();
      setSuccess('Solution removed from customer successfully');
    },
    onError: (err) => {
      console.error('Remove solution error:', err);
      setError(`Failed to remove solution: ${err.message}`);
    },
  });

  const [syncSolutionPlan, { loading: syncSolutionLoading }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
    refetchQueries: ['GetCustomers', 'GetAdoptionPlan'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setSyncingSolutionId(null);
      refetch();
      setSuccess('Solution adoption plan synced successfully');
    },
    onError: (err) => {
      setSyncingSolutionId(null);
      setError(err.message);
    },
  });

  const [exportCustomerAdoption] = useMutation(EXPORT_CUSTOMER_ADOPTION, {
    onCompleted: (data) => {
      const { content, filename } = data.exportCustomerAdoptionToExcel;
      const blob = new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Export completed successfully');
    },
    onError: (err) => setError(err.message),
  });

  const [importCustomerAdoption] = useMutation(IMPORT_CUSTOMER_ADOPTION, {
    onCompleted: (data) => {
      if (data.importCustomerAdoptionFromExcel.success) {
        setSuccess(`Import successful: ${data.importCustomerAdoptionFromExcel.message}`);
        refetchPlan();
        refetch();
      } else {
        setError(data.importCustomerAdoptionFromExcel.message || 'Import failed');
      }
    },
    onError: (err) => setError(err.message),
  });

  const [exportTelemetryTemplate] = useMutation(EXPORT_TELEMETRY_TEMPLATE, {
    onCompleted: async (data) => {
      console.log('Export mutation completed:', data);
      const { url, filename } = data.exportAdoptionPlanTelemetryTemplate;
      console.log('Export URL:', url, 'Filename:', filename);

      try {
        // For file downloads, prepend base path if deployed at subpath (e.g., /dap/)
        // In development: url = /api/downloads/... (Vite proxy forwards to backend)
        // In production with subpath: url = /dap/api/downloads/... (Apache proxy forwards to backend)
        const basePath = import.meta.env.BASE_URL || '/';
        const fileUrl = basePath === '/' ? url : `${basePath.replace(/\/$/, '')}${url}`;
        console.log('File URL:', fileUrl, 'Base Path:', basePath);

        const response = await fetch(fileUrl, {
          credentials: 'include',
        });

        console.log('Fetch response status:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }

        console.log('Response headers:', {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          contentDisposition: response.headers.get('content-disposition'),
        });

        // Get as arrayBuffer to ensure binary data is preserved
        const arrayBuffer = await response.arrayBuffer();
        console.log('Downloaded bytes:', arrayBuffer.byteLength);

        // Check first few bytes to verify it's a valid Excel file (should start with PK)
        const firstBytes = new Uint8Array(arrayBuffer.slice(0, Math.min(100, arrayBuffer.byteLength)));
        const header = Array.from(firstBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('File header (first 4 bytes):', header, 'Expected: 504b0304');

        // Log first 100 bytes as string to see if it's HTML/JSON
        const textDecoder = new TextDecoder();
        const previewText = textDecoder.decode(firstBytes);
        console.log('Content preview (first 100 chars):', previewText);

        if (header !== '504b0304' && header !== '504b0506') {
          console.error('Invalid Excel file header! File may be corrupted or wrong content type');
          console.error('This might be an HTML error page or JSON response instead of an Excel file');
          throw new Error('Downloaded file is not a valid Excel file');
        }

        const blob = new Blob([arrayBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        console.log('Creating download link...');
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'telemetry_template.xlsx';
        link.style.display = 'none';
        document.body.appendChild(link);
        console.log('Triggering download...');
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
          console.log('Download URL revoked');
        }, 5000);

        setSuccess(`Telemetry template exported: ${filename}`);
      } catch (err: any) {
        console.error('Telemetry export download failed:', err);
        setError(`Failed to download template: ${err.message}`);
      }
    },
    onError: (err) => {
      console.error('Export mutation error:', err);
      setError(`Failed to export telemetry template: ${err.message}`);
    },
  });

  const [importTelemetry] = useMutation(IMPORT_TELEMETRY, {
    onCompleted: (data) => {
      if (data.importAdoptionPlanTelemetry.success) {
        const summary = data.importAdoptionPlanTelemetry.summary;
        const taskResults = data.importAdoptionPlanTelemetry.taskResults;
        const totalCriteriaMet = taskResults.reduce((sum: number, task: any) => sum + task.criteriaMet, 0);
        const errors = summary.errors || [];

        let message = `✅ Telemetry Import Successful!\n\n`;
        message += `📊 Summary:\n`;
        message += `  • Tasks Processed: ${summary.tasksProcessed}\n`;
        message += `  • Attributes Updated: ${summary.attributesUpdated}\n`;
        message += `  • Criteria Evaluated: ${summary.criteriaEvaluated}\n`;
        message += `  • Criteria Met: ${totalCriteriaMet}/${summary.criteriaEvaluated}\n\n`;

        if (taskResults.length > 0) {
          message += `📋 Task Details:\n`;
          taskResults.forEach((task: any) => {
            const percentage = task.completionPercentage || 0;
            message += `  • ${task.taskName}: ${task.criteriaMet}/${task.criteriaTotal} criteria met (${percentage}%)\n`;
          });
          message += `\n`;
        }

        if (errors.length > 0) {
          message += `⚠️ Warnings:\n`;
          errors.forEach((error: string) => {
            message += `  • ${error}\n`;
          });
          message += `\n`;
        }

        message += `🔄 Task statuses have been automatically evaluated and updated.`;

        setSuccess(message);
        refetchPlan();
        refetch();
      } else {
        const errors = data.importAdoptionPlanTelemetry.summary?.errors || [];
        let errorMessage = '❌ Telemetry import failed';
        if (errors.length > 0) {
          errorMessage += ':\n\n';
          errors.forEach((error: string) => {
            errorMessage += `  • ${error}\n`;
          });
        }
        setError(errorMessage);
      }
    },
    onError: (err) => setError(`❌ Failed to import telemetry: ${err.message}`),
  });

  // Auto-update task status when all telemetry criteria are met
  useEffect(() => {
    if (selectedTask && selectedTask.telemetryAttributes && selectedTask.telemetryAttributes.length > 0) {
      const attributesWithCriteria = selectedTask.telemetryAttributes.filter((attr: any) =>
        attr.successCriteria && attr.successCriteria !== 'No criteria'
      ).length;
      const attributesWithCriteriaMet = selectedTask.telemetryAttributes.filter((attr: any) =>
        attr.values?.some((v: any) => v.criteriaMet === true)
      ).length;
      const allCriteriaMet = attributesWithCriteria > 0 && attributesWithCriteriaMet === attributesWithCriteria;

      console.log('Telemetry auto-update check:', {
        taskId: selectedTask.id,
        taskName: selectedTask.name,
        taskStatus: selectedTask.status,
        attributesWithCriteria,
        attributesWithCriteriaMet,
        allCriteriaMet
      });

      // Auto-update if all criteria met and task is not already DONE
      if (allCriteriaMet && selectedTask.status !== 'DONE') {
        console.log('All telemetry criteria met - auto-updating task status to DONE');
        updateTaskStatus({
          variables: {
            input: {
              customerTaskId: selectedTask.id,
              status: 'DONE',
              notes: 'Automatically marked as done via telemetry criteria',
              updateSource: 'TELEMETRY'
            }
          }
        }).then(() => {
          console.log('Task status updated successfully via telemetry');
          // Don't call setSelectedTask here to avoid infinite loop
          // The task data will be refetched automatically via refetchPlan
          setSuccess('Task automatically marked as DONE via telemetry criteria ✓');
          refetchPlan();
        }).catch((err) => {
          console.error('Failed to auto-update task status:', err);
          setError(`Failed to auto-update task: ${err.message}`);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTask?.telemetryAttributes, selectedTask?.id, selectedTask?.status, updateTaskStatus]);

  const handleProductChange = (customerProductId: string) => {
    setSelectedCustomerProductId(customerProductId);
  };

  const handleAddCustomer = React.useCallback(() => {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  }, []);

  // Expose the add customer handler to parent component
  React.useEffect(() => {
    if (onRequestAddCustomer) {
      // Store the handler globally so the parent can trigger it
      (window as any).__openAddCustomerDialog = handleAddCustomer;
    }
    return () => {
      delete (window as any).__openAddCustomerDialog;
    };
  }, [onRequestAddCustomer, handleAddCustomer]);

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      setCustomerDialogOpen(true);
    }
  };

  // Expose the edit customer handler to parent component
  React.useEffect(() => {
    (window as any).__openEditCustomerDialog = handleEditCustomer;
    return () => {
      delete (window as any).__openEditCustomerDialog;
    };
  }, [selectedCustomer]);

  const handleDeleteCustomer = () => {
    if (selectedCustomer && confirm(`Delete customer "${selectedCustomer.name}"?`)) {
      deleteCustomer({ variables: { id: selectedCustomer.id } });
    }
  };

  // Expose the delete customer handler to parent component
  React.useEffect(() => {
    (window as any).__deleteCustomer = handleDeleteCustomer;
    return () => {
      delete (window as any).__deleteCustomer;
    };
  }, [selectedCustomer]);

  const handleSaveCustomer = async (input: any) => {
    if (editingCustomer) {
      await updateCustomer({ variables: { id: editingCustomer.id, input } });
    } else {
      await createCustomer({ variables: { input } });
    }
  };

  const handleStatusChange = (taskId: string, taskName: string, newStatus: string) => {
    setStatusDialog({
      open: true,
      taskId,
      taskName,
      currentStatus: newStatus,
    });
  };

  const handleStatusSave = (newStatus: string) => {
    updateTaskStatus({
      variables: {
        input: {
          customerTaskId: statusDialog.taskId,
          status: newStatus,
          notes: statusNotes || undefined,
        },
      },
    });
  };

  const handleExport = () => {
    if (!selectedCustomerId || !selectedCustomerProduct) {
      setError('Please select a product');
      return;
    }
    exportCustomerAdoption({
      variables: {
        customerId: selectedCustomerId,
        customerProductId: selectedCustomerProduct.id,
      },
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (content instanceof ArrayBuffer) {
        const bytes = new Uint8Array(content);
        const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        const base64 = btoa(binary);
        importCustomerAdoption({ variables: { content: base64 } });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSync = () => {
    if (adoptionPlanId) {
      syncAdoptionPlan({ variables: { adoptionPlanId } });
    }
  };

  const handleEvaluateTasks = () => {
    if (adoptionPlanId) {
      // evaluateAllTasksTelemetry({ variables: { adoptionPlanId } });
      console.warn('evaluateAllTasksTelemetry not implemented yet');
    }
  };

  const handleEditProductEntitlements = () => {
    if (selectedCustomerProduct?.customerSolutionId) {
      // Product is part of a solution - show warning dialog
      setCannotEditProductDialogOpen(true);
    } else {
      // Standalone product - allow editing
      setEditEntitlementsDialogOpen(true);
    }
  };

  const handleDeleteProduct = () => {
    if (selectedCustomerProduct?.customerSolutionId) {
      // Product is part of a solution - show warning dialog
      setCannotEditProductDialogOpen(true);
    } else {
      // Standalone product - allow deletion
      setDeleteProductDialogOpen(true);
    }
  };

  const handleRemoveProduct = () => {
    if (selectedCustomerProduct) {
      removeProduct({ variables: { id: selectedCustomerProduct.id } });
      setDeleteProductDialogOpen(false);
    }
  };

  const handleDeleteSolution = () => {
    setDeleteSolutionDialogOpen(true);
  };

  const handleRemoveSolution = () => {
    if (selectedCustomerSolutionId) {
      removeSolution({ variables: { id: selectedCustomerSolutionId } });
      setDeleteSolutionDialogOpen(false);
    }
  };

  const handleExportTelemetry = async () => {
    if (!adoptionPlanId) {
      setError('No adoption plan found');
      return;
    }
    try {
      const { data: exportData } = await exportTelemetryTemplate({ variables: { adoptionPlanId } });
      if (exportData?.exportAdoptionPlanTelemetryTemplate) {
        const { url, filename } = exportData.exportAdoptionPlanTelemetryTemplate;
        await downloadFileFromUrl(url, filename);
      }
    } catch (err: any) {
      setError(`Export failed: ${err.message}`);
    }
  };


  const handleImportTelemetry = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adoptionPlanId) {
      if (!adoptionPlanId) setError('No adoption plan found');
      return;
    }

    try {
      const result = await importProductTelemetry(adoptionPlanId, file);

      // Show result in dialog
      setImportResultDialog({
        open: true,
        success: result.success,
        summary: result.summary,
        taskResults: result.taskResults,
      });

      if (result.success) {
        refetchPlan();
        refetch();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(`❌ Failed to import telemetry: ${err.message}`);
    }

    // Reset the input so the same file can be re-uploaded
    event.target.value = '';
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'NOT_APPLICABLE': return 'default';
      case 'NO_LONGER_USING': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle fontSize="small" />;
      case 'IN_PROGRESS': return <HourglassEmpty fontSize="small" />;
      case 'NOT_STARTED': return <TrendingUp fontSize="small" />;
      case 'NOT_APPLICABLE': return <NotInterested fontSize="small" />;
      case 'NO_LONGER_USING': return <TrendingDown fontSize="small" />;
      default: return undefined;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          {success}
        </Alert>
      )}

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedCustomer ? (
          <>
            {/* Header with Customer Info - Only show in standalone mode */}
            {!hideTabs && (
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>


                {/* Tabs for Main, Products and Solutions */}
                <Box sx={{
                  mt: 2,
                  backgroundColor: 'background.paper',
                  borderRadius: '12px 12px 0 0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderBottom: '3px solid',
                  borderColor: 'primary.main',
                }}>
                  <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                      '& .MuiTabs-indicator': {
                        height: 4,
                        borderRadius: '4px 4px 0 0',
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiTab-root': {
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'none',
                        minWidth: 100,
                        py: 1.5,
                        px: 3,
                        color: 'text.secondary',
                        borderRadius: '12px 12px 0 0',
                        '&.Mui-selected': {
                          color: 'primary.main',
                          backgroundColor: 'rgba(4, 159, 217, 0.08)',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          color: 'primary.main',
                        },
                      },
                    }}
                  >
                    <Tab label="Overview" value="main" />
                    <Tab label="Products Assigned" value="products" />
                    <Tab label="Solutions Assigned" value="solutions" />
                  </Tabs>
                </Box>
              </Box >
            )}

            {/* Main Tab Content */}
            {
              activeTab === 'main' && (
                <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
                  <Box sx={{ width: '100%', maxWidth: 1200 }}>
                    {/* KPI Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      {/* Adoption Health */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                Overall Adoption
                              </Typography>
                              <TrendingUp fontSize="small" color={overviewMetrics.adoption >= 70 ? 'success' : overviewMetrics.adoption >= 40 ? 'warning' : 'error'} />
                            </Box>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <MuiCircularProgress
                                variant="determinate"
                                value={100}
                                size={120}
                                sx={{ color: 'grey.200', position: 'absolute' }}
                              />
                              <MuiCircularProgress
                                variant="determinate"
                                value={overviewMetrics.adoption}
                                size={120}
                                sx={{
                                  color: overviewMetrics.adoption >= 70 ? 'success.main' :
                                    overviewMetrics.adoption >= 40 ? 'warning.main' : 'error.main'
                                }}
                              />
                              <Box
                                sx={{
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  right: 0,
                                  position: 'absolute',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography variant="h4" component="div" fontWeight={700} sx={{
                                  color: overviewMetrics.adoption >= 70 ? 'success.main' :
                                    overviewMetrics.adoption >= 40 ? 'warning.main' : 'error.main'
                                }}>
                                  {Math.round(overviewMetrics.adoption)}%
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Tasks Completed / Velocity */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                              <Typography variant="h2" fontWeight={700} color="primary.main">
                                {overviewMetrics.completedTasks}
                              </Typography>
                              <Typography variant="h4" fontWeight={500} color="text.secondary" sx={{ mx: 1 }}>
                                /
                              </Typography>
                              <Typography variant="h3" fontWeight={600} color="text.secondary">
                                {overviewMetrics.totalTasks}
                              </Typography>
                            </Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Tasks Completed
                            </Typography>
                            <Box sx={{ width: '100%', px: 2, mt: 1, mb: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={overviewMetrics.totalTasks > 0 ? (overviewMetrics.completedTasks / overviewMetrics.totalTasks) * 100 : 0}
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: 'info.50', px: 1, py: 0.5, borderRadius: 1 }}>
                              <Assessment fontSize="small" color="info.main" />
                              <Typography variant="caption" color="info.main" fontWeight={600}>
                                {overviewMetrics.velocity} in last 30 days
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Portfolio */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                          <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', py: 3 }}>
                            <Stack direction="row" justifyContent="space-around" divider={<Divider orientation="vertical" flexItem />}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Stack direction="row" alignItems="baseline" spacing={0.5} justifyContent="center">
                                  <Typography variant="h3" fontWeight={700} color="success.main">
                                    {overviewMetrics.directProductsCount}
                                  </Typography>
                                  <Typography variant="h3" fontWeight={500} color="text.secondary">
                                    +
                                  </Typography>
                                  <Typography variant="h3" fontWeight={700} color="primary.main">
                                    {overviewMetrics.solutionProductsCount}
                                  </Typography>
                                  <Typography variant="h3" fontWeight={500} color="text.secondary">
                                    =
                                  </Typography>
                                  <Typography variant="h3" fontWeight={700} color="text.primary">
                                    {overviewMetrics.productsCount}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                                  <ProductIcon fontSize="small" color="success" />
                                  <Typography variant="body2" color="text.secondary">
                                    Products
                                  </Typography>
                                </Stack>
                              </Box>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" fontWeight={700} color="primary.main">
                                  {overviewMetrics.solutionsCount}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                                  <LinkIcon fontSize="small" color="primary" />
                                  <Typography variant="body2" color="text.secondary">
                                    Solution
                                  </Typography>
                                </Stack>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Product List */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Product Assignments
                      </Typography>
                      <Button
                        startIcon={<Add />}
                        variant="contained"
                        size="small"
                        color="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignProductDialogOpen(true);
                        }}
                      >
                        Assign Product
                      </Button>
                    </Box>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <List disablePadding>
                        {selectedCustomer?.products && selectedCustomer.products.length > 0 ? (
                          selectedCustomer.products.map((cp: any, index: number) => {
                            const isSolution = !!cp.customerSolutionId;
                            const progress = cp.adoptionPlan?.progressPercentage || 0;

                            // Format synched time
                            let syncedText = 'Never synced';
                            if (cp.adoptionPlan?.lastSyncedAt) {
                              const diff = new Date().getTime() - new Date(cp.adoptionPlan.lastSyncedAt).getTime();
                              const hours = Math.floor(diff / (1000 * 60 * 60));
                              const days = Math.floor(hours / 24);
                              if (days > 0) syncedText = `Synced ${days}d ago`;
                              else if (hours > 0) syncedText = `Synced ${hours}h ago`;
                              else syncedText = 'Synced just now';
                            }

                            return (
                              <React.Fragment key={cp.id}>
                                {index > 0 && <Divider />}
                                <ListItemButton
                                  onClick={() => {
                                    setSelectedCustomerProductId(cp.id);
                                    setActiveTab('products');
                                  }}
                                  sx={{ py: 2 }}
                                >
                                  <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: 'grey.300', color: isSolution ? 'primary.main' : 'success.main' }}>
                                      {isSolution ? <LinkIcon /> : <ProductIcon />}
                                    </Avatar>
                                  </ListItemAvatar>

                                  <ListItemText
                                    primary={
                                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                        <Typography variant="subtitle1" fontWeight={600} color={isSolution ? 'primary.main' : 'success.main'}>
                                          {isSolution ? cp.name : `${cp.product.name}`}
                                        </Typography>
                                        <Chip
                                          label={cp.licenseLevel}
                                          size="small"
                                          color={isSolution ? 'primary' : 'secondary'}
                                          variant="outlined"
                                          sx={{ height: 20, fontSize: '0.75rem' }}
                                        />
                                        {isSolution && (
                                          <Chip
                                            label="Via Solution"
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                          />
                                        )}
                                      </Stack>
                                    }
                                    secondary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                              flex: 1,
                                              height: 8,
                                              borderRadius: 4,
                                              bgcolor: 'grey.100',
                                              '& .MuiLinearProgress-bar': {
                                                bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
                                                borderRadius: 4
                                              }
                                            }}
                                          />
                                          <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ minWidth: 35 }}>
                                            {Math.round(progress)}%
                                          </Typography>
                                        </Box>
                                      </Box>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                  />

                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, ml: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      {cp.adoptionPlan && (
                                        <Tooltip title="Sync adoption plan">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSyncingProductId(cp.adoptionPlan.id);
                                              syncAdoptionPlan({ variables: { adoptionPlanId: cp.adoptionPlan.id } });
                                            }}
                                            disabled={syncingProductId === cp.adoptionPlan.id}
                                          >
                                            {syncingProductId === cp.adoptionPlan.id ? <MuiCircularProgress size={20} /> : <Sync fontSize="small" />}
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      <Tooltip title={isSolution ? "Cannot edit solution-derived assignment" : "Edit Assignment"}>
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isSolution) {
                                                setSelectedCustomerProductId(cp.id);
                                                handleEditProductEntitlements();
                                              }
                                            }}
                                            disabled={isSolution}
                                          >
                                            <Edit fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title={isSolution ? "Cannot remove solution-derived assignment" : "Remove Assignment"}>
                                        <span>
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isSolution) {
                                                setSelectedCustomerProductId(cp.id);
                                                setDeleteProductDialogOpen(true);
                                              }
                                            }}
                                            disabled={isSolution}
                                          >
                                            <Delete fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                      {syncedText}
                                    </Typography>
                                  </Box>
                                </ListItemButton>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <ListItem>
                            <ListItemText primary="No products assigned" />
                          </ListItem>
                        )}
                      </List>
                    </Paper>

                    {/* Solution List */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Solution Assignments
                      </Typography>
                      <Button
                        startIcon={<Add />}
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignSolutionDialogOpen(true);
                        }}
                      >
                        Assign Solution
                      </Button>
                    </Box>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <List disablePadding>
                        {selectedCustomer?.solutions && selectedCustomer.solutions.length > 0 ? (
                          selectedCustomer.solutions.map((cs: any, index: number) => {
                            const progress = cs.adoptionPlan?.progressPercentage || 0;

                            return (
                              <React.Fragment key={cs.id}>
                                {index > 0 && <Divider />}
                                <ListItemButton
                                  onClick={() => {
                                    setSelectedCustomerSolutionId(cs.id);
                                    setActiveTab('solutions');
                                  }}
                                  sx={{ py: 2 }}
                                >
                                  <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: 'grey.300', color: 'primary.main' }}>
                                      <LinkIcon />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                          {cs.name} - {cs.solution.name}
                                        </Typography>
                                        <Chip
                                          label={cs.licenseLevel}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ height: 20, fontSize: '0.75rem' }}
                                        />
                                      </Box>
                                    }
                                    secondary={
                                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <Assessment fontSize="small" sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                          <Typography variant="caption" color="text.secondary">
                                            {progress}% Complete
                                          </Typography>
                                        </Box>
                                      </Box>
                                    }
                                  />

                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
                                    {cs.adoptionPlan && (
                                      <Tooltip title="Sync solution plan">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSyncingSolutionId(cs.adoptionPlan.id);
                                            syncSolutionPlan({ variables: { solutionAdoptionPlanId: cs.adoptionPlan.id } });
                                          }}
                                          disabled={syncingSolutionId === cs.adoptionPlan.id}
                                        >
                                          {syncingSolutionId === cs.adoptionPlan.id ? <MuiCircularProgress size={20} /> : <Sync fontSize="small" />}
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <Tooltip title="Edit Solution">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCustomerSolutionId(cs.id);
                                          setEditSolutionEntitlementsDialogOpen(true);
                                        }}
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove Solution">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCustomerSolutionId(cs.id);
                                          setDeleteSolutionDialogOpen(true);
                                        }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </ListItemButton>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <ListItem>
                            <ListItemText
                              primary={
                                <Typography variant="body2" color="text.secondary" align="center">
                                  No solutions assigned
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}
                      </List>
                    </Paper>
                  </Box>
                </Box >
              )
            }


            {/* Products Tab Content */}
            {
              activeTab === 'products' && (
                <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: 1400, p: { xs: 1.5, sm: 2, md: 0 } }}>
                    {/* Product Selection */}
                    <Box
                      sx={{
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                        mb: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1.5px solid',
                        borderColor: '#E0E0E0'
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl sx={{ minWidth: 300 }} size="small">
                          <InputLabel>Select Deployment</InputLabel>
                          <Select
                            value={selectedCustomerProductId || ''}
                            onChange={(e) => handleProductChange(e.target.value)}
                            label="Select Deployment"
                          >
                            {sortedProducts?.map((cp: any) => {
                              const isFromSolution = !!cp.customerSolutionId;
                              return (
                                <MenuItem
                                  key={cp.id}
                                  value={cp.id}
                                  sx={{
                                    borderLeft: `4px solid ${isFromSolution ? '#2196f3' : '#8bc34a'}`,
                                    backgroundColor: isFromSolution ? '#f8fcff' : '#fafff5',
                                    mb: 0.5
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip
                                      label={isFromSolution ? "Solution" : "Direct"}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        backgroundColor: isFromSolution ? '#2196f3' : '#8bc34a',
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Typography variant="body2">
                                      {cp.customerSolutionId ? (
                                        // For products from solutions: name already has "Assignment - Solution - Product"
                                        `${cp.name} (${cp.licenseLevel})`
                                      ) : (
                                        // For standalone products: show "Assignment Name - Product Name"
                                        `${cp.name} - ${cp.product.name} (${cp.licenseLevel})`
                                      )}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                        {selectedCustomerProductId && planData?.adoptionPlan && (
                          <>
                            <Tooltip
                              title={
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">Export Telemetry Template</Typography>
                                  <Typography variant="caption">
                                    Download an Excel template with all tasks and telemetry attributes.
                                    Fill in the telemetry values and import back to update task statuses automatically.
                                  </Typography>
                                </Box>
                              }
                              arrow
                            >
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                startIcon={<Download />}
                                onClick={handleExportTelemetry}
                              >
                                Export Telemetry Template
                              </Button>
                            </Tooltip>
                            <Tooltip
                              title={
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">Import Telemetry</Typography>
                                  <Typography variant="caption">
                                    Upload the completed Excel template with telemetry values.
                                    Task statuses will be automatically evaluated based on success criteria.
                                  </Typography>
                                </Box>
                              }
                              arrow
                            >
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                startIcon={<Upload />}
                                component="label"
                              >
                                Import Telemetry
                                <input
                                  type="file"
                                  hidden
                                  accept=".xlsx"
                                  onChange={handleImportTelemetry}
                                />
                              </Button>
                            </Tooltip>
                            <Tooltip title="Sync with latest product tasks">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Sync />}
                                color={planData.adoptionPlan.needsSync ? 'warning' : 'primary'}
                                onClick={handleSync}
                                disabled={syncLoading}
                              >
                                {syncLoading ? 'Syncing...' : planData.adoptionPlan.needsSync ? '⚠️ Sync' : 'Sync'}
                              </Button>
                            </Tooltip>
                            <Chip
                              label={selectedCustomerProduct?.licenseLevel}
                              color="primary"
                              size="small"
                            />
                            <Tooltip title="Edit license and outcomes">
                              <IconButton
                                size="small"
                                onClick={() => setEditEntitlementsDialogOpen(true)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Progress and Tasks */}
                    <Box sx={{ p: 2.5 }}>
                      {/* Solution-based Product Info */}
                      {selectedCustomerProductId && (() => {
                        const selectedProd = sortedProducts?.find((p: any) => p.id === selectedCustomerProductId);
                        return selectedProd?.customerSolutionId ? (
                          <Alert
                            severity="info"
                            sx={{
                              mb: 2,
                              borderLeft: '4px solid #2196f3',
                              backgroundColor: '#f8fcff'
                            }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              🔗 Solution-Based Product
                            </Typography>
                            <Typography variant="body2">
                              This product was assigned as part of a solution. Some operations may be restricted.
                              To modify entitlements, please edit the solution assignment.
                            </Typography>
                          </Alert>
                        ) : null;
                      })()}

                      {/* Loading State */}
                      {selectedCustomerProductId && planLoading && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: 2 }}>
                          <CircularProgress size={60} thickness={4} />
                          <Typography variant="h6" color="text.secondary">
                            Loading Adoption Plan...
                          </Typography>
                        </Box>
                      )}

                      {/* Error State */}
                      {selectedCustomerProductId && planError && !planLoading && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Unable to Load Adoption Plan</Typography>
                          <Typography variant="body2">
                            {planError.message || 'An error occurred while loading the adoption plan. Please try refreshing the page.'}
                          </Typography>
                        </Alert>
                      )}

                      {/* No Adoption Plan State */}
                      {selectedCustomerProductId && !planData?.adoptionPlan && !planLoading && !planError && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: 2 }}>
                          <Typography variant="h6" color="text.secondary">
                            No Adoption Plan Available
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            This product assignment doesn't have an adoption plan yet. Try syncing to create one.
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<Sync />}
                            onClick={handleSync}
                            disabled={syncLoading}
                          >
                            {syncLoading ? 'Syncing...' : 'Sync Now'}
                          </Button>
                        </Box>
                      )}

                      {/* Adoption Plan Content */}
                      {selectedCustomerProductId && planData?.adoptionPlan && !planLoading ? (
                        <>
                          {/* Overall Progress Card - Compact */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              mb: 2,
                              border: '1.5px solid',
                              borderColor: '#E0E0E0',
                              borderRadius: 2,
                              bgcolor: 'background.paper'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight="600">Overall Progress</Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>{filteredProgress.completedTasks}</strong> of <strong>{filteredProgress.totalTasks}</strong> tasks completed
                                {((filterReleases.length > 0 && !filterReleases.includes(ALL_RELEASES_ID)) ||
                                  (filterOutcomes.length > 0 && !filterOutcomes.includes(ALL_OUTCOMES_ID))) && (
                                    <Chip
                                      label="Filtered"
                                      size="small"
                                      sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                                      color="info"
                                    />
                                  )}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={filteredProgress.percentage}
                                sx={{ flex: 1, height: 10, borderRadius: 5 }}
                              />
                              <Typography variant="body1" fontWeight="700" color="primary" sx={{ minWidth: 50, textAlign: 'right' }}>
                                {filteredProgress.percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                            {planData.adoptionPlan.lastSyncedAt && !isNaN(new Date(planData.adoptionPlan.lastSyncedAt).getTime()) && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Last synced: {new Date(planData.adoptionPlan.lastSyncedAt).toLocaleString()}
                              </Typography>
                            )}
                          </Paper>

                          {/* Tasks Table */}
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Tasks</Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  {/* Releases - Multi-select */}
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Releases</InputLabel>
                                    <Select
                                      multiple
                                      value={filterReleases}
                                      onChange={(e) => {
                                        const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                                        // If "All" is clicked, toggle between "All" and empty
                                        if (value.includes(ALL_RELEASES_ID)) {
                                          if (filterReleases.includes(ALL_RELEASES_ID)) {
                                            // Was "All", now deselect
                                            setFilterReleases([]);
                                          } else {
                                            // Select "All" only
                                            setFilterReleases([ALL_RELEASES_ID]);
                                          }
                                        } else {
                                          // Regular selection - remove "All" if present
                                          setFilterReleases(value.filter(id => id !== ALL_RELEASES_ID));
                                        }
                                      }}
                                      input={<OutlinedInput label="Releases" />}
                                      renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {selected.length === 0 || selected.includes(ALL_RELEASES_ID) ? (
                                            <em>All Releases</em>
                                          ) : (
                                            selected.map((id) => {
                                              const release = availableReleases.find((r: any) => r.id === id);
                                              return (
                                                <Chip
                                                  key={id}
                                                  label={release?.name || id}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              );
                                            })
                                          )}
                                        </Box>
                                      )}
                                    >
                                      {[
                                        // Always show "All Releases" option
                                        <MenuItem
                                          key={ALL_RELEASES_ID}
                                          value={ALL_RELEASES_ID}
                                          sx={{
                                            backgroundColor: filterReleases.includes(ALL_RELEASES_ID) ? 'rgba(33, 150, 243, 0.08)' : 'inherit',
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            '&:hover': {
                                              backgroundColor: 'rgba(33, 150, 243, 0.12)',
                                            },
                                          }}
                                        >
                                          <Checkbox checked={filterReleases.includes(ALL_RELEASES_ID)} sx={{ color: 'primary.main' }} />
                                          <ListItemText
                                            primary="All Releases"
                                            primaryTypographyProps={{
                                              fontWeight: 600,
                                              color: 'primary.main'
                                            }}
                                          />
                                        </MenuItem>,
                                        ...availableReleases.map((release: any) => (
                                          <MenuItem key={release.id} value={release.id}>
                                            <Checkbox checked={filterReleases.includes(release.id)} />
                                            <ListItemText primary={`${release.name}${release.version ? ` (${release.version})` : ''}`} />
                                          </MenuItem>
                                        ))
                                      ]}
                                    </Select>
                                  </FormControl>

                                  {/* Outcomes - Multi-select */}
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Outcomes</InputLabel>
                                    <Select
                                      multiple
                                      value={filterOutcomes}
                                      onChange={(e) => {
                                        const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                                        // If "All" is clicked, toggle between "All" and empty
                                        if (value.includes(ALL_OUTCOMES_ID)) {
                                          if (filterOutcomes.includes(ALL_OUTCOMES_ID)) {
                                            // Was "All", now deselect
                                            setFilterOutcomes([]);
                                          } else {
                                            // Select "All" only
                                            setFilterOutcomes([ALL_OUTCOMES_ID]);
                                          }
                                        } else {
                                          // Regular selection - remove "All" if present
                                          setFilterOutcomes(value.filter(id => id !== ALL_OUTCOMES_ID));
                                        }
                                      }}
                                      input={<OutlinedInput label="Outcomes" />}
                                      renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {selected.length === 0 || selected.includes(ALL_OUTCOMES_ID) ? (
                                            <em>All Outcomes</em>
                                          ) : (
                                            selected.map((id) => {
                                              const outcome = availableOutcomes.find((o: any) => o.id === id);
                                              return (
                                                <Chip
                                                  key={id}
                                                  label={outcome?.name || id}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              );
                                            })
                                          )}
                                        </Box>
                                      )}
                                    >
                                      <MenuItem
                                        key={ALL_OUTCOMES_ID}
                                        value={ALL_OUTCOMES_ID}
                                        sx={{
                                          backgroundColor: filterOutcomes.includes(ALL_OUTCOMES_ID) ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                                          borderBottom: '1px solid',
                                          borderColor: 'divider',
                                          '&:hover': {
                                            backgroundColor: 'rgba(76, 175, 80, 0.12)',
                                          },
                                        }}
                                      >
                                        <Checkbox checked={filterOutcomes.includes(ALL_OUTCOMES_ID)} sx={{ color: 'success.main' }} />
                                        <ListItemText
                                          primary="All Outcomes"
                                          primaryTypographyProps={{
                                            fontWeight: 600,
                                            color: 'success.main'
                                          }}
                                        />
                                      </MenuItem>
                                      {availableOutcomes.map((outcome: any) => (
                                        <MenuItem key={outcome.id} value={outcome.id}>
                                          <Checkbox checked={filterOutcomes.includes(outcome.id)} />
                                          <ListItemText primary={outcome.name} />
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  {/* Tags - Multi-select */}
                                  <FormControl size="small" sx={{ minWidth: 200, maxWidth: 350 }}>
                                    <InputLabel>Tags</InputLabel>
                                    <Select
                                      multiple
                                      value={filterTags}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setFilterTags(typeof value === 'string' ? value.split(',') : value);
                                      }}
                                      input={<OutlinedInput label="Tags" />}
                                      renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {selected.map((value) => {
                                            const tag = availableTags.find((t: any) => t.id === value);
                                            return (
                                              <Tooltip key={value} title={tag?.description || tag?.name || value} arrow>
                                                <Chip
                                                  label={tag?.name || value}
                                                  size="small"
                                                  sx={{
                                                    bgcolor: tag?.color || '#888',
                                                    color: '#fff',
                                                    '& .MuiChip-label': { fontWeight: 500 }
                                                  }}
                                                />
                                              </Tooltip>
                                            );
                                          })}
                                        </Box>
                                      )}
                                    >
                                      {availableTags.map((tag: any) => (
                                        <MenuItem key={tag.id} value={tag.id}>
                                          <Checkbox checked={filterTags.includes(tag.id)} />
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Label sx={{ color: tag.color, fontSize: 20 }} />
                                            <ListItemText primary={tag.name} secondary={tag.description} />
                                          </Box>
                                        </MenuItem>
                                      ))}
                                      {availableTags.length === 0 && (
                                        <MenuItem disabled>
                                          <ListItemText primary="No tags available" />
                                        </MenuItem>
                                      )}
                                    </Select>
                                  </FormControl>

                                  {(filterReleases.length > 0 || filterOutcomes.length > 0 || filterTags.length > 0) && ( // Added filterTags to condition
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => {
                                        setFilterReleases([]);
                                        setFilterOutcomes([]);
                                        setFilterTags([]);
                                      }}
                                    >
                                      Clear Filters
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{
                                      backgroundColor: '#eeeeee',
                                      borderBottom: '2px solid #d0d0d0'
                                    }}>
                                      <TableCell width={60} sx={{ whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>#</Typography>
                                      </TableCell>
                                      <TableCell sx={{ minWidth: 200, maxWidth: 300 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Task Name</Typography>
                                      </TableCell>
                                      <TableCell width={140} sx={{ whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Resources</Typography>
                                      </TableCell>
                                      <TableCell width={80} sx={{ whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Impl %</Typography>
                                      </TableCell>
                                      <TableCell sx={{ minWidth: 120 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Tags</Typography>
                                      </TableCell>

                                      <TableCell width={160} sx={{ whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Validation Criteria</Typography>
                                      </TableCell>
                                      <TableCell width={130} sx={{ whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Updated Via</Typography>
                                      </TableCell>
                                      <TableCell width={160} sx={{ whiteSpace: 'nowrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Status</Typography>
                                          <KeyboardArrowDown sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {filteredTasks.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={8} align="center">
                                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                            No tasks match the selected filters
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      filteredTasks.map((task: any) => (
                                        <TableRow
                                          key={task.id}
                                          hover
                                          title={task.description || 'No description available'}
                                          onDoubleClick={() => {
                                            setSelectedTask(task);
                                            setTaskDetailsDialogOpen(true);
                                          }}
                                          sx={{
                                            cursor: 'pointer',
                                            backgroundColor: 'transparent',
                                            borderLeft: `4px solid ${getStatusColor(task.status)}`,
                                            opacity: task.status === 'NOT_APPLICABLE' ? 0.6 : 1,
                                            textDecoration: task.status === 'NOT_APPLICABLE' ? 'line-through' : 'none',
                                            '&:hover': {
                                              backgroundColor: 'action.hover',
                                            },
                                            transition: 'all 0.2s ease-in-out',
                                          }}
                                        >
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              {task.sequenceNumber}
                                            </Box>
                                          </TableCell>
                                          <TableCell sx={{ maxWidth: 300 }}>
                                            <Typography variant="body2" sx={{
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap'
                                            }}>
                                              {task.name}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', justifyContent: 'center' }}>
                                              {/* How-to documentation links */}
                                              {task.howToDoc && task.howToDoc.length > 0 && (
                                                <Chip
                                                  size="small"
                                                  label={`Doc${task.howToDoc.length > 1 ? ` (${task.howToDoc.length})` : ''}`}
                                                  color="primary"
                                                  variant="outlined"
                                                  sx={{
                                                    fontSize: '0.7rem',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    '&:hover': { backgroundColor: 'primary.light' }
                                                  }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (task.howToDoc.length === 1) {
                                                      window.open(task.howToDoc[0], '_blank');
                                                    } else {
                                                      setDocMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToDoc });
                                                    }
                                                  }}
                                                  title={task.howToDoc.length === 1
                                                    ? `Documentation: ${task.howToDoc[0]}`
                                                    : `Documentation (${task.howToDoc.length} links):\n${task.howToDoc.join('\n')}`
                                                  }
                                                />
                                              )}
                                              {/* How-to video links */}
                                              {task.howToVideo && task.howToVideo.length > 0 && (
                                                <Chip
                                                  size="small"
                                                  label={`Video${task.howToVideo.length > 1 ? ` (${task.howToVideo.length})` : ''}`}
                                                  color="error"
                                                  variant="outlined"
                                                  sx={{
                                                    fontSize: '0.7rem',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    '&:hover': { backgroundColor: 'error.light' }
                                                  }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (task.howToVideo.length === 1) {
                                                      window.open(task.howToVideo[0], '_blank');
                                                    } else {
                                                      setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo });
                                                    }
                                                  }}
                                                  title={task.howToVideo.length === 1
                                                    ? `Video: ${task.howToVideo[0]}`
                                                    : `Videos (${task.howToVideo.length} links):\n${task.howToVideo.join('\n')}`
                                                  }
                                                />
                                              )}
                                              {!task.howToDoc && !task.howToVideo && (
                                                <Typography variant="caption" color="text.secondary">-</Typography>
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{task.weight}%</TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                              {task.tags?.map((tag: any) => (
                                                <Tooltip
                                                  key={tag.id}
                                                  title={
                                                    <Box>
                                                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>Tag: {tag.name}</Typography>
                                                      {tag.description && <Typography variant="caption" display="block">{tag.description}</Typography>}
                                                    </Box>
                                                  }
                                                  arrow
                                                >
                                                  <Chip
                                                    label={tag.name}
                                                    size="small"
                                                    sx={{
                                                      height: 18,
                                                      fontSize: '0.65rem',
                                                      backgroundColor: tag.color || '#888',
                                                      color: '#fff',
                                                      fontWeight: 600
                                                    }}
                                                  />
                                                </Tooltip>
                                              ))}
                                            </Box>
                                          </TableCell>

                                          <TableCell>
                                            {(() => {
                                              const totalAttributes = task.telemetryAttributes?.length || 0;
                                              const attributesWithValues = task.telemetryAttributes?.filter((attr: any) =>
                                                attr.values && attr.values.length > 0
                                              ).length || 0;

                                              // Count attributes that have criteria met based on the latest evaluation (isMet field)
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
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {task.statusUpdateSource ? (
                                              <Chip
                                                label={task.statusUpdateSource === 'TELEMETRY' ? 'System' : task.statusUpdateSource === 'MANUAL' ? 'Manual' : task.statusUpdateSource}
                                                size="small"
                                                variant="filled"
                                                sx={{
                                                  fontSize: '0.7rem',
                                                  height: '22px',
                                                  fontWeight: 600,
                                                  ...(task.statusUpdateSource === 'TELEMETRY' ? {
                                                    backgroundColor: '#7c4dff',
                                                    color: '#fff',
                                                  } : task.statusUpdateSource === 'IMPORT' ? {
                                                    backgroundColor: '#2196f3',
                                                    color: '#fff',
                                                  } : {
                                                    backgroundColor: '#e0e0e0',
                                                    color: '#616161',
                                                  })
                                                }}
                                              />
                                            ) : (
                                              <Typography variant="caption" color="text.secondary">-</Typography>
                                            )}
                                          </TableCell>
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                              <Select
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, task.name, e.target.value)}
                                                variant="outlined"
                                                sx={{
                                                  '& .MuiSelect-select': {
                                                    py: 0.5,
                                                    fontSize: '0.875rem'
                                                  }
                                                }}
                                              >
                                                <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                                                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                                <MenuItem value="DONE">Done</MenuItem>
                                                <MenuItem value="NO_LONGER_USING">No Longer Using</MenuItem>
                                                <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
                                              </Select>
                                            </FormControl>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </CardContent>
                          </Card>
                        </>
                      ) : selectedCustomerProductId ? (
                        <Alert severity="warning">
                          <strong>No adoption plan found for this product.</strong>
                          <br />
                          Customer Product ID: {selectedCustomerProductId}
                          <br />
                          Customer Product: {selectedCustomerProduct ? 'Found' : 'Not Found'}
                          <br />
                          Adoption Plan ID: {adoptionPlanId || 'NULL'}
                          <br />
                          {!selectedCustomerProduct && `Could not find customer product with id = ${selectedCustomerProductId}`}
                        </Alert>
                      ) : (
                        <Alert severity="info">
                          <strong>No product selected.</strong>
                          <br />
                          Available products: {sortedProducts?.length || 0}
                          <br />
                          {sortedProducts?.length > 0 ?
                            `Products: ${sortedProducts.map((cp: any) => cp.name ? `${cp.product.name} (${cp.name})` : cp.product.name).join(', ')}` :
                            'Assign a product to this customer to get started.'
                          }
                        </Alert>
                      )}
                    </Box>
                  </Box>
                </Box>
              )
            }

            {/* Solutions Tab Content */}
            {
              activeTab === 'solutions' && (
                <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: 1400 }}>
                    <CustomerSolutionPanel customerId={selectedCustomerId || ''} />
                  </Box>
                </Box>
              )
            }
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Customer Selected
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a customer from the list or add a new customer
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </Box>
          </Box>
        )
        }
      </Box >

      {/* Status Change Notes Dialog */}
      < Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })} maxWidth="sm" fullWidth >
        <DialogTitle>Update Task Status: {statusDialog.taskName}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Changing status to: <strong>{statusDialog.currentStatus.replace('_', ' ')}</strong>
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            placeholder="Add notes about this status change..."
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            helperText="These notes will be recorded with the status change"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ ...statusDialog, open: false })}>Cancel</Button>
          <Button onClick={() => handleStatusSave(statusDialog.currentStatus)} variant="contained" color="primary">
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog >

      {/* Customer Dialog */}
      < CustomerDialog
        open={customerDialogOpen}
        onClose={() => {
          setCustomerDialogOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      />

      {/* Assign Product Dialog */}
      {
        selectedCustomerId && (
          <AssignProductDialog
            open={assignProductDialogOpen}
            onClose={() => setAssignProductDialogOpen(false)}
            customerId={selectedCustomerId}
            onAssigned={async () => {
              setAssignProductDialogOpen(false);
              await refetch();
              // Refetch plan data if a product is already selected
              if (adoptionPlanId) {
                await refetchPlan();
              }
              setSuccess('Product assigned successfully');
            }}
          />
        )
      }

      {/* Edit Entitlements Dialog */}
      {
        selectedCustomerProduct && (
          <EditEntitlementsDialog
            open={editEntitlementsDialogOpen}
            onClose={() => setEditEntitlementsDialogOpen(false)}
            customerProductId={selectedCustomerProduct.id}
            productId={selectedCustomerProduct.product.id}
            currentLicenseLevel={selectedCustomerProduct.licenseLevel}
            currentSelectedOutcomes={selectedCustomerProduct.selectedOutcomes || []}
            currentSelectedReleases={selectedCustomerProduct.selectedReleases || []}
            onSave={(licenseLevel, selectedOutcomeIds, selectedReleaseIds) => {
              updateCustomerProduct({
                variables: {
                  id: selectedCustomerProduct.id,
                  input: {
                    licenseLevel,
                    selectedOutcomeIds,
                    selectedReleaseIds,
                  },
                },
              });
            }}
          />
        )
      }

      {/* Cannot Edit Product Directly - Warning Dialog */}
      {
        selectedCustomerProduct && (
          <Dialog
            open={cannotEditProductDialogOpen}
            onClose={() => setCannotEditProductDialogOpen(false)}
          >
            <DialogTitle>Cannot Edit Product Directly</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>{selectedCustomerProduct.product.name}</strong> was assigned as part of a solution and can only be edited through the solution adoption plan.
              </Alert>
              <Typography>
                This product's entitlements (license level, outcomes, releases) are managed at the solution level.
                Any changes must be made through the <strong>Solutions</strong> tab by editing the solution assignment.
              </Typography>
              <Typography sx={{ mt: 2 }}>
                To make changes:
              </Typography>
              <ol>
                <li>Navigate to the <strong>Solutions</strong> tab</li>
                <li>Find the solution that includes this product</li>
                <li>Click <strong>Edit Solution Assignment</strong></li>
              </ol>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCannotEditProductDialogOpen(false)} variant="contained">
                Got It
              </Button>
            </DialogActions>
          </Dialog>
        )
      }

      {/* Delete Product Confirmation Dialog */}
      {
        selectedCustomerProduct && (
          <Dialog
            open={deleteProductDialogOpen}
            onClose={() => setDeleteProductDialogOpen(false)}
          >
            <DialogTitle>Remove Product from Customer?</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will permanently remove <strong>{selectedCustomerProduct.product.name}</strong> from this customer,
                including the adoption plan and all task progress.
              </Alert>
              <Typography>
                Are you sure you want to continue? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteProductDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleRemoveProduct}
                color="error"
                variant="contained"
                disabled={removeLoading}
              >
                {removeLoading ? 'Removing...' : 'Remove Product'}
              </Button>
            </DialogActions>
          </Dialog>
        )
      }

      {/* Task Details Dialog - Uses shared component */}
      <TaskDetailsDialog
        open={taskDetailsDialogOpen}
        onClose={() => setTaskDetailsDialogOpen(false)}
        task={selectedTask as TaskDetailsData}
      />


      {/* Import Telemetry Result Dialog */}
      <Dialog
        open={importResultDialog.open}
        onClose={() => setImportResultDialog({ ...importResultDialog, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {importResultDialog.success ? '✅ Telemetry Import Successful' : '❌ Telemetry Import Failed'}
        </DialogTitle>
        <DialogContent>
          {importResultDialog.success && importResultDialog.summary && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* Summary Card */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    📊 Import Summary
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Tasks Processed</Typography>
                      <Typography variant="h6">{importResultDialog.summary.tasksProcessed}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Attributes Updated</Typography>
                      <Typography variant="h6">{importResultDialog.summary.attributesUpdated}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Criteria Evaluated</Typography>
                      <Typography variant="h6">{importResultDialog.summary.criteriaEvaluated}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Criteria Met</Typography>
                      <Typography variant="h6" color="success.main">
                        {importResultDialog.taskResults?.reduce((sum, task) => sum + task.criteriaMet, 0) || 0}
                        /{importResultDialog.summary.criteriaEvaluated}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Task Results */}
              {importResultDialog.taskResults && importResultDialog.taskResults.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      📋 Task Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {importResultDialog.taskResults.map((task, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1.5,
                            bgcolor: 'grey.50',
                            borderRadius: 1
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {task.taskName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.criteriaMet}/{task.criteriaTotal} criteria met
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`${task.completionPercentage}%`}
                              size="small"
                              color={task.completionPercentage === 100 ? 'success' : task.completionPercentage > 0 ? 'info' : 'default'}
                            />
                            {task.completionPercentage === 100 && <span>✓</span>}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Warnings/Errors */}
              {importResultDialog.summary.errors && importResultDialog.summary.errors.length > 0 && (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>⚠️ Warnings:</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {importResultDialog.summary.errors.map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}

              <Alert severity="info" icon={false}>
                <Typography variant="body2">
                  🔄 Task statuses have been automatically evaluated and updated based on telemetry criteria.
                </Typography>
              </Alert>
            </Box>
          )}

          {!importResultDialog.success && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="error">
                <Typography variant="body2">
                  {importResultDialog.errorMessage || 'Import failed. Please check the file format and try again.'}
                </Typography>
              </Alert>
              {importResultDialog.summary?.errors && importResultDialog.summary.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Errors:</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {importResultDialog.summary.errors.map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setImportResultDialog({ ...importResultDialog, open: false })}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu for multiple documentation links */}
      <Menu
        anchorEl={docMenuAnchor?.el}
        open={Boolean(docMenuAnchor)}
        onClose={() => setDocMenuAnchor(null)}
      >
        <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: '1 !important' }}>
          Documentation Links:
        </MenuItem>
        {docMenuAnchor?.links.map((link, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              window.open(link, '_blank');
              setDocMenuAnchor(null);
            }}
            sx={{ fontSize: '0.875rem' }}
          >
            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            docMenuAnchor?.links.forEach((link) => window.open(link, '_blank'));
            setDocMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', fontWeight: 'bold', borderTop: '1px solid #ddd' }}
        >
          Open All ({docMenuAnchor?.links.length})
        </MenuItem>
      </Menu>

      {/* Menu for multiple video links */}
      <Menu
        anchorEl={videoMenuAnchor?.el}
        open={Boolean(videoMenuAnchor)}
        onClose={() => setVideoMenuAnchor(null)}
      >
        <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: '1 !important' }}>
          Video Links:
        </MenuItem>
        {videoMenuAnchor?.links.map((link, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              window.open(link, '_blank');
              setVideoMenuAnchor(null);
            }}
            sx={{ fontSize: '0.875rem' }}
          >
            {link.length > 50 ? `${link.substring(0, 50)}...` : link}
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            videoMenuAnchor?.links.forEach((link) => window.open(link, '_blank'));
            setVideoMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', fontWeight: 'bold', borderTop: '1px solid #ddd' }}
        >
          Open All ({videoMenuAnchor?.links.length})
        </MenuItem>
      </Menu>

      {/* Dialogs - Removed duplicate AssignProductDialog (was rendered twice, causing overlay issues) */}

      {
        selectedCustomerProduct && (
          <EditEntitlementsDialog
            open={editEntitlementsDialogOpen}
            onClose={() => setEditEntitlementsDialogOpen(false)}
            customerProductId={selectedCustomerProduct.id}
            productId={selectedCustomerProduct.product.id}
            currentLicenseLevel={selectedCustomerProduct.licenseLevel}
            currentSelectedOutcomes={selectedCustomerProduct.selectedOutcomes || []}
            currentSelectedReleases={selectedCustomerProduct.selectedReleases || []}
            onSave={(licenseLevel, selectedOutcomeIds, selectedReleaseIds) => {
              updateCustomerProduct({
                variables: {
                  id: selectedCustomerProduct.id,
                  input: {
                    licenseLevel,
                    selectedOutcomeIds,
                    selectedReleaseIds,
                  },
                },
              });
            }}
          />
        )
      }

      <AssignSolutionDialog
        open={assignSolutionDialogOpen}
        onClose={() => setAssignSolutionDialogOpen(false)}
        customerId={selectedCustomerId || ''}
        onSuccess={() => refetch()}
      />

      {
        selectedCustomerSolutionId && (
          <EditSolutionEntitlementsDialog
            open={editSolutionEntitlementsDialogOpen}
            onClose={() => setEditSolutionEntitlementsDialogOpen(false)}
            customerSolutionId={selectedCustomerSolutionId}
            onSuccess={() => refetch()}
          />
        )
      }

      {/* Delete Product Confirmation Dialog */}
      <Dialog
        open={deleteProductDialogOpen}
        onClose={() => setDeleteProductDialogOpen(false)}
      >
        <DialogTitle>Remove Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this product assignment? This will also delete the associated adoption plan and all task progress.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProductDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveProduct} color="error" variant="contained" disabled={removeLoading}>
            {removeLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Solution Confirmation Dialog */}
      <Dialog
        open={deleteSolutionDialogOpen}
        onClose={() => setDeleteSolutionDialogOpen(false)}
      >
        <DialogTitle>Remove Solution</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this solution assignment? This will also remove all associated product assignments and adoption plans.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSolutionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveSolution} color="error" variant="contained" disabled={removeSolutionLoading}>
            {removeSolutionLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}
