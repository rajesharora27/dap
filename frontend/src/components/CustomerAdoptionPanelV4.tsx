import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { ALL_OUTCOMES_ID, ALL_RELEASES_ID } from './dialogs/TaskDialog';
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
  NotInterested,
  Article,
  OndemandVideo,
} from '@mui/icons-material';
import { CustomerDialog } from './dialogs/CustomerDialog';
import { AssignProductDialog } from './dialogs/AssignProductDialog';
import { EditEntitlementsDialog } from './dialogs/EditEntitlementsDialog';
import { getApiUrl } from '../config/frontend.config';

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
          successCriteria
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
          successCriteria
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
      message
      summary {
        totalAttributes
        valuesImported
        criteriaEvaluated
        criteriaMet
      }
      taskResults {
        taskId
        taskName
        attributesImported
        criteriaMet
        criteriaTotal
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

interface CustomerAdoptionPanelV4Props {
  selectedCustomerId: string | null;
}

export function CustomerAdoptionPanelV4({ selectedCustomerId }: CustomerAdoptionPanelV4Props) {
  const [selectedCustomerProductId, setSelectedCustomerProductId] = useState<string | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
  const [editEntitlementsDialogOpen, setEditEntitlementsDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskDetailsActiveTab, setTaskDetailsActiveTab] = useState(0);
  
  // Filter states - releases and outcomes support multiple selections
  // Note: License filter removed - tasks are pre-filtered by assigned license level
  const [filterReleases, setFilterReleases] = useState<string[]>([]);
  const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
  
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    taskId: '',
    taskName: '',
    currentStatus: 'NOT_STARTED',
  });
  const [statusNotes, setStatusNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for howToDoc and howToVideo dropdown menus
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);

  const { data, loading, refetch } = useQuery(GET_CUSTOMERS, {
    fetchPolicy: 'cache-and-network',
  });

  const selectedCustomer = data?.customers?.find((c: any) => c.id === selectedCustomerId);
  const selectedCustomerProduct = selectedCustomer?.products?.find((cp: any) => cp.id === selectedCustomerProductId);
  const adoptionPlanId = selectedCustomerProduct?.adoptionPlan?.id;

  const { data: planData, refetch: refetchPlan } = useQuery(GET_ADOPTION_PLAN, {
    variables: { id: adoptionPlanId },
    skip: !adoptionPlanId,
    fetchPolicy: 'cache-and-network',
  });

  // Auto-select first product when customer is selected or products change
  useEffect(() => {
    if (selectedCustomer?.products?.length > 0 && !selectedCustomerProductId) {
      setSelectedCustomerProductId(selectedCustomer.products[0].id);
    }
  }, [selectedCustomer, selectedCustomerProductId]);

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
      
      return true;
    });

    // Sort by sequence number (natural order from product definition)
    tasks = [...tasks].sort((a: any, b: any) => {
      const aSeq = a.sequenceNumber || 0;
      const bSeq = b.sequenceNumber || 0;
      return aSeq - bSeq;
    });

    return tasks;
  }, [planData?.adoptionPlan?.tasks, filterReleases, filterOutcomes]);

  // Get unique releases, licenses, and outcomes for filter dropdowns
  const availableReleases = React.useMemo(() => {
    // If customer has specific release entitlements, show only those
    if (planData?.adoptionPlan?.selectedReleases && planData.adoptionPlan.selectedReleases.length > 0) {
      // Create a copy before sorting (GraphQL data is read-only)
      return [...planData.adoptionPlan.selectedReleases].sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    
    // Otherwise, show all releases from tasks (customer has "All" entitlement)
    if (!planData?.adoptionPlan?.tasks) return [];
    const releases = new Map();
    planData.adoptionPlan.tasks.forEach((task: any) => {
      task.releases?.forEach((release: any) => {
        if (!releases.has(release.id)) {
          releases.set(release.id, release);
        }
      });
    });
    return Array.from(releases.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [planData?.adoptionPlan?.tasks, planData?.adoptionPlan?.selectedReleases]);

  const availableOutcomes = React.useMemo(() => {
    // If customer has specific outcome entitlements, show only those
    if (planData?.adoptionPlan?.selectedOutcomes && planData.adoptionPlan.selectedOutcomes.length > 0) {
      // Create a copy before sorting (GraphQL data is read-only)
      return [...planData.adoptionPlan.selectedOutcomes].sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    
    // Otherwise, show all outcomes from tasks (customer has "All" entitlement)
    if (!planData?.adoptionPlan?.tasks) return [];
    const outcomes = new Map();
    planData.adoptionPlan.tasks.forEach((task: any) => {
      task.outcomes?.forEach((outcome: any) => {
        if (!outcomes.has(outcome.id)) {
          outcomes.set(outcome.id, outcome);
        }
      });
    });
    return Array.from(outcomes.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [planData?.adoptionPlan?.tasks, planData?.adoptionPlan?.selectedOutcomes]);

  // Calculate progress based on filtered tasks (excluding NOT_APPLICABLE)
  const filteredProgress = React.useMemo(() => {
    // Filter out NOT_APPLICABLE tasks - they should not count towards progress
    const applicableTasks = filteredTasks.filter((task: any) => task.status !== 'NOT_APPLICABLE');
    
    if (!applicableTasks.length) return { totalTasks: 0, completedTasks: 0, percentage: 0 };
    
    const completedTasks = applicableTasks.filter((task: any) => 
      task.status === 'COMPLETED' || task.status === 'DONE'
    ).length;
    const percentage = (completedTasks / applicableTasks.length) * 100;
    
    return {
      totalTasks: applicableTasks.length,
      completedTasks,
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
      refetchPlan();
      refetch();
      setSuccess('Adoption plan synced successfully');
    },
    onError: (err) => {
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
        const apiConfigUrl = getApiUrl();
        console.log('API config URL:', apiConfigUrl);
        let baseOrigin: string;

        try {
          const parsed = new URL(apiConfigUrl, window.location.origin);
          baseOrigin = `${parsed.protocol}//${parsed.host}`;
        } catch (parseErr) {
          console.warn('Unable to derive API base from config, defaulting to window origin', parseErr);
          baseOrigin = window.location.origin;
        }

        console.log('Base origin:', baseOrigin);
        const fileUrl = new URL(url, baseOrigin);
        console.log('Full file URL:', fileUrl.toString());

        const response = await fetch(fileUrl.toString(), {
          credentials: 'include',
          mode: 'cors',
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
        const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
        const header = Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('File header:', header, 'Expected: 504b0304');
        
        if (header !== '504b0304' && header !== '504b0506') {
          console.error('Invalid Excel file header! File may be corrupted or wrong content type');
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
        setSuccess(
          `Telemetry import successful: ${summary.valuesImported} values imported, ` +
          `${summary.criteriaMet}/${summary.criteriaEvaluated} criteria met`
        );
        refetchPlan();
        refetch();
      } else {
        setError(data.importAdoptionPlanTelemetry.message || 'Telemetry import failed');
      }
    },
    onError: (err) => setError(`Failed to import telemetry: ${err.message}`),
  });

  const handleProductChange = (customerProductId: string) => {
    setSelectedCustomerProductId(customerProductId);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      setCustomerDialogOpen(true);
    }
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer && confirm(`Delete customer "${selectedCustomer.name}"?`)) {
      deleteCustomer({ variables: { id: selectedCustomer.id } });
    }
  };

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

  const handleRemoveProduct = () => {
    if (selectedCustomerProduct) {
      removeProduct({ variables: { id: selectedCustomerProduct.id } });
      setDeleteProductDialogOpen(false);
    }
  };

  const handleExportTelemetry = async () => {
    if (!adoptionPlanId) {
      setError('No adoption plan found');
      return;
    }
    try {
      await exportTelemetryTemplate({ variables: { adoptionPlanId } });
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
      // Use REST endpoint for file upload instead of GraphQL
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`http://localhost:4000/api/telemetry/import/${adoptionPlanId}`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        const summary = result.summary;
        setSuccess(
          `Telemetry import successful: ${summary.valuesImported} values imported, ` +
          `${summary.criteriaMet}/${summary.criteriaEvaluated} criteria met`
        );
        refetchPlan();
        refetch();
      } else {
        setError(result.message || 'Telemetry import failed');
      }
    } catch (err: any) {
      setError(`Failed to import telemetry: ${err.message}`);
    }
    
    // Reset the input so the same file can be re-uploaded
    event.target.value = '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'NOT_APPLICABLE': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle fontSize="small" />;
      case 'IN_PROGRESS': return <HourglassEmpty fontSize="small" />;
      case 'NOT_STARTED': return <TrendingUp fontSize="small" />;
      case 'NOT_APPLICABLE': return <NotInterested fontSize="small" />;
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
            {/* Header with Customer Info and Actions */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h5">{selectedCustomer.name}</Typography>
                  {selectedCustomer.description && (
                    <Typography variant="body2" color="text.secondary">{selectedCustomer.description}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<Add />} variant="outlined" size="small" onClick={handleAddCustomer}>
                    Add
                  </Button>
                  <Button startIcon={<Edit />} variant="outlined" size="small" onClick={handleEditCustomer}>
                    Edit
                  </Button>
                  <Button startIcon={<Delete />} variant="outlined" size="small" color="error" onClick={handleDeleteCustomer}>
                    Delete
                  </Button>
                  <Button startIcon={<Download />} variant="outlined" size="small" onClick={handleExport} disabled={!selectedCustomerProductId}>
                    Export
                  </Button>
                  <Button startIcon={<Upload />} variant="outlined" size="small" component="label" disabled={!selectedCustomerProductId}>
                    Import
                    <input type="file" hidden accept=".xlsx" onChange={handleImport} />
                  </Button>
                </Box>
              </Box>

              {/* Product Selection */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 300 }} size="small">
                  <InputLabel>Select Product</InputLabel>
                  <Select
                    value={selectedCustomerProductId || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    label="Select Product"
                  >
                    {selectedCustomer.products?.map((cp: any) => (
                      <MenuItem key={cp.id} value={cp.id}>
                        {cp.product.name} ({cp.licenseLevel}){cp.name ? ` - ${cp.name}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setAssignProductDialogOpen(true)}
                >
                  Assign Product
                </Button>
                {selectedCustomerProductId && planData?.adoptionPlan && (
                  <>
                    <Tooltip title="Edit license and outcomes">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => setEditEntitlementsDialogOpen(true)}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                    <Tooltip title="Sync with latest product tasks (outcomes, licenses, releases)">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Sync />}
                        color={planData.adoptionPlan.needsSync ? 'warning' : 'primary'}
                        onClick={handleSync}
                        disabled={syncLoading}
                      >
                        {syncLoading ? 'Syncing...' : `Sync ${planData.adoptionPlan.needsSync ? '⚠️' : ''}`}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Remove this product from customer">
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setDeleteProductDialogOpen(true)}
                        disabled={removeLoading}
                      >
                        Delete
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>

            {/* Progress and Tasks */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {selectedCustomerProductId && planData?.adoptionPlan ? (
                <>
                  {/* Progress Card */}
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Adoption Progress</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={selectedCustomerProduct.licenseLevel} 
                            color="primary" 
                            size="small" 
                          />
                          <Tooltip title="Edit license and outcomes">
                            <IconButton
                              size="small"
                              onClick={() => setEditEntitlementsDialogOpen(true)}
                              sx={{ ml: -0.5 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {planData.adoptionPlan.needsSync && (
                            <Chip label="Sync Needed" color="warning" icon={<Sync />} size="small" />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {filteredProgress.completedTasks} / {filteredProgress.totalTasks} tasks completed
                            {/* Show "Filtered" chip only if actual filters are active (not "All") */}
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
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {filteredProgress.percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={filteredProgress.percentage}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>

                      {planData.adoptionPlan.lastSyncedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Last synced: {new Date(planData.adoptionPlan.lastSyncedAt).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  {/* Telemetry Section */}
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Telemetry Management</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Export Excel template for telemetry data entry">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Download />}
                              onClick={handleExportTelemetry}
                            >
                              Export Template
                            </Button>
                          </Tooltip>
                          <Tooltip title="Import completed telemetry Excel file">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Upload />}
                              component="label"
                            >
                              Import Data
                              <input
                                type="file"
                                hidden
                                accept=".xlsx"
                                onChange={handleImportTelemetry}
                              />
                            </Button>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Export a telemetry template with all tasks and their telemetry attributes. 
                        Fill in the values in Excel, then import the completed file to update telemetry data and evaluate success criteria.
                      </Typography>
                    </CardContent>
                  </Card>

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
                                        />
                                      );
                                    })
                                  )}
                                </Box>
                              )}
                            >
                              {[
                                // Only show "All Releases" if customer has entitlement to all releases
                                // (selectedReleases is empty in adoption plan)
                                ...((!planData?.adoptionPlan?.selectedReleases || planData.adoptionPlan.selectedReleases.length === 0) ? [
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
                                  </MenuItem>
                                ] : []),
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
                                        />
                                      );
                                    })
                                  )}
                                </Box>
                              )}
                            >
                              {[
                                // Only show "All Outcomes" if customer has entitlement to all outcomes
                                // (selectedOutcomes is empty in adoption plan)
                                ...((!planData?.adoptionPlan?.selectedOutcomes || planData.adoptionPlan.selectedOutcomes.length === 0) ? [
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
                                ] : []),
                                ...availableOutcomes.map((outcome: any) => (
                                  <MenuItem key={outcome.id} value={outcome.id}>
                                    <Checkbox checked={filterOutcomes.includes(outcome.id)} />
                                    <ListItemText primary={outcome.name} />
                                  </MenuItem>
                                ))
                              ]}
                            </Select>
                          </FormControl>

                          {(filterReleases.length > 0 || filterOutcomes.length > 0) && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setFilterReleases([]);
                                setFilterOutcomes([]);
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
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                              <TableCell width={60}>
                                <Typography variant="subtitle2" fontWeight="bold">#</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">Task Name</Typography>
                              </TableCell>
                              <TableCell width={120}>
                                <Typography variant="subtitle2" fontWeight="bold">Resources</Typography>
                              </TableCell>
                              <TableCell width={100}>
                                <Typography variant="subtitle2" fontWeight="bold">Weight</Typography>
                              </TableCell>
                              <TableCell width={150}>
                                <Typography variant="subtitle2" fontWeight="bold">Status</Typography>
                              </TableCell>
                              <TableCell width={120}>
                                <Typography variant="subtitle2" fontWeight="bold">Telemetry</Typography>
                              </TableCell>
                              <TableCell width={120}>
                                <Typography variant="subtitle2" fontWeight="bold">Updated Via</Typography>
                              </TableCell>
                              <TableCell width={100}>
                                <Typography variant="subtitle2" fontWeight="bold">Actions</Typography>
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
                                    // Grey out NOT_APPLICABLE tasks - more distinct styling
                                    opacity: task.status === 'NOT_APPLICABLE' ? 0.4 : 1,
                                    backgroundColor: task.status === 'NOT_APPLICABLE' ? 'rgba(0, 0, 0, 0.12)' : 'inherit',
                                    color: task.status === 'NOT_APPLICABLE' ? 'text.disabled' : 'inherit',
                                    textDecoration: task.status === 'NOT_APPLICABLE' ? 'line-through' : 'none',
                                    '&:hover': {
                                      backgroundColor: task.status === 'NOT_APPLICABLE' 
                                        ? 'rgba(0, 0, 0, 0.12)' // Keep same grey for NOT_APPLICABLE
                                        : 'rgba(25, 118, 210, 0.08)', // Match product list hover color
                                      boxShadow: task.status === 'NOT_APPLICABLE'
                                        ? 'none'
                                        : '0 2px 8px rgba(0,0,0,0.1)', // Match product list shadow
                                    },
                                    transition: 'all 0.2s ease-in-out', // Match product list transition
                                  }}
                                >
                                <TableCell>{task.sequenceNumber}</TableCell>
                                <TableCell>
                                  <Typography variant="body2">{task.name}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
                                  </Box>
                                </TableCell>
                                <TableCell>{task.weight}%</TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(task.status)}
                                    label={task.status.replace('_', ' ')}
                                    color={getStatusColor(task.status) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {(() => {
                                    const totalAttributes = task.telemetryAttributes?.length || 0;
                                    const attributesWithValues = task.telemetryAttributes?.filter((attr: any) => 
                                      attr.values && attr.values.length > 0
                                    ).length || 0;
                                    const criteriaMet = task.telemetryAttributes?.reduce((count: number, attr: any) => {
                                      return count + (attr.values?.filter((v: any) => v.criteriaMet).length || 0);
                                    }, 0) || 0;
                                    const criteriaTotal = task.telemetryAttributes?.filter((attr: any) => 
                                      attr.successCriteria && attr.successCriteria !== 'No criteria'
                                    ).length || 0;
                                    
                                    if (totalAttributes === 0) {
                                      return <Typography variant="caption" color="text.secondary">-</Typography>;
                                    }
                                    
                                    const hasData = attributesWithValues > 0;
                                    const percentage = criteriaTotal > 0 ? Math.round((criteriaMet / criteriaTotal) * 100) : 0;
                                    
                                    return (
                                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <Chip
                                          label={`${attributesWithValues}/${totalAttributes}`}
                                          size="small"
                                          color={hasData ? 'info' : 'default'}
                                          sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                        {criteriaTotal > 0 && (
                                          <Chip
                                            label={`${criteriaMet}/${criteriaTotal} ✓`}
                                            size="small"
                                            color={percentage === 100 ? 'success' : percentage > 0 ? 'warning' : 'default'}
                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                          />
                                        )}
                                      </Box>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  {task.statusUpdateSource ? (
                                    <Chip 
                                      label={task.statusUpdateSource}
                                      size="small"
                                      color={
                                        task.statusUpdateSource === 'MANUAL' ? 'primary' :
                                        task.statusUpdateSource === 'TELEMETRY' ? 'success' :
                                        task.statusUpdateSource === 'IMPORT' ? 'info' :
                                        'default'
                                      }
                                    />
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">-</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
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
                  Available products: {selectedCustomer?.products?.length || 0}
                  <br />
                  {selectedCustomer?.products?.length > 0 ? 
                    `Products: ${selectedCustomer.products.map((cp: any) => cp.name ? `${cp.product.name} (${cp.name})` : cp.product.name).join(', ')}` :
                    'Assign a product to this customer to get started.'
                  }
                </Alert>
              )}
            </Box>
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
        )}
      </Box>

      {/* Status Change Notes Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })} maxWidth="sm" fullWidth>
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
      </Dialog>

      {/* Customer Dialog */}
      <CustomerDialog
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
      {selectedCustomerId && (
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
      )}

      {/* Edit Entitlements Dialog */}
      {selectedCustomerProduct && (
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
      )}

      {/* Delete Product Confirmation Dialog */}
      {selectedCustomerProduct && (
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
      )}

      {/* Task Details Dialog */}
      <Dialog
        open={taskDetailsDialogOpen}
        onClose={() => {
          setTaskDetailsDialogOpen(false);
          setTaskDetailsActiveTab(0); // Reset to first tab when closing
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Adoption Plan - Task Details
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTask.name}
              </Typography>
              
              {selectedTask.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.description}
                  </Typography>
                </Box>
              )}

              {/* Tabs for organizing content */}
              <Tabs 
                value={taskDetailsActiveTab} 
                onChange={(e, newValue) => setTaskDetailsActiveTab(newValue)}
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  mb: 2,
                  minHeight: '40px',
                  '& .MuiTab-root': {
                    minHeight: '40px',
                    py: 1
                  }
                }}
              >
                <Tab label="Details" />
                <Tab label="Success Criteria" />
              </Tabs>

              {/* Tab 0: Details */}
              {taskDetailsActiveTab === 0 && (
                <Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sequence
                  </Typography>
                  <Chip label={`#${selectedTask.sequenceNumber}`} size="small" />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Weight
                  </Typography>
                  <Chip label={`${selectedTask.weight}%`} size="small" />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedTask.status.replace('_', ' ')}
                    color={getStatusColor(selectedTask.status) as any}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  License Level
                </Typography>
                <Chip label={selectedTask.licenseLevel} color="primary" size="small" />
              </Box>

              {selectedTask.releases && selectedTask.releases.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Releases
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedTask.releases.map((release: any) => (
                      <Chip 
                        key={release.id} 
                        label={`${release.name}${release.version ? ` ${release.version}` : ''}`}
                        color="secondary"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTask.outcomes && selectedTask.outcomes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Outcomes
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedTask.outcomes.map((outcome: any) => (
                      <Chip 
                        key={outcome.id} 
                        label={outcome.name}
                        color="success"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTask.estMinutes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Estimated Time
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.estMinutes} minutes
                  </Typography>
                </Box>
              )}

              {selectedTask.priority && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Priority
                  </Typography>
                  <Chip label={selectedTask.priority} size="small" />
                </Box>
              )}

              {selectedTask.howToDoc && selectedTask.howToDoc.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Documentation
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedTask.howToDoc.map((doc: string, index: number) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Article fontSize="small" color="primary" />
                        <Typography 
                          variant="body2" 
                          component="a" 
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {doc.length > 60 ? `${doc.substring(0, 60)}...` : doc}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTask.howToVideo && selectedTask.howToVideo.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Video Tutorials
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedTask.howToVideo.map((video: string, index: number) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OndemandVideo fontSize="small" color="error" />
                        <Typography 
                          variant="body2" 
                          component="a" 
                          href={video}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {video.length > 60 ? `${video.substring(0, 60)}...` : video}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTask.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Task Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedTask.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {selectedTask.statusNotes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Task Adoption Notes History
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#E3F2FD', maxHeight: '300px', overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {selectedTask.statusNotes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {(() => {
                // Only show update info if we have a valid date
                if (!selectedTask.statusUpdatedAt) return null;
                
                try {
                  const date = new Date(selectedTask.statusUpdatedAt);
                  if (isNaN(date.getTime())) return null; // Invalid date, don't show section
                  
                  return (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Last Status Update
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {date.toLocaleString()}
                        {selectedTask.statusUpdatedBy && ` • by ${selectedTask.statusUpdatedBy}`}
                        {selectedTask.statusUpdateSource && (
                          <Chip 
                            label={selectedTask.statusUpdateSource}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                            color={
                              selectedTask.statusUpdateSource === 'MANUAL' ? 'primary' :
                              selectedTask.statusUpdateSource === 'TELEMETRY' ? 'success' :
                              selectedTask.statusUpdateSource === 'IMPORT' ? 'info' :
                              'default'
                            }
                          />
                        )}
                      </Typography>
                    </Box>
                  );
                } catch (e) {
                  return null; // Error parsing date, don't show section
                }
              })()}
                </Box>
              )}

              {/* Tab 1: Success Criteria */}
              {taskDetailsActiveTab === 1 && (
                <Box>
              {/* Success Criteria */}
              {selectedTask.telemetryAttributes && selectedTask.telemetryAttributes.some((attr: any) => attr.successCriteria) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Success Criteria
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedTask.telemetryAttributes
                      .filter((attr: any) => attr.successCriteria)
                      .map((attr: any) => {
                        let criteriaDisplay: React.ReactNode = null;
                        
                        try {
                          const parsed = JSON.parse(attr.successCriteria);
                          if (typeof parsed === 'object' && parsed !== null) {
                            criteriaDisplay = (
                              <Box component="pre" sx={{ 
                                m: 0, 
                                p: 1, 
                                backgroundColor: '#f5f5f5', 
                                borderRadius: 1, 
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                fontFamily: 'monospace'
                              }}>
                                {JSON.stringify(parsed, null, 2)}
                              </Box>
                            );
                          } else {
                            criteriaDisplay = <Typography variant="body2">{String(parsed)}</Typography>;
                          }
                        } catch {
                          criteriaDisplay = <Typography variant="body2">{attr.successCriteria}</Typography>;
                        }

                        return (
                          <Box
                            key={attr.id}
                            sx={{
                              p: 2,
                              border: '1px solid #2196F3',
                              borderRadius: 1,
                              backgroundColor: '#E3F2FD'
                            }}
                          >
                            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                              {attr.name}
                            </Typography>
                            {attr.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                                {attr.description}
                              </Typography>
                            )}
                            {criteriaDisplay}
                          </Box>
                        );
                      })}
                  </Box>
                </Box>
              )}

              {!selectedTask.telemetryAttributes?.some((attr: any) => attr.successCriteria) && (
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  backgroundColor: '#FFF3E0', 
                  border: '1px solid #FF9800', 
                  borderRadius: 1 
                }}>
                  <Typography variant="body2" color="warning.dark">
                    ⚠️ No success criteria defined for this task
                  </Typography>
                </Box>
              )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDetailsDialogOpen(false)}>
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
    </Box>
  );
}
