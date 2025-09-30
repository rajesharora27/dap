import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  LinearProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Fab,
  Collapse
} from '@mui/material';
import { TaskDialog } from '../components/dialogs/TaskDialog';
import { ProductDialog } from '../components/dialogs/ProductDialog';
import { LicenseDialog } from '../components/dialogs/LicenseDialog';
import { ReleaseDialog } from '../components/dialogs/ReleaseDialog';
import { OutcomeDialog } from '../components/dialogs/OutcomeDialog';
import { CustomAttributeDialog } from '../components/dialogs/CustomAttributeDialog';
import { LicenseHandlers, ReleaseHandlers, OutcomeHandlers, ProductHandlers } from '../utils/sharedHandlers';
import { License, Outcome } from '../types/shared';
import {
  Inventory2 as ProductIcon,
  Lightbulb as SolutionIcon,
  People as CustomerIcon,
  Edit,
  Delete,
  Add,
  DragIndicator,
  ImportExport,
  FileDownload,
  FileUpload,
  Task as TaskIcon,
  Badge as LicenseIcon,
  Flag as OutcomeIcon,
  Settings as CustomAttributeIcon,
  Home as MainIcon,
  ExpandLess,
  ExpandMore,
  Rocket as ReleaseIcon
} from '@mui/icons-material';
import { AuthBar } from '../components/AuthBar';
import { ProductDetailPage } from '../components/ProductDetailPage';
import { TaskDetailDialog } from '../components/TaskDetailDialog';
import { useAuth } from '../components/AuthContext';
import { gql, useQuery, useApolloClient } from '@apollo/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// GraphQL queries for fetching data with relationships
const PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          statusPercent
          customAttrs
          licenses {
            id
            name
            description
            level
            isActive
          }
          releases {
            id
            name
            description
            level
            isActive
          }
          outcomes {
            id
            name
            description
          }
        }
      }
    }
  }
`;

const SOLUTIONS = gql`
  query Solutions {
    solutions {
      edges {
        node {
          id
          name
          description
        }
      }
    }
  }
`;

const CUSTOMERS = gql`
  query Customers {
    customers {
      id
      name
      description
    }
  }
`;

const TASKS_FOR_PRODUCT = gql`
  query TasksForProduct($productId: ID!) {
    tasks(productId: $productId, first: 100) {
      edges {
        node {
          id
          name
          description
          estMinutes
          weight
          sequenceNumber
          licenseLevel
          priority
          notes
          howToDoc
          howToVideo
          license {
            id
            name
            level
          }
          outcomes {
            id
            name
          }
          releases {
            id
            name
            level
            description
          }
        }
      }
    }
  }
`;



const OUTCOMES = gql`
  query Outcomes($productId: ID) {
    outcomes(productId: $productId) {
      id
      name
      product {
        id
        name
      }
    }
  }
`;

const REORDER_TASKS = gql`
  mutation ReorderTasks($productId: ID!, $order: [ID!]!) {
    reorderTasks(productId: $productId, order: $order)
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      statusPercent
      customAttrs
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description
      estMinutes
      weight
      sequenceNumber
      licenseLevel
      priority
      notes
      howToDoc
      howToVideo
      license {
        id
        name
        level
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
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

const PROCESS_DELETION_QUEUE = gql`
  mutation ProcessDeletionQueue {
    processDeletionQueue
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const UPDATE_LICENSE = gql`
  mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
    updateLicense(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const DELETE_LICENSE = gql`
  mutation DeleteLicense($id: ID!) {
    deleteLicense(id: $id)
  }
`;

const CREATE_RELEASE = gql`
  mutation CreateRelease($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const UPDATE_RELEASE = gql`
  mutation UpdateRelease($id: ID!, $input: ReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

// Sortable Task Item Component
function SortableTaskItem({ task, onEdit, onDelete, onDoubleClick }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 1 }}>
      <ListItemButton
        onDoubleClick={() => onDoubleClick(task)}
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          '&:hover': {
            backgroundColor: '#f5f5f5'
          },
          cursor: 'pointer'
        }}
      >
        <ListItemIcon
          sx={{ minWidth: '32px', cursor: 'grab' }}
          {...attributes}
          {...listeners}
        >
          <DragIndicator sx={{ color: 'text.secondary' }} />
        </ListItemIcon>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Primary content */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task.sequenceNumber && (
              <Chip
                size="small"
                label={`#${task.sequenceNumber}`}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 'bold', minWidth: '48px' }}
              />
            )}
            <Typography variant="subtitle1" component="div">
              {task.name}
            </Typography>
            <Chip
              size="small"
              label={`${task.weight}%`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          {/* Secondary content */}
          <Box sx={{ mt: 1 }}>
            {/* Outcomes for this task */}
            {task.outcomes && task.outcomes.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="info.main" sx={{ mr: 0.5 }}>
                  Outcomes:
                </Typography>
                {task.outcomes.map((outcome: any) => (
                  <Chip
                    key={outcome.id}
                    size="small"
                    label={outcome.name}
                    color="info"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', mb: 0.5, display: 'block' }}>
                No outcomes linked
              </Typography>
            )}

            {/* Releases for this task */}
            {task.releases && task.releases.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" color="success.main" sx={{ mr: 0.5 }}>
                  Releases:
                </Typography>
                {task.releases.map((release: any) => (
                  <Chip
                    key={release.id}
                    size="small"
                    label={`${release.name} (v${release.level})`}
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No releases assigned
              </Typography>
            )}

            {/* How-to links */}
            {(task.howToDoc || task.howToVideo) && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" color="primary.main" sx={{ mr: 0.5 }}>
                  How-to:
                </Typography>
                {task.howToDoc && (
                  <Chip
                    size="small"
                    label="📖 Docs"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: '20px', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(task.howToDoc, '_blank');
                    }}
                  />
                )}
                {task.howToVideo && (
                  <Chip
                    size="small"
                    label="🎥 Video"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: '20px', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(task.howToVideo, '_blank');
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </ListItemButton>
    </Box>
  );
}

const drawerWidth = 240;

export function App() {
  // Apollo client for mutations
  const client = useApolloClient();
  const { token } = useAuth();

  // State for managing UI and selections
  const isAuthenticated = true; // Always authenticated for demo

  // State management
  const [selectedSection, setSelectedSection] = useState<'products' | 'solutions' | 'customers'>('products');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSolution, setSelectedSolution] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [selectedProductSubSection, setSelectedProductSubSection] = useState<'tasks' | 'main' | 'licenses' | 'releases' | 'outcomes' | 'customAttributes'>('main');
  const [productsExpanded, setProductsExpanded] = useState(true);

  // Dialog states
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [addTaskDialog, setAddTaskDialog] = useState(false);
  const [editProductDialog, setEditProductDialog] = useState(false);
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [taskDetailDialog, setTaskDetailDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '' });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);

  // New dialog states for sub-sections
  const [addLicenseDialog, setAddLicenseDialog] = useState(false);
  const [editLicenseDialog, setEditLicenseDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [addReleaseDialog, setAddReleaseDialog] = useState(false);
  const [editReleaseDialog, setEditReleaseDialog] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);
  const [addOutcomeDialog, setAddOutcomeDialog] = useState(false);
  const [editOutcomeDialog, setEditOutcomeDialog] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<any>(null);
  const [addCustomAttributeDialog, setAddCustomAttributeDialog] = useState(false);
  const [editCustomAttributeDialog, setEditCustomAttributeDialog] = useState(false);
  const [editingCustomAttribute, setEditingCustomAttribute] = useState<any>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // GraphQL queries
  const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery(PRODUCTS, {
    errorPolicy: 'all',
    onError: (error) => {
      console.error('🚨 PRODUCTS Query Error:', error);
      console.error('🚨 Network Error:', error.networkError);
      console.error('🚨 GraphQL Errors:', error.graphQLErrors);
      if (error.networkError && (error.networkError as any).statusCode === 400) {
        console.error('🚨 400 ERROR - This suggests a GraphQL query format issue');
      }
    },
    onCompleted: (data) => {
      console.log('✅ PRODUCTS Query Success:', data);
    }
  });

  const { data: solutionsData, loading: solutionsLoading, error: solutionsError } = useQuery(SOLUTIONS, {
    errorPolicy: 'all'
  });

  const { data: customersData, loading: customersLoading, error: customersError } = useQuery(CUSTOMERS, {
    errorPolicy: 'all'
  });

  const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(TASKS_FOR_PRODUCT, {
    variables: { productId: selectedProduct },
    skip: !selectedProduct,
    errorPolicy: 'all'
  });



  const { data: outcomesData } = useQuery(OUTCOMES, {
    variables: { productId: selectedProduct },
    skip: !selectedProduct,
    errorPolicy: 'all'
  });

  // Extract data from GraphQL responses
  const products = productsData?.products?.edges?.map((edge: any) => {
    const node = edge.node;
    // Normalize customAttrs to always be an object
    let normalizedCustomAttrs = {};

    if (node.customAttrs) {
      if (typeof node.customAttrs === 'string') {
        try {
          normalizedCustomAttrs = JSON.parse(node.customAttrs);
        } catch (e) {
          console.warn('Invalid JSON in customAttrs for product', node.id, ':', node.customAttrs);
          normalizedCustomAttrs = {};
        }
      } else {
        normalizedCustomAttrs = node.customAttrs;
      }
    }

    // Return a new object with normalized customAttrs
    return {
      ...node,
      customAttrs: normalizedCustomAttrs
    };
  }) || [];
  const solutions = solutionsData?.solutions?.edges?.map((edge: any) => edge.node) || [];
  const customers = customersData?.customers || [];
  const tasks = [...(tasksData?.tasks?.edges?.map((edge: any) => edge.node) || [])]
    .sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
  const outcomes = outcomesData?.outcomes || [];

  // Initialize shared handlers
  const licenseHandlers = new LicenseHandlers(client);
  const releaseHandlers = new ReleaseHandlers(client);
  const outcomeHandlers = new OutcomeHandlers(client);
  const productHandlers = new ProductHandlers(client);

  // Auto-select first product if none selected
  React.useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].id);
      setSelectedProductSubSection('main');
    }
  }, [products, selectedProduct]);

  // Debug logging
  console.log('App Component Loaded!');
  console.log('App authentication status:', {
    isAuthenticated,
    token: token ? 'Token present' : 'No token',
    tokenLength: token?.length || 0
  });
  console.log('App Data Debug:', {
    productsCount: products.length,
    solutionsCount: solutions.length,
    customersCount: customers.length,
    tasksCount: tasks.length,
    outcomesCount: outcomes.length,
    selectedProduct,
    selectedSection,
    viewMode,
    productsLoading,
    tasksLoading,
    productsError: productsError?.message,
    tasksError: tasksError?.message,
    products: products.slice(0, 2),
    tasks: tasks.slice(0, 2),
    outcomes: outcomes.slice(0, 2)
  });

  // Release handlers
  const handleDeleteRelease = async (releaseId: string) => {
    try {
      await client.mutate({
        mutation: DELETE_RELEASE,
        variables: { id: releaseId },
        refetchQueries: ['Products'],
        awaitRefetchQueries: true
      });
      await refetchProducts();
    } catch (error) {
      console.error('Error deleting release:', error);
      alert('Failed to delete release');
    }
  };

  const handleExportReleases = () => {
    const currentProduct = products.find((p: any) => p.id === selectedProduct);
    const releases = currentProduct?.releases || [];

    if (releases.length === 0) {
      alert('No releases to export');
      return;
    }

    const exportData = {
      productId: selectedProduct,
      productName: currentProduct?.name,
      exportType: 'releases',
      exportDate: new Date().toISOString(),
      data: releases.map((release: any) => ({
        name: release.name,
        description: release.description,
        level: release.level,
        isActive: release.isActive
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProduct?.name || 'product'}-releases-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Navigation handlers
  const handleSectionChange = (section: 'products' | 'solutions' | 'customers') => {
    setSelectedSection(section);
    setSelectedSolution('');
    setSelectedCustomer('');
    setSelectedTask('');

    if (section === 'products') {
      setProductsExpanded(true);
      // Reset to first product when clicking Products menu
      if (products.length > 0) {
        setSelectedProduct(products[0].id);
        setSelectedProductSubSection('main');
      } else {
        setSelectedProduct('');
      }
    } else {
      setSelectedProduct('');
    }
  };

  const handleProductSubSectionChange = (subSection: 'main' | 'licenses' | 'releases' | 'outcomes' | 'customAttributes' | 'tasks') => {
    setSelectedProductSubSection(subSection);
    setSelectedSection('products');
  };

  // Helper function to calculate total weight of tasks for a product
  const calculateTotalWeight = (product: any) => {
    if (!product?.tasks?.edges) {
      return 0;
    }
    return product.tasks.edges.reduce((total: number, edge: any) => {
      return total + (edge.node.weight || 0);
    }, 0);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    setSelectedProductSubSection('main');
    setSelectedTask('');
  };

  const handleSolutionChange = (solutionId: string) => {
    setSelectedSolution(solutionId);
    setSelectedTask('');
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedTask('');
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex((task: any) => task.id === active.id);
      const newIndex = tasks.findIndex((task: any) => task.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      const newOrder = newTasks.map((task: any) => task.id);

      try {
        await client.mutate({
          mutation: REORDER_TASKS,
          variables: {
            productId: selectedProduct,
            order: newOrder
          }
        });

        // Refetch tasks to get updated sequence numbers
        await refetchTasks();
      } catch (error: any) {
        console.error('Error reordering tasks:', error);
        alert('Failed to reorder tasks: ' + (error?.message || 'Unknown error'));
      }
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditProductDialog(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setEditTaskDialog(true);
  };

  // License handlers
  const handleAddLicenseSave = async (licenseData: License) => {
    const result = await licenseHandlers.createLicense({
      ...licenseData,
      productId: selectedProduct!
    }, {
      refetchProducts,
      showAlert: true
    });

    if (result.success) {
      setAddLicenseDialog(false);
    }
  };

  const handleEditLicenseSave = async (licenseData: License) => {
    if (!editingLicense?.id) {
      alert('No license selected for editing');
      return;
    }

    // Ensure productId is included for the update
    const updateData: License = {
      ...licenseData,
      productId: selectedProduct || editingLicense.productId
    };

    if (!updateData.productId) {
      alert('Product ID is required for license update');
      return;
    }

    const result = await licenseHandlers.updateLicense(
      editingLicense.id,
      updateData,
      {
        refetchProducts,
        showAlert: true
      }
    );

    if (result.success) {
      setEditLicenseDialog(false);
      setEditingLicense(null);
    }
  };

  const handleDeleteLicense = async (licenseId: string) => {
    const result = await licenseHandlers.deleteLicense(licenseId, {
      refetchProducts,
      showAlert: true
    });
  };

  // Release handlers for standalone release management
  const handleAddReleaseSave = async (releaseData: { name: string; level: number; description?: string }) => {
    const result = await releaseHandlers.createRelease({
      ...releaseData,
      productId: selectedProduct!
    }, {
      refetchProducts,
      showAlert: true
    });

    if (result.success) {
      setAddReleaseDialog(false);
    }
  };

  const handleEditReleaseSave = async (releaseData: { name: string; level: number; description?: string }) => {
    if (!editingRelease?.id) {
      alert('No release selected for editing');
      return;
    }

    // Ensure productId is included for the update
    const updateData = {
      ...releaseData,
      productId: selectedProduct || editingRelease.productId
    };

    if (!updateData.productId) {
      alert('Product ID is required for release update');
      return;
    }

    const result = await releaseHandlers.updateRelease(
      editingRelease.id,
      updateData,
      {
        refetchProducts,
        showAlert: true
      }
    );

    if (result.success) {
      setEditReleaseDialog(false);
      setEditingRelease(null);
    }
  };

  const handleDeleteOutcome = async (outcomeId: string) => {
    const result = await outcomeHandlers.deleteOutcome(outcomeId, {
      refetchProducts,
      showAlert: true
    });
  };

  const handleExportLicenses = () => {
    const currentProduct = products.find((p: any) => p.id === selectedProduct);
    const licenses = currentProduct?.licenses || [];

    if (licenses.length === 0) {
      alert('No licenses to export');
      return;
    }

    // Create CSV content
    const csvHeaders = 'id,name,description,level,isActive\n';
    const csvRows = licenses.map((license: any) => {
      const escapeCsv = (field: any) => {
        const str = String(field || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsv(license.id),
        escapeCsv(license.name),
        escapeCsv(license.description),
        escapeCsv(license.level),
        escapeCsv(license.isActive)
      ].join(',');
    }).join('\n');

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProduct?.name || 'product'}-licenses-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportLicenses = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.trim().split('\n');

        if (lines.length < 2) {
          throw new Error('CSV file must have at least headers and one data row.');
        }

        // Parse CSV headers
        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
        const expectedHeaders = ['id', 'name', 'description', 'level', 'isActive'];

        if (!expectedHeaders.every(header => headers.includes(header))) {
          throw new Error(`CSV must include headers: ${expectedHeaders.join(', ')}`);
        }

        let importedCount = 0;
        let updatedCount = 0;
        const existingLicenses = products.find((p: any) => p.id === selectedProduct)?.licenses || [];

        // Parse CSV rows
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row.trim()) continue;

          // Simple CSV parser (handles quoted fields)
          const values: string[] = [];
          let currentValue = '';
          let inQuotes = false;

          for (let j = 0; j < row.length; j++) {
            const char = row[j];
            if (char === '"') {
              if (inQuotes && row[j + 1] === '"') {
                currentValue += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim()); // Add last value

          // Map values to object
          const licenseData: any = {};
          headers.forEach((header: string, index: number) => {
            licenseData[header] = values[index] || '';
          });

          if (!licenseData.name) {
            console.warn('Skipping license without name on row:', i + 1);
            continue;
          }

          try {
            // Clean up the ID - handle empty strings and trim whitespace
            const cleanId = licenseData.id?.toString().trim();
            const existingLicense = existingLicenses.find((l: any) => l.id?.toString() === cleanId);

            console.log('Processing license:', licenseData.name, 'ID:', cleanId, 'Existing found:', !!existingLicense);

            if (cleanId && existingLicense) {
              // Update existing license
              console.log('Updating existing license:', existingLicense.id);
              await client.mutate({
                mutation: UPDATE_LICENSE,
                variables: {
                  id: existingLicense.id, // Use the existing license's actual ID
                  input: {
                    name: licenseData.name,
                    description: licenseData.description || '',
                    level: parseInt(licenseData.level) || 1,
                    isActive: licenseData.isActive === 'true' || licenseData.isActive === true || licenseData.isActive === 'TRUE',
                    productId: selectedProduct
                  }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
              });
              updatedCount++;
              console.log('License updated successfully:', licenseData.name);
            } else {
              // Create new license
              console.log('Creating new license:', licenseData.name);
              await client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                  input: {
                    name: licenseData.name,
                    description: licenseData.description || '',
                    level: parseInt(licenseData.level) || 1,
                    isActive: licenseData.isActive === 'true' || licenseData.isActive === true || licenseData.isActive === 'TRUE',
                    productId: selectedProduct
                  }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
              });
              importedCount++;
              console.log('License created successfully:', licenseData.name);
            }
          } catch (error) {
            console.error(`Failed to import/update license on row ${i + 1}:`, licenseData.name, error);
          }
        }

        await refetchProducts();
        alert(`Import completed!\nCreated: ${importedCount} licenses\nUpdated: ${updatedCount} licenses`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import licenses: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    input.click();
  };

  // Outcome handlers
  const handleAddOutcomeSave = async (outcomeData: Outcome) => {
    const result = await outcomeHandlers.createOutcome({
      ...outcomeData,
      productId: selectedProduct!
    }, {
      refetchProducts,
      showAlert: true
    });

    if (result.success) {
      setAddOutcomeDialog(false);
    }
  };

  const handleEditOutcomeSave = async (outcomeData: Outcome) => {
    if (!editingOutcome?.id) {
      alert('No outcome selected for editing');
      return;
    }

    // Ensure productId is included for the update
    const updateData: Outcome = {
      ...outcomeData,
      productId: selectedProduct || editingOutcome.productId
    };

    if (!updateData.productId) {
      alert('Product ID is required for outcome update');
      return;
    }

    const result = await outcomeHandlers.updateOutcome(
      editingOutcome.id,
      updateData,
      {
        refetchProducts,
        showAlert: true
      }
    );

    if (result.success) {
      setEditOutcomeDialog(false);
      setEditingOutcome(null);
    }
  };

  // Outcome export/import handlers
  const handleExportOutcomes = () => {
    const currentProduct = products.find((p: any) => p.id === selectedProduct);
    const outcomes = currentProduct?.outcomes || [];

    if (outcomes.length === 0) {
      alert('No outcomes to export');
      return;
    }

    // Create CSV content
    const csvHeaders = 'id,name,description\n';
    const csvRows = outcomes.map((outcome: any) => {
      const escapeCsv = (field: any) => {
        const str = String(field || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsv(outcome.id),
        escapeCsv(outcome.name),
        escapeCsv(outcome.description)
      ].join(',');
    }).join('\n');

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProduct?.name || 'product'}-outcomes-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportOutcomes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.trim().split('\n');

        if (lines.length < 2) {
          throw new Error('CSV file must have at least headers and one data row.');
        }

        // Parse CSV headers
        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
        const expectedHeaders = ['id', 'name', 'description'];

        if (!expectedHeaders.every(header => headers.includes(header))) {
          throw new Error(`CSV must include headers: ${expectedHeaders.join(', ')}`);
        }

        let importedCount = 0;
        let updatedCount = 0;
        const existingOutcomes = products.find((p: any) => p.id === selectedProduct)?.outcomes || [];

        // Parse CSV rows
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row.trim()) continue;

          // Simple CSV parser (handles quoted fields)
          const values: string[] = [];
          let currentValue = '';
          let inQuotes = false;

          for (let j = 0; j < row.length; j++) {
            const char = row[j];
            if (char === '"') {
              if (inQuotes && row[j + 1] === '"') {
                currentValue += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim()); // Add last value

          // Map values to object
          const outcomeData: any = {};
          headers.forEach((header: string, index: number) => {
            outcomeData[header] = values[index] || '';
          });

          if (!outcomeData.name) {
            console.warn('Skipping outcome without name on row:', i + 1);
            continue;
          }

          try {
            // Clean up the ID - handle empty strings and trim whitespace
            const cleanId = outcomeData.id?.toString().trim();
            const existingOutcome = existingOutcomes.find((o: any) => o.id?.toString() === cleanId);

            console.log('Processing outcome:', outcomeData.name, 'ID:', cleanId, 'Existing found:', !!existingOutcome);

            if (cleanId && existingOutcome) {
              // Update existing outcome
              console.log('Updating existing outcome:', existingOutcome.id);
              await client.mutate({
                mutation: gql`
                  mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
                    updateOutcome(id: $id, input: $input) {
                      id
                      name
                      description
                    }
                  }
                `,
                variables: {
                  id: existingOutcome.id, // Use the existing outcome's actual ID
                  input: {
                    name: outcomeData.name,
                    description: outcomeData.description || '',
                    productId: selectedProduct
                  }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
              });
              updatedCount++;
              console.log('Outcome updated successfully:', outcomeData.name);
            } else {
              // Create new outcome
              console.log('Creating new outcome:', outcomeData.name);
              await client.mutate({
                mutation: gql`
                  mutation CreateOutcome($input: OutcomeInput!) {
                    createOutcome(input: $input) {
                      id
                      name
                      description
                    }
                  }
                `,
                variables: {
                  input: {
                    name: outcomeData.name,
                    description: outcomeData.description || '',
                    productId: selectedProduct
                  }
                },
                refetchQueries: ['Products'],
                awaitRefetchQueries: true
              });
              importedCount++;
              console.log('Outcome created successfully:', outcomeData.name);
            }
          } catch (error) {
            console.error(`Failed to import/update outcome on row ${i + 1}:`, outcomeData.name, error);
          }
        }

        await refetchProducts();
        alert(`Import completed!\nCreated: ${importedCount} outcomes\nUpdated: ${updatedCount} outcomes`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import outcomes: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    input.click();
  };

  const handleUpdateProduct = async (data: {
    name: string;
    description?: string;
    customAttrs?: any;
    outcomes?: Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>;
    licenses?: Array<{ id?: string; name: string; description?: string; level: string; isActive: boolean; isNew?: boolean; delete?: boolean }>;
    releases?: Array<{ id?: string; name: string; level: number; description?: string; isNew?: boolean; delete?: boolean }>;
  }) => {
    if (!data.name?.trim()) return;

    try {
      const result = await productHandlers.updateProductWithDetails(
        editingProduct.id,
        data,
        {
          refetchProducts,
          showAlert: false // Let ProductDialog handle errors
        }
      );

      if (result.success) {
        console.log('Product updated successfully');
        setEditProductDialog(false);
        setEditingProduct(null);
      } else {
        throw new Error(result.error?.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      throw error; // Re-throw so ProductDialog can handle the error
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask?.name?.trim()) return;

    try {
      // Create input with only valid TaskInput fields
      const input: any = {
        name: editingTask.name,
        estMinutes: editingTask.estMinutes,
        weight: editingTask.weight,
        licenseLevel: editingTask.licenseLevel || 'ESSENTIAL',
        priority: editingTask.priority
      };

      // Only add optional fields if they have values
      if (editingTask.description?.trim()) {
        input.description = editingTask.description.trim();
      }
      if (editingTask.notes?.trim()) {
        input.notes = editingTask.notes.trim();
      }

      await client.mutate({
        mutation: UPDATE_TASK,
        variables: {
          id: editingTask.id,
          input
        },
        refetchQueries: ['TasksForProduct'],
        awaitRefetchQueries: true
      });

      console.log('Task updated successfully');
      setEditTaskDialog(false);
      setEditingTask(null);
      await refetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      alert('Failed to update task: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleEditTaskSave = async (taskData: any) => {
    if (!editingTask?.id) return;

    try {
      // Create input with only valid TaskUpdateInput fields
      const input: any = {
        name: taskData.name,
        estMinutes: taskData.estMinutes,
        weight: taskData.weight,
        priority: taskData.priority
      };

      // Only add optional fields if they have values
      if (taskData.description?.trim()) {
        input.description = taskData.description.trim();
      }
      if (taskData.notes?.trim()) {
        input.notes = taskData.notes.trim();
      }
      if (taskData.howToDoc?.trim()) {
        input.howToDoc = taskData.howToDoc.trim();
      }
      if (taskData.howToVideo?.trim()) {
        input.howToVideo = taskData.howToVideo.trim();
      }
      if (taskData.licenseId) {
        input.licenseId = taskData.licenseId;
      }
      if (taskData.outcomeIds && taskData.outcomeIds.length > 0) {
        input.outcomeIds = taskData.outcomeIds;
      }
      if (taskData.releaseIds && taskData.releaseIds.length > 0) {
        input.releaseIds = taskData.releaseIds;
      }
      // Note: productId is not part of TaskUpdateInput, it's inferred from the task being updated

      await client.mutate({
        mutation: UPDATE_TASK,
        variables: {
          id: editingTask.id,
          input
        },
        refetchQueries: ['TasksForProduct'],
        awaitRefetchQueries: true
      });

      setEditTaskDialog(false);
      setEditingTask(null);
      await refetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      alert('Failed to update task: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      // First, queue the task for deletion
      await client.mutate({
        mutation: DELETE_TASK,
        variables: { id: taskId }
      });

      // Then, process the deletion queue to actually remove it
      await client.mutate({
        mutation: PROCESS_DELETION_QUEUE,
        refetchQueries: ['TasksForProduct'],
        awaitRefetchQueries: true
      });

      console.log('Task deleted successfully');
      await refetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Starting product deletion for ID:', productId);

      const result = await client.mutate({
        mutation: DELETE_PRODUCT,
        variables: { id: productId },
        refetchQueries: ['Products'],
        awaitRefetchQueries: true
      });

      console.log('Product deletion mutation result:', result);

      // If the deleted product was selected, clear the selection
      if (selectedProduct === productId) {
        setSelectedProduct('');
        console.log('Cleared selected product - tasks will be cleared automatically');
      }

      console.log('Product deleted successfully!');
      alert('Product deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      console.error('Error details:', {
        message: error?.message,
        graphQLErrors: error?.graphQLErrors,
        networkError: error?.networkError
      });
      alert('Failed to delete product: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleViewProductDetails = (product: any) => {
    setDetailProduct(product);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setDetailProduct(null);
  };

  const handleTaskDoubleClick = (task: any) => {
    setSelectedTaskForDetail(task);
    setTaskDetailDialog(true);
  };

  const handleTaskDetailSave = async () => {
    await refetchTasks();
  };

  const handleAddProductSave = async (data: {
    name: string;
    description?: string;
    customAttrs?: any;
    outcomes?: Array<{ id?: string; name: string; description?: string; isNew?: boolean; delete?: boolean }>;
    licenses?: Array<{ id?: string; name: string; description?: string; level: string; isActive: boolean; isNew?: boolean; delete?: boolean }>;
    releases?: Array<{ id?: string; name: string; level: number; description?: string; isNew?: boolean; delete?: boolean }>;
  }) => {
    if (!data.name?.trim()) return;

    try {
      // Create the product first
      const productResult = await productHandlers.createProduct({
        name: data.name,
        description: data.description || '',
        customAttrs: data.customAttrs || {}
      }, {
        refetchProducts,
        showAlert: false // Let ProductDialog handle errors
      });

      if (!productResult.success || !productResult.data) {
        throw new Error(productResult.error?.message || 'Failed to create product');
      }

      const productId = productResult.data.id;

      // Create licenses if provided, or create default Essential license
      if (data.licenses && data.licenses.length > 0) {
        for (const license of data.licenses) {
          if (!license.delete) {
            const licenseResult = await licenseHandlers.createLicense({
              name: license.name,
              description: license.description || '',
              level: parseInt(license.level),
              isActive: license.isActive,
              productId: productId
            }, {
              refetchProducts,
              showAlert: false
            });

            if (!licenseResult.success) {
              console.error('Failed to create license:', licenseResult.error?.message);
            }
          }
        }
      } else {
        // Create default Essential license
        await licenseHandlers.createLicense({
          name: "Essential",
          description: "Default essential license for " + data.name,
          level: 1,
          isActive: true,
          productId: productId
        }, {
          refetchProducts,
          showAlert: false
        });
      }

      // Create outcomes if provided, or create default outcome with product name
      if (data.outcomes && data.outcomes.length > 0) {
        for (const outcome of data.outcomes) {
          if (!outcome.delete) {
            const outcomeResult = await outcomeHandlers.createOutcome({
              name: outcome.name,
              description: outcome.description || '',
              productId: productId
            }, {
              refetchProducts,
              showAlert: false
            });

            if (!outcomeResult.success) {
              console.error('Failed to create outcome:', outcomeResult.error?.message);
            }
          }
        }
      } else {
        // Create default outcome with product name
        await outcomeHandlers.createOutcome({
          name: data.name,
          description: "Primary outcome for " + data.name,
          productId: productId
        }, {
          refetchProducts,
          showAlert: false
        });
      }

      // Create releases if provided, or create default 1.0 release
      if (data.releases && data.releases.length > 0 && productId) {
        for (const release of data.releases) {
          if (!release.delete) {
            const releaseResult = await releaseHandlers.createRelease({
              name: release.name,
              level: release.level,
              description: release.description || '',
              productId: productId
            }, {
              refetchProducts,
              showAlert: false
            });

            if (!releaseResult.success) {
              console.error('Failed to create release:', releaseResult.error?.message);
            }
          }
        }
      } else {
        // Create default 1.0 release
        await releaseHandlers.createRelease({
          name: "1.0",
          level: 1.0,
          description: "Initial release for " + data.name,
          productId: productId
        }, {
          refetchProducts,
          showAlert: false
        });
      }

      console.log('Product created successfully');
      setAddProductDialog(false);
    } catch (error: any) {
      console.error('Error adding product:', error);
      throw error; // Re-throw so ProductDialog can handle the error
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return;

    try {
      const result = await client.mutate({
        mutation: gql`
          mutation CreateProduct($input: ProductInput!) {
            createProduct(input: $input) {
              id
              name
              description
              statusPercent
            }
          }
        `,
        variables: {
          input: {
            name: newProduct.name,
            description: newProduct.description,
            customAttrs: {}
          }
        },
        refetchQueries: ['Products'],
        awaitRefetchQueries: true
      });

      const productId = result.data.createProduct.id;

      // Create default Essential license
      await client.mutate({
        mutation: CREATE_LICENSE,
        variables: {
          input: {
            name: "Essential",
            description: "Default essential license for " + newProduct.name,
            level: 1,
            isActive: true,
            productId: productId
          }
        }
      });

      // Create default outcome with product name
      await client.mutate({
        mutation: gql`
          mutation CreateOutcome($input: OutcomeInput!) {
            createOutcome(input: $input) {
              id
              name
              description
            }
          }
        `,
        variables: {
          input: {
            name: newProduct.name,
            description: "Primary outcome for " + newProduct.name,
            productId: productId
          }
        }
      });

      console.log('Product created successfully:', result.data.createProduct);
      setNewProduct({ name: '', description: '' });
      setAddProductDialog(false);

      await refetchProducts();
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert('Failed to add product: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleAddTaskSave = async (taskData: any) => {
    console.log('🚨🚨🚨 App.tsx handleAddTaskSave called!');
    console.log('🚨🚨🚨 TaskData received:', JSON.stringify(taskData, null, 2));
    console.log('🚨🚨🚨 selectedProduct:', selectedProduct);
    console.log('🚨🚨🚨 selectedProductSubSection:', selectedProductSubSection);
    if (!selectedProduct) return;

    try {
      // Create input with only valid TaskInput fields
      const input: any = {
        productId: selectedProduct,
        name: taskData.name,
        estMinutes: taskData.estMinutes,
        weight: taskData.weight,
        priority: taskData.priority
      };

      // Only add optional fields if they have values
      if (taskData.description?.trim()) {
        input.description = taskData.description.trim();
      }
      if (taskData.notes?.trim()) {
        input.notes = taskData.notes.trim();
      }
      if (taskData.howToDoc?.trim()) {
        input.howToDoc = taskData.howToDoc.trim();
      }
      if (taskData.howToVideo?.trim()) {
        input.howToVideo = taskData.howToVideo.trim();
      }
      if (taskData.licenseId) {
        input.licenseId = taskData.licenseId;
      }
      if (taskData.outcomeIds && taskData.outcomeIds.length > 0) {
        input.outcomeIds = taskData.outcomeIds;
      }
      if (taskData.releaseIds && taskData.releaseIds.length > 0) {
        input.releaseIds = taskData.releaseIds;
      }

      await client.mutate({
        mutation: gql`
          mutation CreateTask($input: TaskInput!) {
            createTask(input: $input) {
              id
              name
              description
              estMinutes
              weight
              sequenceNumber
              licenseLevel
              priority
              notes
              howToDoc
              howToVideo
              license {
                id
                name
                level
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
        `,
        variables: { input },
        refetchQueries: ['TasksForProduct'],
        awaitRefetchQueries: true
      });

      console.log('Task created successfully');
      setAddTaskDialog(false);
      await refetchTasks();
    } catch (error: any) {
      console.error('Error adding task:', error);
      alert('Failed to add task: ' + (error?.message || 'Unknown error'));
    }
  };

  // Task export/import handlers
  const handleExportTasks = () => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    if (tasks.length === 0) {
      alert('No tasks to export');
      return;
    }

    // Create CSV content
    const csvHeaders = 'id,name,description,estMinutes,weight,sequenceNumber,licenseLevel,priority,notes,howToDoc,howToVideo\n';
    const csvRows = tasks.map((task: any) => {
      const escapeCsv = (field: any) => {
        const str = String(field || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsv(task.id),
        escapeCsv(task.name),
        escapeCsv(task.description),
        escapeCsv(task.estMinutes),
        escapeCsv(task.weight),
        escapeCsv(task.sequenceNumber),
        escapeCsv(task.licenseLevel),
        escapeCsv(task.priority),
        escapeCsv(task.notes),
        escapeCsv(task.howToDoc),
        escapeCsv(task.howToVideo)
      ].join(',');
    }).join('\n');

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const currentProduct = products.find((p: any) => p.id === selectedProduct);
    link.download = `${currentProduct?.name || 'product'}-tasks-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTasks = () => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.trim().split('\n');

        if (lines.length < 2) {
          throw new Error('CSV file must have at least headers and one data row.');
        }

        // Parse CSV headers
        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
        const expectedHeaders = ['id', 'name', 'description', 'estMinutes', 'weight', 'sequenceNumber', 'licenseLevel', 'priority', 'notes'];

        if (!['id', 'name'].every(header => headers.includes(header))) {
          throw new Error('CSV must include at least id and name headers');
        }

        let importedCount = 0;
        let updatedCount = 0;

        // Parse CSV rows
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row.trim()) continue;

          // Simple CSV parser (handles quoted fields)
          const values: string[] = [];
          let currentValue = '';
          let inQuotes = false;

          for (let j = 0; j < row.length; j++) {
            const char = row[j];
            if (char === '"') {
              if (inQuotes && row[j + 1] === '"') {
                currentValue += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim()); // Add last value

          // Map values to object
          const taskData: any = {};
          headers.forEach((header: string, index: number) => {
            taskData[header] = values[index] || '';
          });

          if (!taskData.name) {
            console.warn('Skipping task without name on row:', i + 1);
            continue;
          }

          try {
            // Clean up the ID - handle empty strings and trim whitespace
            const cleanId = taskData.id?.toString().trim();
            const existingTask = tasks.find((t: any) => t.id?.toString() === cleanId);

            console.log('Processing task:', taskData.name, 'ID:', cleanId, 'Existing found:', !!existingTask);

            if (cleanId && existingTask) {
              // Update existing task
              console.log('Updating existing task:', existingTask.id);
              const input: any = {
                name: taskData.name,
                estMinutes: parseInt(taskData.estMinutes) || 0,
                weight: parseInt(taskData.weight) || 0,
                licenseLevel: taskData.licenseLevel || 'ESSENTIAL',
                priority: taskData.priority || 'MEDIUM'
              };

              // Only add optional fields if they have values
              if (taskData.description?.trim()) {
                input.description = taskData.description.trim();
              }
              if (taskData.notes?.trim()) {
                input.notes = taskData.notes.trim();
              }
              if (selectedProduct) {
                input.productId = selectedProduct;
              }

              await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                  id: existingTask.id, // Use the existing task's actual ID
                  input
                },
                refetchQueries: ['TasksForProduct'],
                awaitRefetchQueries: true
              });
              updatedCount++;
              console.log('Task updated successfully:', taskData.name);
            } else {
              // Create new task
              console.log('Creating new task:', taskData.name);
              const input: any = {
                productId: selectedProduct,
                name: taskData.name,
                estMinutes: parseInt(taskData.estMinutes) || 0,
                weight: parseInt(taskData.weight) || 0,
                licenseLevel: taskData.licenseLevel || 'ESSENTIAL',
                priority: taskData.priority || 'MEDIUM'
              };

              // Only add optional fields if they have values
              if (taskData.description?.trim()) {
                input.description = taskData.description.trim();
              }
              if (taskData.notes?.trim()) {
                input.notes = taskData.notes.trim();
              }

              await client.mutate({
                mutation: gql`
                  mutation CreateTask($input: TaskInput!) {
                    createTask(input: $input) {
                      id
                      name
                      description
                      estMinutes
                      weight
                      sequenceNumber
                      licenseLevel
                      priority
                      notes
                      howToDoc
                      howToVideo
                      license {
                        id
                        name
                        level
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
                `,
                variables: { input },
                refetchQueries: ['TasksForProduct'],
                awaitRefetchQueries: true
              });
              importedCount++;
              console.log('Task created successfully:', taskData.name);
            }
          } catch (error) {
            console.error(`Failed to import/update task on row ${i + 1}:`, taskData.name, error);
          }
        }

        await refetchTasks();
        alert(`Import completed!\nCreated: ${importedCount} tasks\nUpdated: ${updatedCount} tasks`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import tasks: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    input.click();
  };

  // Other Product Attributes handlers
  const handleAddCustomAttributeSave = async (attributeData: any) => {
    try {
      if (!selectedProduct) {
        throw new Error('No product selected');
      }

      const currentProduct = products.find((p: any) => p.id === selectedProduct);
      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const updatedCustomAttrs = {
        ...(currentProduct.customAttrs || {}),
        [attributeData.key]: attributeData.value
      };

      // Use the shared handler for consistency
      const result = await productHandlers.updateProduct(selectedProduct, {
        name: currentProduct.name,
        description: currentProduct.description,
        customAttrs: updatedCustomAttrs
      }, {
        refetchProducts,
        showAlert: true
      });

      if (result.success) {
        console.log('Product attribute added successfully');
        setAddCustomAttributeDialog(false);
      } else {
        throw new Error(result.error?.message || 'Failed to add product attribute');
      }
    } catch (error: any) {
      console.error('Error adding product attribute:', error);
      alert('Failed to add product attribute: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleEditCustomAttributeSave = async (attributeData: any) => {
    try {
      if (!selectedProduct || !editingCustomAttribute) {
        throw new Error('No product or attribute selected');
      }

      const currentProduct = products.find((p: any) => p.id === selectedProduct);
      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const updatedCustomAttrs = { ...(currentProduct.customAttrs || {}) };

      // Remove old key if key was changed
      if (editingCustomAttribute.key !== attributeData.key) {
        delete updatedCustomAttrs[editingCustomAttribute.key];
      }

      // Add/update with new key and value
      updatedCustomAttrs[attributeData.key] = attributeData.value;

      // Use the shared handler for consistency
      const result = await productHandlers.updateProduct(selectedProduct, {
        name: currentProduct.name,
        description: currentProduct.description,
        customAttrs: updatedCustomAttrs
      }, {
        refetchProducts,
        showAlert: true
      });

      if (result.success) {
        console.log('Custom attribute updated successfully');
        setEditCustomAttributeDialog(false);
        setEditingCustomAttribute(null);
      } else {
        throw new Error(result.error?.message || 'Failed to update custom attribute');
      }
    } catch (error: any) {
      console.error('Error updating custom attribute:', error);
      alert('Failed to update custom attribute: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleDeleteCustomAttribute = async (key: string) => {
    try {
      if (!selectedProduct) {
        throw new Error('No product selected');
      }

      const currentProduct = products.find((p: any) => p.id === selectedProduct);
      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const updatedCustomAttrs = { ...(currentProduct.customAttrs || {}) };
      delete updatedCustomAttrs[key];

      // Use the shared handler for consistency
      const result = await productHandlers.updateProduct(selectedProduct, {
        name: currentProduct.name,
        description: currentProduct.description,
        customAttrs: updatedCustomAttrs
      }, {
        refetchProducts,
        showAlert: true
      });

      if (result.success) {
        console.log('Custom attribute deleted successfully');
      } else {
        throw new Error(result.error?.message || 'Failed to delete custom attribute');
      }
    } catch (error: any) {
      console.error('Error deleting custom attribute:', error);
      alert('Failed to delete custom attribute: ' + (error?.message || 'Unknown error'));
    }
  };

  // Other Product Attributes export/import handlers (JSON format)
  const handleExportCustomAttributes = () => {
    const currentProduct = products.find((p: any) => p.id === selectedProduct);
    const customAttrs = currentProduct?.customAttrs || {};

    if (Object.keys(customAttrs).length === 0) {
      alert('No additional product attributes to export');
      return;
    }

    // Export as JSON (no duplicates since it's object keys)
    const exportData = {
      productId: selectedProduct,
      productName: currentProduct?.name || 'Unknown Product',
      exportType: 'customAttributes',
      exportDate: new Date().toISOString(),
      customAttributes: customAttrs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProduct?.name || 'product'}-custom-attributes-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCustomAttributes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.customAttributes || typeof importData.customAttributes !== 'object') {
          throw new Error('Invalid file format. Expected customAttributes object.');
        }

        const currentProduct = products.find((p: any) => p.id === selectedProduct);
        if (!currentProduct) {
          throw new Error('No product selected');
        }

        // Merge with existing custom attributes (no duplicates due to object merge)
        const mergedAttributes = {
          ...currentProduct.customAttrs,
          ...importData.customAttributes
        };

        console.log('Merging custom attributes:', {
          existing: currentProduct.customAttrs,
          importing: importData.customAttributes,
          merged: mergedAttributes
        });

        // Update product with merged attributes
        await client.mutate({
          mutation: UPDATE_PRODUCT,
          variables: {
            id: selectedProduct,
            input: {
              name: currentProduct.name,
              description: currentProduct.description,
              customAttrs: mergedAttributes
            }
          },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });

        console.log('Custom attributes updated successfully');
        await refetchProducts();
        const importedCount = Object.keys(importData.customAttributes).length;
        const existingCount = Object.keys(currentProduct.customAttrs || {}).length;
        const totalCount = Object.keys(mergedAttributes).length;

        alert(`Import completed!\nImported attributes: ${importedCount}\nTotal attributes: ${totalCount}\n(Duplicates were merged/updated)`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import custom attributes: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    input.click();
  };

  const handleExport = async (type: string) => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    try {
      let exportData: any[] = [];
      let filename = '';

      switch (type) {
        case 'products':
          // Export current product with all its attributes
          const product = products.find((p: any) => p.id === selectedProduct);
          if (product) {
            exportData = [{
              name: product.name,
              description: product.description,
              statusPercent: product.statusPercent,
              customAttrs: product.customAttrs
            }];
            filename = `product-${product.name.replace(/\s+/g, '-').toLowerCase()}.json`;
          }
          break;

        case 'outcomes':
          // Export outcomes for the selected product
          const outcomeResults = await client.query({
            query: gql`
              query Outcomes($productId: ID!) {
                outcomes(productId: $productId) {
                  id
                  name
                  description
                }
              }
            `,
            variables: { productId: selectedProduct },
            fetchPolicy: 'cache-first'
          });
          exportData = outcomeResults.data.outcomes.map((outcome: any) => ({
            name: outcome.name,
            description: outcome.description
          }));
          filename = `outcomes-${selectedProduct}.json`;
          break;

        case 'licenses':
          // Export licenses for the selected product
          const licenseResults = await client.query({
            query: gql`
              query Licenses($productId: ID!) {
                licenses(productId: $productId) {
                  id
                  name
                  description
                  level
                  isActive
                }
              }
            `,
            variables: { productId: selectedProduct },
            fetchPolicy: 'cache-first'
          });
          exportData = licenseResults.data.licenses.map((license: any) => ({
            name: license.name,
            description: license.description,
            level: license.level,
            isActive: license.isActive
          }));
          filename = `licenses-${selectedProduct}.json`;
          break;

        case 'tasks':
          // Export tasks for the selected product
          const taskResults = await client.query({
            query: gql`
              query Tasks($productId: ID!) {
                tasks(productId: $productId) {
                  id
                  name
                  description
                  outcome {
                    name
                  }
                  license {
                    name
                  }
                  customAttrs
                }
              }
            `,
            variables: { productId: selectedProduct },
            fetchPolicy: 'cache-first'
          });
          exportData = taskResults.data.tasks.map((task: any) => ({
            name: task.name,
            description: task.description,
            outcomeName: task.outcome?.name || '',
            licenseName: task.license?.name || '',
            customAttrs: task.customAttrs
          }));
          filename = `tasks-${selectedProduct}.json`;
          break;

        case 'customAttrs':
          // Export custom attributes template
          exportData = [{
            example_text_field: "Sample text value",
            example_number_field: 123,
            example_boolean_field: true,
            example_date_field: "2024-01-01",
            example_array_field: ["item1", "item2"],
            example_object_field: { key: "value" }
          }];
          filename = 'custom-attributes-template.json';
          break;

        default:
          alert('Invalid export type');
          return;
      }

      if (exportData.length === 0) {
        alert(`No ${type} data found to export`);
        return;
      }

      // Create and download the file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = filename;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      console.log(`${type} exported successfully:`, exportData);

    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      alert(`Failed to export ${type}`);
    }
  };

  const handleImport = (type: string) => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!Array.isArray(importData)) {
          alert('Import file must contain an array of items');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const item of importData) {
          try {
            switch (type) {
              case 'outcomes':
                if (!item.name) {
                  console.warn('Skipping outcome without name:', item);
                  continue;
                }
                await client.mutate({
                  mutation: gql`
                    mutation CreateOutcome($input: OutcomeInput!) {
                      createOutcome(input: $input) {
                        id
                        name
                        description
                      }
                    }
                  `,
                  variables: {
                    input: {
                      name: item.name,
                      description: item.description || '',
                      productId: selectedProduct
                    }
                  }
                });
                successCount++;
                break;

              case 'licenses':
                if (!item.name || item.level === undefined) {
                  console.warn('Skipping license without name or level:', item);
                  continue;
                }
                await client.mutate({
                  mutation: CREATE_LICENSE,
                  variables: {
                    input: {
                      name: item.name,
                      description: item.description || '',
                      level: parseInt(item.level) || 1,
                      isActive: item.isActive !== false, // Default to true if not specified
                      productId: selectedProduct
                    }
                  }
                });
                successCount++;
                break;

              case 'tasks':
                if (!item.name) {
                  console.warn('Skipping task without name:', item);
                  continue;
                }

                // Find outcome and license by name if specified
                let outcomeId = null;
                let licenseId = null;

                if (item.outcomeName) {
                  const outcomeResults = await client.query({
                    query: gql`
                      query Outcomes($productId: ID!) {
                        outcomes(productId: $productId) {
                          id
                          name
                        }
                      }
                    `,
                    variables: { productId: selectedProduct }
                  });
                  const outcome = outcomeResults.data.outcomes.find((o: any) => o.name === item.outcomeName);
                  outcomeId = outcome?.id;
                }

                if (item.licenseName) {
                  const licenseResults = await client.query({
                    query: gql`
                      query Licenses($productId: ID!) {
                        licenses(productId: $productId) {
                          id
                          name
                        }
                      }
                    `,
                    variables: { productId: selectedProduct }
                  });
                  const license = licenseResults.data.licenses.find((l: any) => l.name === item.licenseName);
                  licenseId = license?.id;
                }

                await client.mutate({
                  mutation: gql`
                    mutation CreateTask($input: TaskInput!) {
                      createTask(input: $input) {
                        id
                        name
                        description
                        estMinutes
                        weight
                        sequenceNumber
                        licenseLevel
                        priority
                        notes
                        howToDoc
                        howToVideo
                        license {
                          id
                          name
                          level
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
                  `,
                  variables: {
                    input: {
                      name: item.name,
                      description: item.description || '',
                      productId: selectedProduct,
                      outcomeId: outcomeId,
                      licenseId: licenseId,
                      customAttrs: item.customAttrs || {}
                    }
                  }
                });
                successCount++;
                break;

              default:
                console.warn('Unsupported import type:', type);
            }
          } catch (itemError) {
            console.error(`Error importing item:`, item, itemError);
            errorCount++;
          }
        }

        // Refresh data
        await refetchProducts();
        if (selectedProduct) {
          refetchTasks({ productId: selectedProduct });
        }

        alert(`Import completed!\nSuccessful: ${successCount}\nErrors: ${errorCount}`);

      } catch (error) {
        console.error(`Error importing ${type}:`, error);
        alert(`Failed to import ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    fileInput.click();
  };

  // Export all product data (comprehensive export) - excludes tasks
  const handleExportAllProductData = async () => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    try {
      const product = products.find((p: any) => p.id === selectedProduct);
      if (!product) {
        alert('Selected product not found');
        return;
      }

      // Get outcomes
      const outcomeResults = await client.query({
        query: gql`
          query Outcomes($productId: ID!) {
            outcomes(productId: $productId) {
              id
              name
              description
            }
          }
        `,
        variables: { productId: selectedProduct },
        fetchPolicy: 'network-only'
      });

      // Get licenses
      const licenseResults = await client.query({
        query: gql`
          query Licenses($productId: ID!) {
            licenses(productId: $productId) {
              id
              name
              description
              level
              isActive
            }
          }
        `,
        variables: { productId: selectedProduct },
        fetchPolicy: 'network-only'
      });

      const exportData = {
        product: {
          name: product.name,
          description: product.description,
          statusPercent: product.statusPercent,
          customAttrs: product.customAttrs
        },
        outcomes: outcomeResults.data.outcomes.map((outcome: any) => ({
          name: outcome.name,
          description: outcome.description
        })),
        licenses: licenseResults.data.licenses.map((license: any) => ({
          name: license.name,
          description: license.description,
          level: license.level,
          isActive: license.isActive
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const filename = `product-complete-${product.name.replace(/\s+/g, '-').toLowerCase()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', filename);
      linkElement.click();

      console.log('Complete product data exported (excluding tasks):', exportData);
      alert('Product data exported successfully (excluding tasks)');
    } catch (error) {
      console.error('Error exporting complete product data:', error);
      alert('Failed to export complete product data');
    }
  };

  // Import all product data (comprehensive import) - excludes tasks
  const handleImportAllProductData = () => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.product) {
          alert('Invalid file format - missing product data');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Import outcomes if provided
        if (importData.outcomes && Array.isArray(importData.outcomes)) {
          for (const outcome of importData.outcomes) {
            try {
              if (!outcome.name) continue;
              await client.mutate({
                mutation: gql`
                  mutation CreateOutcome($input: OutcomeInput!) {
                    createOutcome(input: $input) {
                      id
                      name
                      description
                    }
                  }
                `,
                variables: {
                  input: {
                    name: outcome.name,
                    description: outcome.description || '',
                    productId: selectedProduct
                  }
                }
              });
              successCount++;
            } catch (error) {
              console.error('Error importing outcome:', outcome, error);
              errorCount++;
            }
          }
        }

        // Import licenses if provided
        if (importData.licenses && Array.isArray(importData.licenses)) {
          for (const license of importData.licenses) {
            try {
              if (!license.name || license.level === undefined) continue;
              await client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                  input: {
                    name: license.name,
                    description: license.description || '',
                    level: parseInt(license.level) || 1,
                    isActive: license.isActive !== false,
                    productId: selectedProduct
                  }
                }
              });
              successCount++;
            } catch (error) {
              console.error('Error importing license:', license, error);
              errorCount++;
            }
          }
        }

        // Update product attributes if provided
        if (importData.product.customAttrs) {
          try {
            await client.mutate({
              mutation: UPDATE_PRODUCT,
              variables: {
                id: selectedProduct,
                input: {
                  customAttrs: importData.product.customAttrs
                }
              }
            });
            successCount++;
          } catch (error) {
            console.error('Error updating product attributes:', error);
            errorCount++;
          }
        }

        // Refresh data
        await refetchProducts();

        alert(`Product data import completed (excluding tasks)!\nSuccessful: ${successCount}\nErrors: ${errorCount}`);

      } catch (error) {
        console.error('Error importing complete product data:', error);
        alert(`Failed to import complete product data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    fileInput.click();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AuthBar />
      <Toolbar />

      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItemButton
              selected={selectedSection === 'products'}
              onClick={() => {
                setSelectedSection('products');
                setProductsExpanded(!productsExpanded);
              }}
            >
              <ListItemIcon>
                <ProductIcon />
              </ListItemIcon>
              <ListItemText primary="Products" />
              {productsExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={productsExpanded && selectedSection === 'products'} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedProductSubSection === 'main'}
                  onClick={() => handleProductSubSectionChange('main')}
                >
                  <ListItemIcon>
                    <MainIcon />
                  </ListItemIcon>
                  <ListItemText primary="Main" />
                </ListItemButton>

                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedProductSubSection === 'tasks'}
                  onClick={() => handleProductSubSectionChange('tasks')}
                >
                  <ListItemIcon>
                    <TaskIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tasks" />
                </ListItemButton>

                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedProductSubSection === 'licenses'}
                  onClick={() => handleProductSubSectionChange('licenses')}
                >
                  <ListItemIcon>
                    <LicenseIcon />
                  </ListItemIcon>
                  <ListItemText primary="Licenses" />
                </ListItemButton>

                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedProductSubSection === 'releases'}
                  onClick={() => handleProductSubSectionChange('releases')}
                >
                  <ListItemIcon>
                    <ReleaseIcon />
                  </ListItemIcon>
                  <ListItemText primary="Releases" />
                </ListItemButton>

                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedProductSubSection === 'outcomes'}
                  onClick={() => handleProductSubSectionChange('outcomes')}
                >
                  <ListItemIcon>
                    <OutcomeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Outcomes" />
                </ListItemButton>

                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedProductSubSection === 'customAttributes'}
                  onClick={() => handleProductSubSectionChange('customAttributes')}
                >
                  <ListItemIcon>
                    <CustomAttributeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Other Product Attributes" />
                </ListItemButton>
              </List>
            </Collapse>

            <ListItemButton
              selected={selectedSection === 'solutions'}
              onClick={() => handleSectionChange('solutions')}
            >
              <ListItemIcon>
                <SolutionIcon />
              </ListItemIcon>
              <ListItemText primary="Solutions" />
            </ListItemButton>

            <ListItemButton
              selected={selectedSection === 'customers'}
              onClick={() => handleSectionChange('customers')}
            >
              <ListItemIcon>
                <CustomerIcon />
              </ListItemIcon>
              <ListItemText primary="Customers" />
            </ListItemButton>
          </List>
          <Divider />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {/* Product Detail Page */}
        {viewMode === 'detail' && detailProduct && (
          <ProductDetailPage
            product={detailProduct}
            onBack={handleBackToList}
          />
        )}

        {/* Main List View */}
        {viewMode === 'list' && (
          <>
            {/* Products Section */}
            {selectedSection === 'products' && (
              <Box>
                {/* Header with Management Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                    Main
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setAddProductDialog(true)}
                    >
                      Add Product
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => {
                        if (selectedProduct) {
                          const product = products.find((p: any) => p.id === selectedProduct);
                          if (product && window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                            handleDeleteProduct(product.id);
                          }
                        }
                      }}
                      disabled={!selectedProduct}
                    >
                      Delete Product
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => {
                        if (selectedProduct) {
                          const product = products.find((p: any) => p.id === selectedProduct);
                          if (product) {
                            setEditingProduct({ ...product });
                            setEditProductDialog(true);
                          }
                        }
                      }}
                      disabled={!selectedProduct}
                    >
                      Edit Product
                    </Button>
                  </Box>
                </Box>                {/* Product Selection for all sub-sections */}
                <Paper sx={{ p: 2, mb: 2 }}>
                  {/* Loading States */}
                  {productsLoading && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading products...
                      </Typography>
                    </Box>
                  )}

                  {/* Error States */}
                  {productsError && (
                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                      Error loading products: {productsError.message}
                    </Typography>
                  )}

                  {/* Products Dropdown */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Product</InputLabel>
                    <Select
                      value={selectedProduct}
                      onChange={(e) => {
                        setSelectedProduct(e.target.value);
                        setSelectedProductSubSection('tasks');
                      }}
                      label="Select Product"
                    >
                      {products.map((product: any) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Product Description */}
                  {selectedProduct && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      {(() => {
                        const currentProduct = products.find((p: any) => p.id === selectedProduct);
                        return currentProduct ? (
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {currentProduct.name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph>
                              {currentProduct.description || 'No description provided'}
                            </Typography>
                          </Box>
                        ) : null;
                      })()}
                    </Box>
                  )}
                </Paper>

                {/* Consolidated Product Details */}
                {selectedProduct && selectedProductSubSection === 'main' && (
                  <Paper elevation={0} sx={{ p: 0 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '2rem' }}>
                        Product Overview
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                          variant="outlined" 
                          onClick={() => handleExportAllProductData()}
                          sx={{ 
                            textTransform: 'none',
                            borderColor: '#666',
                            color: '#666',
                            fontSize: '0.875rem',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                              borderColor: '#666'
                            }
                          }}
                        >
                          Export All
                        </Button>
                        <Button 
                          variant="outlined" 
                          onClick={() => handleImportAllProductData()}
                          sx={{ 
                            textTransform: 'none',
                            borderColor: '#666',
                            color: '#666',
                            fontSize: '0.875rem',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                              borderColor: '#666'
                            }
                          }}
                        >
                          Import All
                        </Button>
                        <Button 
                          variant="contained" 
                          onClick={() => setEditProductDialog(true)}
                          sx={{ 
                            textTransform: 'none',
                            backgroundColor: '#1976d2',
                            fontSize: '0.875rem',
                            '&:hover': {
                              backgroundColor: '#1565c0'
                            }
                          }}
                        >
                          Edit Product
                        </Button>
                      </Box>
                    </Box>

                    {(() => {
                      const currentProduct = products.find((p: any) => p.id === selectedProduct);
                      
                      if (!currentProduct) {
                        return <Typography variant="body1">No product selected or product not found</Typography>;
                      }

                      return (
                        <Box>
                          {/* Basic Product Information */}
                          <Paper elevation={1} sx={{ p: 4, mb: 4, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3, fontSize: '1.5rem' }}>
                              Basic Information
                            </Typography>
                            <Box sx={{ display: 'grid', gap: 2 }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                                  Product Name
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontSize: '1rem' }}>
                                  {currentProduct.name}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                                  Description
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontSize: '1rem' }}>
                                  {currentProduct.description || 'No description provided'}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>

                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
                            {/* Outcomes Section - First */}
                            <Paper elevation={1} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.25rem' }}>
                                  Outcomes ({currentProduct.outcomes?.length || 0})
                                </Typography>
                                <Button 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    textTransform: 'none',
                                    borderColor: '#1976d2',
                                    color: '#1976d2',
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      backgroundColor: '#f5f5f5',
                                      borderColor: '#1976d2'
                                    }
                                  }}
                                  onClick={() => handleProductSubSectionChange('outcomes')}
                                >
                                  View All
                                </Button>
                              </Box>
                              {currentProduct.outcomes?.length > 0 ? (
                                <List dense>
                                  {currentProduct.outcomes.slice(0, 3).map((outcome: any) => (
                                    <ListItem key={outcome.id} sx={{ px: 0, py: 1 }}>
                                      <ListItemText
                                        primary={
                                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>
                                            {outcome.name}
                                          </Typography>
                                        }
                                        secondary={
                                          <Typography variant="caption" color="text.secondary">
                                            {outcome.description || 'No description'}
                                          </Typography>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                  {currentProduct.outcomes.length > 3 && (
                                    <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 1, color: '#666', fontSize: '0.75rem' }}>
                                      +{currentProduct.outcomes.length - 3} more outcomes
                                    </Typography>
                                  )}
                                </List>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                  No outcomes defined. Click "View All" to add outcomes.
                                </Typography>
                              )}
                            </Paper>

                            {/* Licenses Section - Second */}
                            <Paper elevation={1} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.25rem' }}>
                                  Licenses ({currentProduct.licenses?.length || 0})
                                </Typography>
                                <Button 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    textTransform: 'none',
                                    borderColor: '#1976d2',
                                    color: '#1976d2',
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      backgroundColor: '#f5f5f5',
                                      borderColor: '#1976d2'
                                    }
                                  }}
                                  onClick={() => handleProductSubSectionChange('licenses')}
                                >
                                  View All
                                </Button>
                              </Box>
                              {currentProduct.licenses?.length > 0 ? (
                                <List dense>
                                  {currentProduct.licenses.slice(0, 3).map((license: any) => (
                                    <ListItem key={license.id} sx={{ px: 0, py: 1 }}>
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>
                                              {license.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ 
                                              backgroundColor: '#f5f5f5', 
                                              px: 1.5, 
                                              py: 0.5, 
                                              borderRadius: 1,
                                              fontSize: '0.75rem',
                                              color: '#666'
                                            }}>
                                              Level {license.level}
                                            </Typography>
                                          </Box>
                                        }
                                        secondary={
                                          <Typography variant="caption" color="text.secondary">
                                            {license.description || 'No description'} • {license.isActive ? 'Active' : 'Inactive'}
                                          </Typography>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                  {currentProduct.licenses.length > 3 && (
                                    <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 1, color: '#666', fontSize: '0.75rem' }}>
                                      +{currentProduct.licenses.length - 3} more licenses
                                    </Typography>
                                  )}
                                </List>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                  No licenses defined. Click "View All" to add licenses.
                                </Typography>
                              )}
                            </Paper>

                            {/* Releases Section - Third */}
                            <Paper elevation={1} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.25rem' }}>
                                  Releases ({currentProduct.releases?.length || 0})
                                </Typography>
                                <Button 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    textTransform: 'none',
                                    borderColor: '#1976d2',
                                    color: '#1976d2',
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      backgroundColor: '#f5f5f5',
                                      borderColor: '#1976d2'
                                    }
                                  }}
                                  onClick={() => handleProductSubSectionChange('releases')}
                                >
                                  View All
                                </Button>
                              </Box>
                              {currentProduct.releases?.length > 0 ? (
                                <List dense>
                                  {[...currentProduct.releases]
                                    .sort((a: any, b: any) => a.level - b.level)
                                    .slice(0, 3)
                                    .map((release: any) => (
                                      <ListItem key={release.id} sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>
                                                {release.name}
                                              </Typography>
                                              <Typography variant="caption" sx={{ 
                                                backgroundColor: '#f5f5f5', 
                                                px: 1.5, 
                                                py: 0.5, 
                                                borderRadius: 1,
                                                fontSize: '0.75rem',
                                                color: '#666'
                                              }}>
                                                v{release.level}
                                              </Typography>
                                            </Box>
                                          }
                                          secondary={
                                            <Typography variant="caption" color="text.secondary">
                                              {release.description || 'No description'} • {release.isActive ? 'Active' : 'Inactive'}
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                  {currentProduct.releases.length > 3 && (
                                    <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 1, color: '#666', fontSize: '0.75rem' }}>
                                      +{currentProduct.releases.length - 3} more releases
                                    </Typography>
                                  )}
                                </List>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                  No releases defined. Click "View All" to add releases.
                                </Typography>
                              )}
                            </Paper>

                            {/* Custom Attributes Section - Fourth */}
                            <Paper elevation={1} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.25rem' }}>
                                  Custom Attributes ({Object.keys(currentProduct.customAttrs || {}).length})
                                </Typography>
                                <Button 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    textTransform: 'none',
                                    borderColor: '#1976d2',
                                    color: '#1976d2',
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      backgroundColor: '#f5f5f5',
                                      borderColor: '#1976d2'
                                    }
                                  }}
                                  onClick={() => handleProductSubSectionChange('customAttributes')}
                                >
                                  View All
                                </Button>
                              </Box>
                              {(() => {
                                const customAttrs = currentProduct.customAttrs || {};
                                const attrEntries = Object.entries(customAttrs);

                                return attrEntries.length > 0 ? (
                                  <List dense>
                                    {attrEntries.slice(0, 3).map(([key, value]: [string, any]) => (
                                      <ListItem key={key} sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                          primary={
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>
                                              {key}
                                            </Typography>
                                          }
                                          secondary={
                                            <Typography variant="caption" color="text.secondary">
                                              {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value)}
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                    {attrEntries.length > 3 && (
                                      <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 1, color: '#666', fontSize: '0.75rem' }}>
                                        +{attrEntries.length - 3} more attributes
                                      </Typography>
                                    )}
                                  </List>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                    No custom attributes defined. Click "View All" to add attributes.
                                  </Typography>
                                );
                              })()}
                            </Paper>
                          </Box>
                        </Box>
                      );
                    })()}
                  </Paper>
                )}

                {/* Outcomes Sub-section */}
                {selectedProductSubSection === 'outcomes' && selectedProduct && (
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Outcomes for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddOutcomeDialog(true)}>
                          Add Outcome
                        </Button>
                        <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExportOutcomes}>
                          Export
                        </Button>
                        <Button variant="outlined" startIcon={<FileUpload />} onClick={handleImportOutcomes}>
                          Import
                        </Button>
                      </Box>
                    </Box>

                    {(() => {
                      const currentProduct = products.find((p: any) => p.id === selectedProduct);
                      const outcomes = currentProduct?.outcomes || [];

                      return outcomes.length > 0 ? (
                        <List>
                          {outcomes.map((outcome: any) => (
                            <ListItemButton
                              key={outcome.id}
                              sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                  backgroundColor: '#f5f5f5'
                                }
                              }}
                              onDoubleClick={() => {
                                setEditingOutcome(outcome);
                                setEditOutcomeDialog(true);
                              }}
                            >
                              <ListItemText
                                primary={outcome.name}
                                secondary={outcome.description}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOutcome(outcome);
                                  setEditOutcomeDialog(true);
                                }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this outcome?')) {
                                    handleDeleteOutcome(outcome.id);
                                  }
                                }}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </ListItemButton>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          No outcomes found for this product.
                        </Typography>
                      );
                    })()}
                  </Paper>
                )}

                {/* Licenses Sub-section */}
                {selectedProductSubSection === 'licenses' && selectedProduct && (
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Licenses for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddLicenseDialog(true)}>
                          Add License
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<FileDownload />}
                          onClick={handleExportLicenses}
                        >
                          Export
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<FileUpload />}
                          onClick={handleImportLicenses}
                        >
                          Import
                        </Button>
                      </Box>
                    </Box>

                    {(() => {
                      const currentProduct = products.find((p: any) => p.id === selectedProduct);
                      const licenses = currentProduct?.licenses || [];

                      return licenses.length > 0 ? (
                        <List>
                          {[...licenses]
                            .sort((a: any, b: any) => a.level - b.level)
                            .map((license: any) => (
                              <ListItemButton
                                key={license.id}
                                sx={{
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  mb: 1,
                                  '&:hover': {
                                    backgroundColor: '#f5f5f5'
                                  }
                                }}
                                onDoubleClick={() => {
                                  setEditingLicense(license);
                                  setEditLicenseDialog(true);
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1" fontWeight="medium">
                                        {license.name}
                                      </Typography>
                                      <Chip
                                        label={`Level ${license.level}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                      {license.isActive ? (
                                        <Chip label="Active" size="small" color="success" variant="outlined" />
                                      ) : (
                                        <Chip label="Inactive" size="small" color="error" variant="outlined" />
                                      )}
                                    </Box>
                                  }
                                  secondary={license.description}
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton size="small" onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLicense(license);
                                    setEditLicenseDialog(true);
                                  }}>
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" color="error" onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this license? This may affect tasks that reference it.')) {
                                      handleDeleteLicense(license.id);
                                    }
                                  }}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              </ListItemButton>
                            ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          No licenses found for this product. Click "Add License" to create one.
                        </Typography>
                      );
                    })()}
                  </Paper>
                )}

                {/* Releases Sub-section */}
                {selectedProductSubSection === 'releases' && selectedProduct && (
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Releases for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddReleaseDialog(true)}>
                          Add Release
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<FileDownload />}
                          onClick={handleExportReleases}
                        >
                          Export
                        </Button>
                      </Box>
                    </Box>

                    {(() => {
                      const currentProduct = products.find((p: any) => p.id === selectedProduct);
                      const releases = currentProduct?.releases || [];

                      return releases.length > 0 ? (
                        <List>
                          {[...releases]
                            .sort((a: any, b: any) => a.level - b.level)
                            .map((release: any) => (
                              <ListItemButton
                                key={release.id}
                                sx={{
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  mb: 1,
                                  '&:hover': {
                                    backgroundColor: '#f5f5f5'
                                  }
                                }}
                                onDoubleClick={() => {
                                  setEditingRelease(release);
                                  setEditReleaseDialog(true);
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1" fontWeight="medium">
                                        {release.name}
                                      </Typography>
                                      <Chip
                                        label={`v${release.level}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                      {release.isActive ? (
                                        <Chip label="Active" size="small" color="success" variant="outlined" />
                                      ) : (
                                        <Chip label="Inactive" size="small" color="error" variant="outlined" />
                                      )}
                                    </Box>
                                  }
                                  secondary={release.description}
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton size="small" onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingRelease(release);
                                    setEditReleaseDialog(true);
                                  }}>
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" color="error" onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this release? This may affect tasks that reference it.')) {
                                      handleDeleteRelease(release.id);
                                    }
                                  }}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              </ListItemButton>
                            ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          No releases found for this product. Click "Add Release" to create one.
                        </Typography>
                      );
                    })()}
                  </Paper>
                )}

                {/* Custom Attributes Sub-section */}
                {selectedProductSubSection === 'customAttributes' && selectedProduct && (
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Other Product Attributes for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddCustomAttributeDialog(true)}>
                          Add Attribute
                        </Button>
                        <Button variant="outlined" startIcon={<Edit />} onClick={() => {
                          const currentProduct = products.find((p: any) => p.id === selectedProduct);
                          if (currentProduct) {
                            handleEditProduct(currentProduct);
                          }
                        }}>
                          Edit All
                        </Button>
                        <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExportCustomAttributes}>
                          Export
                        </Button>
                        <Button variant="outlined" startIcon={<FileUpload />} onClick={handleImportCustomAttributes}>
                          Import
                        </Button>
                      </Box>
                    </Box>

                    {(() => {
                      const currentProduct = products.find((p: any) => p.id === selectedProduct);
                      const customAttrs = currentProduct?.customAttrs || {};
                      const attrEntries = Object.entries(customAttrs);

                      return attrEntries.length > 0 ? (
                        <List>
                          {attrEntries.map(([key, value]: [string, any]) => (
                            <ListItemButton
                              key={key}
                              sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                  backgroundColor: '#f5f5f5'
                                }
                              }}
                              onDoubleClick={() => {
                                setEditingCustomAttribute({
                                  key,
                                  value,
                                  type: Array.isArray(value) ? 'array' :
                                    typeof value === 'object' && value !== null ? 'object' :
                                      typeof value === 'number' ? 'number' :
                                        typeof value === 'boolean' ? 'boolean' : 'string'
                                });
                                setEditCustomAttributeDialog(true);
                              }}
                            >
                              <ListItemText
                                primary={key}
                                secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCustomAttribute({
                                    key,
                                    value,
                                    type: Array.isArray(value) ? 'array' :
                                      typeof value === 'object' && value !== null ? 'object' :
                                        typeof value === 'number' ? 'number' :
                                          typeof value === 'boolean' ? 'boolean' : 'string'
                                  });
                                  setEditCustomAttributeDialog(true);
                                }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete the attribute "${key}"?`)) {
                                    handleDeleteCustomAttribute(key);
                                  }
                                }}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </ListItemButton>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          No additional product attributes found for this product.
                        </Typography>
                      );
                    })()}
                  </Paper>
                )}

                {/* Tasks Sub-section */}
                {selectedProductSubSection === 'tasks' && selectedProduct && (
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Tasks for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Drag to reorder • Double-click for details
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setAddTaskDialog(true)}
                        >
                          Add Task
                        </Button>
                        <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExportTasks}>
                          Export
                        </Button>
                        <Button variant="outlined" startIcon={<FileUpload />} onClick={handleImportTasks}>
                          Import
                        </Button>
                      </Box>
                    </Box>

                    {/* Tasks Loading */}
                    {tasksLoading && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <LinearProgress sx={{ width: '100%' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                          Loading tasks...
                        </Typography>
                      </Box>
                    )}

                    {/* Tasks Error */}
                    {tasksError && (
                      <Typography variant="body2" color="error" sx={{ textAlign: 'center', py: 4 }}>
                        Error loading tasks: {tasksError.message}
                      </Typography>
                    )}

                    {/* Tasks List */}
                    {!tasksLoading && !tasksError && tasks.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={tasks.filter((task: any) => !task.deletedAt).map((task: any) => task.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Box>
                            {tasks.filter((task: any) => !task.deletedAt).map((task: any, index: number) => (
                              <SortableTaskItem
                                key={task.id}
                                task={task}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                onDoubleClick={handleTaskDoubleClick}
                              />
                            ))}
                          </Box>
                        </SortableContext>
                      </DndContext>
                    ) : !tasksLoading && !tasksError ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No tasks found for this product. Click "Add Task" to create one.
                      </Typography>
                    ) : null}
                  </Paper>
                )}

                {/* No product selected message */}
                {!selectedProduct && !productsLoading && (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      Select a product to view {
                        selectedProductSubSection === 'tasks' ? 'tasks' :
                          selectedProductSubSection === 'main' ? 'overview' :
                            selectedProductSubSection === 'licenses' ? 'licenses' :
                              selectedProductSubSection === 'outcomes' ? 'outcomes' :
                                selectedProductSubSection === 'customAttributes' ? 'custom attributes' : 'details'
                      }
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Solutions Section */}
            {selectedSection === 'solutions' && (
              <Box>
                <Typography variant="h4" gutterBottom>
                  Solution Management
                </Typography>

                {solutionsLoading && <LinearProgress />}
                {solutionsError && (
                  <Typography color="error">Error: {solutionsError.message}</Typography>
                )}

                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Solutions</Typography>
                  {solutions.length > 0 ? (
                    <List>
                      {solutions.map((solution: any) => (
                        <ListItemButton key={solution.id}>
                          <ListItemText
                            primary={solution.name}
                            secondary={solution.description}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No solutions found
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            {/* Customers Section */}
            {selectedSection === 'customers' && (
              <Box>
                <Typography variant="h4" gutterBottom>
                  Customer Management
                </Typography>

                {customersLoading && <LinearProgress />}
                {customersError && (
                  <Typography color="error">Error: {customersError.message}</Typography>
                )}

                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Customers</Typography>
                  {customers.length > 0 ? (
                    <List>
                      {customers.map((customer: any) => (
                        <ListItemButton key={customer.id}>
                          <ListItemText
                            primary={customer.name}
                            secondary={customer.description}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No customers found
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            {/* Add Product Dialog */}
            <ProductDialog
              open={addProductDialog}
              onClose={() => setAddProductDialog(false)}
              onSave={handleAddProductSave}
              product={null}
              title="Add New Product"
              availableReleases={[]}
            />

            {/* Add Task Dialog */}
            <TaskDialog
              open={addTaskDialog}
              onClose={() => setAddTaskDialog(false)}
              onSave={handleAddTaskSave}
              task={null}
              title="Task Details"
              productId={selectedProduct}
              existingTasks={tasks.filter((t: any) => !t.deletedAt)}
              outcomes={outcomes.filter((o: any) => o.product?.id === selectedProduct)}
              availableLicenses={selectedProduct ? products.find((p: any) => p.id === selectedProduct)?.licenses || [] : []}
              availableReleases={selectedProduct ? products.find((p: any) => p.id === selectedProduct)?.releases || [] : []}
            />

            {/* Edit Product Dialog */}
            <ProductDialog
              open={editProductDialog}
              onClose={() => setEditProductDialog(false)}
              onSave={handleUpdateProduct}
              product={editingProduct}
              title="Edit Product"
              availableReleases={editingProduct?.releases || []}
            />

            {/* Edit Task Dialog */}
            <TaskDialog
              open={editTaskDialog}
              onClose={() => setEditTaskDialog(false)}
              onSave={handleEditTaskSave}
              task={editingTask}
              title="Task Details"
              productId={selectedProduct}
              existingTasks={tasks.filter((t: any) => !t.deletedAt)}
              outcomes={outcomes.filter((o: any) => o.product?.id === selectedProduct)}
              availableLicenses={selectedProduct ? products.find((p: any) => p.id === selectedProduct)?.licenses || [] : []}
              availableReleases={selectedProduct ? products.find((p: any) => p.id === selectedProduct)?.releases || [] : []}
            />

            {/* Task Detail Dialog */}
            <TaskDetailDialog
              open={taskDetailDialog}
              task={selectedTaskForDetail}
              productId={selectedProduct}
              availableLicenses={selectedProduct ? products.find((p: any) => p.id === selectedProduct)?.licenses || [] : []}
              availableReleases={selectedProduct ? products.find((p: any) => p.id === selectedProduct)?.releases || [] : []}
              onClose={() => {
                setTaskDetailDialog(false);
                setSelectedTaskForDetail(null);
              }}
              onSave={handleTaskDetailSave}
            />

            {/* Add License Dialog */}
            <LicenseDialog
              open={addLicenseDialog}
              onClose={() => setAddLicenseDialog(false)}
              onSave={handleAddLicenseSave}
              license={null}
            />

            {/* Edit License Dialog */}
            <LicenseDialog
              open={editLicenseDialog}
              onClose={() => {
                setEditLicenseDialog(false);
                setEditingLicense(null);
              }}
              onSave={handleEditLicenseSave}
              license={editingLicense}
            />

            {/* Add Release Dialog */}
            <ReleaseDialog
              open={addReleaseDialog}
              onClose={() => setAddReleaseDialog(false)}
              onSave={handleAddReleaseSave}
              release={null}
              title="Add New Release"
            />

            {/* Edit Release Dialog */}
            <ReleaseDialog
              open={editReleaseDialog}
              onClose={() => {
                setEditReleaseDialog(false);
                setEditingRelease(null);
              }}
              onSave={handleEditReleaseSave}
              release={editingRelease}
              title="Edit Release"
            />

            {/* Add Outcome Dialog */}
            <OutcomeDialog
              open={addOutcomeDialog}
              onClose={() => setAddOutcomeDialog(false)}
              onSave={handleAddOutcomeSave}
              outcome={null}
            />

            {/* Edit Outcome Dialog */}
            <OutcomeDialog
              open={editOutcomeDialog}
              onClose={() => {
                setEditOutcomeDialog(false);
                setEditingOutcome(null);
              }}
              onSave={handleEditOutcomeSave}
              outcome={editingOutcome}
            />

            {/* Add Other Product Attributes Dialog */}
            <CustomAttributeDialog
              open={addCustomAttributeDialog}
              onClose={() => setAddCustomAttributeDialog(false)}
              onSave={handleAddCustomAttributeSave}
              attribute={null}
              existingKeys={Object.keys(products.find((p: any) => p.id === selectedProduct)?.customAttrs || {})}
            />

            {/* Edit Custom Attribute Dialog */}
            <CustomAttributeDialog
              open={editCustomAttributeDialog}
              onClose={() => {
                setEditCustomAttributeDialog(false);
                setEditingCustomAttribute(null);
              }}
              onSave={handleEditCustomAttributeSave}
              attribute={editingCustomAttribute}
              existingKeys={Object.keys(products.find((p: any) => p.id === selectedProduct)?.customAttrs || {})}
            />
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;