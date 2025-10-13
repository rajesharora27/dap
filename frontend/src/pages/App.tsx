import * as React from 'react';
import { useState } from 'react';
import ExcelJS from 'exceljs';
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
  Collapse,
  Menu
} from '@mui/material';
import { TaskDialog } from '../components/dialogs/TaskDialog';
import { ProductDialog } from '../components/dialogs/ProductDialog';
import { LicenseDialog } from '../components/dialogs/LicenseDialog';
import { ReleaseDialog } from '../components/dialogs/ReleaseDialog';
import { OutcomeDialog } from '../components/dialogs/OutcomeDialog';
import { CustomAttributeDialog } from '../components/dialogs/CustomAttributeDialog';
import { LicenseHandlers, ReleaseHandlers, OutcomeHandlers, ProductHandlers } from '../utils/sharedHandlers';
import { resolveImportTarget, type ResolveImportAbortReason } from '../utils/excelImportTarget';
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
import { gql, useQuery, useApolloClient, ApolloError } from '@apollo/client';
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
          telemetryAttributes {
            id
            name
            description
            dataType
            isRequired
            successCriteria
            order
            isActive
            isSuccessful
            currentValue {
              id
              value
              source
              createdAt
            }
          }
          isCompleteBasedOnTelemetry
          telemetryCompletionPercentage
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

// Telemetry mutations
const CREATE_TELEMETRY_ATTRIBUTE = gql`
  mutation CreateTelemetryAttribute($input: TelemetryAttributeInput!) {
    createTelemetryAttribute(input: $input) {
      id
      taskId
      name
      description
      dataType
      isRequired
      successCriteria
      order
      isActive
    }
  }
`;

const UPDATE_TELEMETRY_ATTRIBUTE = gql`
  mutation UpdateTelemetryAttribute($id: ID!, $input: TelemetryAttributeUpdateInput!) {
    updateTelemetryAttribute(id: $id, input: $input) {
      id
      taskId
      name
      description
      dataType
      isRequired
      successCriteria
      order
      isActive
    }
  }
`;

const DELETE_TELEMETRY_ATTRIBUTE = gql`
  mutation DeleteTelemetryAttribute($id: ID!) {
    deleteTelemetryAttribute(id: $id)
  }
`;

// Sortable Task Item Component
function SortableTaskItem({ task, onEdit, onDelete, onDoubleClick, onWeightChange }: any) {
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  
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
          {/* Primary content - structured grid layout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            {/* Sequence number - fixed width */}
            <Box sx={{ minWidth: '56px', flexShrink: 0 }}>
              {task.sequenceNumber && (
                <Chip
                  size="small"
                  label={`#${task.sequenceNumber}`}
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>
            
            {/* Task name - flexible width */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" component="div" sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {task.name}
              </Typography>
            </Box>
            
            {/* Weight - fixed width, editable */}
            <Box sx={{ minWidth: '105px', flexShrink: 0 }}>
              <input
                key={`weight-${task.id}-${task.weight}`}
                type="number"
                defaultValue={task.weight || 0}
                onBlur={(e) => {
                  e.stopPropagation();
                  const newWeight = parseFloat(e.target.value) || 0;
                  if (newWeight >= 0 && newWeight <= 100) {
                    // Only update if weight changed
                    if (Math.abs(newWeight - task.weight) > 0.001) {
                      if (onWeightChange) {
                        onWeightChange(task.id, task.name, newWeight);
                      }
                    }
                  } else {
                    // Reset to original value if invalid
                    e.target.value = task.weight.toString();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur(); // Trigger save on Enter
                  }
                  if (e.key === 'Escape') {
                    e.currentTarget.value = task.weight.toString(); // Reset on Escape
                    e.currentTarget.blur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => {
                  e.stopPropagation();
                  e.target.select();
                }}
                step="0.01"
                min="0"
                max="100"
                className="weight-input-spinner"
                style={{
                  width: '85px',
                  padding: '4px 8px',
                  border: '1px solid #1976d2',
                  borderRadius: '16px',
                  textAlign: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 'bold',
                  color: '#1976d2',
                  backgroundColor: 'transparent',
                  cursor: 'text'
                }}
                title="Click to edit weight (0-100), press Enter to save"
              />
            </Box>
            
            {/* How-to links container - fixed width */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px', flexShrink: 0, justifyContent: 'flex-end' }}>
              {/* How-to documentation links */}
              <Box sx={{ minWidth: '50px' }}>
                {task.howToDoc && task.howToDoc.length > 0 && (
                  <Chip
                    size="small"
                    label={`Doc${task.howToDoc.length > 1 ? ` (${task.howToDoc.length})` : ''}`}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem', 
                      height: '24px',
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
                    title={task.howToDoc.length === 1 ? "How-to Documentation" : `${task.howToDoc.length} Documentation Links - Click to choose`}
                  />
                )}
              </Box>
              
              {/* How-to video links */}
              <Box sx={{ minWidth: '50px' }}>
                {task.howToVideo && task.howToVideo.length > 0 && (
                  <Chip
                    size="small"
                    label={`Video${task.howToVideo.length > 1 ? ` (${task.howToVideo.length})` : ''}`}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem', 
                      height: '24px',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'primary.light' }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task.howToVideo.length === 1) {
                        window.open(task.howToVideo[0], '_blank');
                      } else {
                        setVideoMenuAnchor({ el: e.currentTarget as HTMLElement, links: task.howToVideo });
                      }
                    }}
                    title={task.howToVideo.length === 1 ? "How-to Video" : `${task.howToVideo.length} Video Links - Click to choose`}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </ListItemButton>

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
  const [selectedProductSubSection, setSelectedProductSubSection] = useState<'main' | 'tasks' | 'licenses' | 'releases' | 'outcomes' | 'customAttributes'>('main');
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
  const [importProgressDialog, setImportProgressDialog] = useState(false);
  const [importProgressMessage, setImportProgressMessage] = useState('Processing...');
  
  // Menu anchors for howto links
  const [docMenuAnchor, setDocMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);
  const [videoMenuAnchor, setVideoMenuAnchor] = useState<{ el: HTMLElement; links: string[] } | null>(null);

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
  const tasks = [...(tasksData?.tasks?.edges?.map((edge: any) => {
    const node = edge.node;
    // Parse successCriteria from JSON string to object for each telemetry attribute
    // Create new objects to avoid mutating Apollo cache
    if (node.telemetryAttributes && Array.isArray(node.telemetryAttributes)) {
      const parsedAttributes = node.telemetryAttributes.map((attr: any) => {
        if (attr.successCriteria && typeof attr.successCriteria === 'string' && attr.successCriteria.trim()) {
          try {
            return { ...attr, successCriteria: JSON.parse(attr.successCriteria) };
          } catch (e) {
            console.error(`Failed to parse successCriteria for attribute "${attr.name}":`, e);
            return attr; // Return original if parsing fails
          }
        }
        return attr;
      });
      return { ...node, telemetryAttributes: parsedAttributes };
    }
    return node;
  }) || [])]
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
  // Consolidated License Save Handler (handles both add and edit)
  const handleLicenseSave = async (licenseData: License, licenseId?: string) => {
    const isEdit = !!licenseId || !!editingLicense?.id;
    const idToUse = licenseId || editingLicense?.id;

    if (isEdit && !idToUse) {
      alert('No license selected for editing');
      return;
    }

    const dataWithProduct: License = {
      ...licenseData,
      productId: selectedProduct || (isEdit ? editingLicense?.productId : undefined)!
    };

    if (!dataWithProduct.productId) {
      alert('Product ID is required');
      return;
    }

    const result = isEdit
      ? await licenseHandlers.updateLicense(idToUse, dataWithProduct, { refetchProducts, showAlert: true })
      : await licenseHandlers.createLicense(dataWithProduct, { refetchProducts, showAlert: true });

    if (result.success) {
      if (isEdit) {
        setEditLicenseDialog(false);
        setEditingLicense(null);
      } else {
        setAddLicenseDialog(false);
      }
    }
  };

  // Wrapper for backward compatibility
  const handleAddLicenseSave = async (licenseData: License) => {
    await handleLicenseSave(licenseData);
  };

  const handleEditLicenseSave = async (licenseData: License) => {
    await handleLicenseSave(licenseData, editingLicense?.id);
  };

  const handleDeleteLicense = async (licenseId: string) => {
    const result = await licenseHandlers.deleteLicense(licenseId, {
      refetchProducts,
      showAlert: true
    });
  };

  // Release handlers for standalone release management
  // Consolidated Release Save Handler (handles both add and edit)
  const handleReleaseSave = async (releaseData: { name: string; level: number; description?: string }, releaseId?: string) => {
    const isEdit = !!releaseId || !!editingRelease?.id;
    const idToUse = releaseId || editingRelease?.id;

    if (isEdit && !idToUse) {
      alert('No release selected for editing');
      return;
    }

    const dataWithProduct = {
      ...releaseData,
      productId: selectedProduct || (isEdit ? editingRelease?.productId : undefined)!
    };

    if (!dataWithProduct.productId) {
      alert('Product ID is required');
      return;
    }

    const result = isEdit
      ? await releaseHandlers.updateRelease(idToUse, dataWithProduct, { refetchProducts, showAlert: true })
      : await releaseHandlers.createRelease(dataWithProduct, { refetchProducts, showAlert: true });

    if (result.success) {
      if (isEdit) {
        setEditReleaseDialog(false);
        setEditingRelease(null);
      } else {
        setAddReleaseDialog(false);
      }
    }
  };

  // Wrapper for backward compatibility
  const handleAddReleaseSave = async (releaseData: { name: string; level: number; description?: string }) => {
    await handleReleaseSave(releaseData);
  };

  const handleEditReleaseSave = async (releaseData: { name: string; level: number; description?: string }) => {
    await handleReleaseSave(releaseData, editingRelease?.id);
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
  // Consolidated Outcome Save Handler (handles both add and edit)
  const handleOutcomeSave = async (outcomeData: Outcome, outcomeId?: string) => {
    const isEdit = !!outcomeId || !!editingOutcome?.id;
    const idToUse = outcomeId || editingOutcome?.id;

    if (isEdit && !idToUse) {
      alert('No outcome selected for editing');
      return;
    }

    const dataWithProduct: Outcome = {
      ...outcomeData,
      productId: selectedProduct || (isEdit ? editingOutcome?.productId : undefined)!
    };

    if (!dataWithProduct.productId) {
      alert('Product ID is required');
      return;
    }

    const result = isEdit
      ? await outcomeHandlers.updateOutcome(idToUse, dataWithProduct, { refetchProducts, showAlert: true })
      : await outcomeHandlers.createOutcome(dataWithProduct, { refetchProducts, showAlert: true });

    if (result.success) {
      if (isEdit) {
        setEditOutcomeDialog(false);
        setEditingOutcome(null);
      } else {
        setAddOutcomeDialog(false);
      }
    }
  };

  // Wrapper for backward compatibility
  const handleAddOutcomeSave = async (outcomeData: Outcome) => {
    await handleOutcomeSave(outcomeData);
  };

  const handleEditOutcomeSave = async (outcomeData: Outcome) => {
    await handleOutcomeSave(outcomeData, editingOutcome?.id);
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

  // Consolidated Task Save Handler (handles both add and edit)
  const handleTaskSave = async (taskData: any, taskId?: string) => {
    // Determine if this is an edit or add operation
    const isEdit = !!taskId;
    const taskIdToUse = taskId || editingTask?.id;

    if (isEdit && !taskIdToUse) return;
    if (!isEdit && !selectedProduct) return;

    try {
      // Create input with task fields
      const input: any = {
        name: taskData.name,
        estMinutes: taskData.estMinutes,
        weight: taskData.weight,
        priority: taskData.priority
      };

      // Add productId for new tasks only
      if (!isEdit) {
        input.productId = selectedProduct;
      }

      // Only add optional fields if they have values
      if (taskData.description?.trim()) {
        input.description = taskData.description.trim();
      }
      if (taskData.notes?.trim()) {
        input.notes = taskData.notes.trim();
      }
      if (taskData.howToDoc && Array.isArray(taskData.howToDoc) && taskData.howToDoc.length > 0) {
        input.howToDoc = taskData.howToDoc;
      }
      if (taskData.howToVideo && Array.isArray(taskData.howToVideo) && taskData.howToVideo.length > 0) {
        input.howToVideo = taskData.howToVideo;
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

      let finalTaskId: string;

      // Create or Update task
      if (isEdit) {
        // Update existing task
        await client.mutate({
          mutation: UPDATE_TASK,
          variables: {
            id: taskIdToUse,
            input
          },
          refetchQueries: ['TasksForProduct'],
          awaitRefetchQueries: true
        });
        finalTaskId = taskIdToUse;
      } else {
        // Create new task
        const taskResult = await client.mutate({
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
        finalTaskId = taskResult.data.createTask.id;
      }

      // Handle telemetry attributes
      if (taskData.telemetryAttributes) {
        if (isEdit) {
          // For edit: compare old and new attributes
          const existingAttributes = editingTask?.telemetryAttributes || [];
          const newAttributes = taskData.telemetryAttributes;

          // Find attributes to delete
          const attributesToDelete: string[] = [];
          existingAttributes.forEach((existing: any) => {
            const stillExists = newAttributes.find((attr: any) => attr.id === existing.id);
            if (!stillExists) {
              attributesToDelete.push(existing.id);
            }
          });

          // Delete removed attributes
          for (const attrId of attributesToDelete) {
            await client.mutate({
              mutation: DELETE_TELEMETRY_ATTRIBUTE,
              variables: { id: attrId }
            });
          }

          // Process new and updated attributes
          for (const attr of newAttributes) {
            if (attr.id) {
              // Existing attribute - check if it needs updating
              const existing = existingAttributes.find((e: any) => e.id === attr.id);
              if (existing && (
                existing.name !== attr.name ||
                existing.description !== attr.description ||
                existing.dataType !== attr.dataType ||
                existing.isRequired !== attr.isRequired ||
                JSON.stringify(existing.successCriteria) !== JSON.stringify(attr.successCriteria) ||
                existing.order !== attr.order ||
                existing.isActive !== attr.isActive
              )) {
                const updateInput: any = {
                  name: attr.name.trim(),
                  description: attr.description || '',
                  dataType: attr.dataType,
                  isRequired: attr.isRequired || false,
                  successCriteria: attr.successCriteria ? JSON.stringify(attr.successCriteria) : '',
                  order: attr.order || 0,
                  isActive: attr.isActive !== false
                };
                await client.mutate({
                  mutation: UPDATE_TELEMETRY_ATTRIBUTE,
                  variables: { id: attr.id, input: updateInput }
                });
              }
            } else {
              // New attribute
              if (attr.name && attr.name.trim()) {
                await client.mutate({
                  mutation: CREATE_TELEMETRY_ATTRIBUTE,
                  variables: {
                    input: {
                      taskId: finalTaskId,
                      name: attr.name.trim(),
                      description: attr.description || '',
                      dataType: attr.dataType,
                      isRequired: attr.isRequired || false,
                      successCriteria: attr.successCriteria ? JSON.stringify(attr.successCriteria) : '',
                      order: attr.order || 0,
                      isActive: attr.isActive !== false
                    }
                  }
                });
              }
            }
          }
        } else {
          // For add: create all new attributes
          for (const attr of taskData.telemetryAttributes) {
            if (attr.name && attr.name.trim()) {
              await client.mutate({
                mutation: CREATE_TELEMETRY_ATTRIBUTE,
                variables: {
                  input: {
                    taskId: finalTaskId,
                    name: attr.name.trim(),
                    description: attr.description || '',
                    dataType: attr.dataType,
                    isRequired: attr.isRequired || false,
                    successCriteria: attr.successCriteria ? JSON.stringify(attr.successCriteria) : '',
                    order: attr.order || 0,
                    isActive: attr.isActive !== false
                  }
                }
              });
            }
          }
        }
      }

      // Close dialogs and refresh
      if (isEdit) {
        setEditTaskDialog(false);
        setEditingTask(null);
      } else {
        setAddTaskDialog(false);
      }
      await refetchTasks();
      
      console.log(`Task ${isEdit ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error(`Error ${isEdit ? 'updating' : 'adding'} task:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'add'} task: ` + (error?.message || 'Unknown error'));
    }
  };

  // Wrapper for backward compatibility - Edit Task
  const handleEditTaskSave = async (taskData: any) => {
    await handleTaskSave(taskData, editingTask?.id);
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
    // Use the same edit dialog that has telemetry support
    setEditingTask(task);
    setEditTaskDialog(true);
  };

  const handleTaskWeightChange = async (taskId: string, taskName: string, newWeight: number) => {
    try {
      await client.mutate({
        mutation: UPDATE_TASK,
        variables: {
          id: taskId,
          input: {
            name: taskName,
            weight: newWeight
          }
        },
        refetchQueries: ['TasksForProduct'],
        awaitRefetchQueries: true
      });
      console.log(`✅ Weight updated for task ${taskName}: → ${newWeight}`);
      await refetchTasks();
    } catch (error: any) {
      console.error('❌ Failed to update weight:', error);
      alert('Failed to update task weight: ' + (error?.message || 'Unknown error'));
    }
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
              productId: productId!
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
          productId: productId!
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

  // Wrapper for backward compatibility - Add Task
  const handleAddTaskSave = async (taskData: any) => {
    console.log('🚨🚨🚨 App.tsx handleAddTaskSave called!');
    console.log('🚨🚨🚨 TaskData received:', JSON.stringify(taskData, null, 2));
    await handleTaskSave(taskData); // No taskId means add operation
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
        escapeCsv(Array.isArray(task.howToDoc) ? task.howToDoc.join(', ') : (task.howToDoc || '')),
        escapeCsv(Array.isArray(task.howToVideo) ? task.howToVideo.join(', ') : (task.howToVideo || ''))
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

  // Custom Attributes handlers
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

  // Custom Attributes export/import handlers (JSON format)
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

  // Export all product data (comprehensive export)
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

      // Get all licenses and releases (filtered by product)
      const allLicenses = await client.query({
        query: gql`
          query AllLicenses {
            licenses {
              id
              name
              description
              level
              isActive
              product {
                id
              }
            }
          }
        `,
        fetchPolicy: 'network-only'
      });

      const allReleases = await client.query({
        query: gql`
          query AllReleases {
            releases {
              id
              name
              description
              level
              isActive
              product {
                id
              }
            }
          }
        `,
        fetchPolicy: 'network-only'
      });

      // Filter licenses and releases for the selected product
      const productLicenses = allLicenses.data.licenses.filter((license: any) => 
        license.product?.id === selectedProduct
      );

      const productReleases = allReleases.data.releases.filter((release: any) => 
        release.product?.id === selectedProduct
      );

      const tasksResult = await client.query({
        query: TASKS_FOR_PRODUCT,
        variables: { productId: selectedProduct },
        fetchPolicy: 'network-only'
      });
      const productTasks = (tasksResult.data?.tasks?.edges || []).map((edge: any) => edge.node);

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DAP Application';
      workbook.created = new Date();

      // Add Instructions sheet as the first sheet
      const instructionsSheet = workbook.addWorksheet('📋 Instructions');
      instructionsSheet.columns = [
        { header: '', key: 'content', width: 100 }
      ];

      // Add instructions content with styling
      const instructions = [
        { content: 'PRODUCT DATA IMPORT/EXPORT INSTRUCTIONS', style: 'title' },
        { content: '', style: 'empty' },
        { content: 'OVERVIEW', style: 'header' },
        { content: `This Excel file contains all data for product: ${product.name}`, style: 'text' },
        { content: 'Use this file to export, edit, and re-import product data.', style: 'text' },
        { content: '', style: 'empty' },
        { content: 'FILE STRUCTURE', style: 'header' },
  { content: '• Sheet 1: Instructions (this sheet)', style: 'text' },
  { content: '• Sheet 2: Simple Attributes - Core product fields like name and description', style: 'text' },
  { content: '• Sheet 3: Outcomes - Product outcomes with name and description', style: 'text' },
  { content: '• Sheet 4: Licenses - License tiers with level and active status', style: 'text' },
  { content: '• Sheet 5: Releases - Product releases with version and active status', style: 'text' },
  { content: '• Sheet 6: Tasks - Task list with sequencing, effort, relationships, and guidance links', style: 'text' },
  { content: '• Sheet 7: Custom Attributes - Key-value pairs for custom product attributes', style: 'text' },
        { content: '', style: 'empty' },
        { content: 'HOW TO IMPORT (UPDATE EXISTING DATA)', style: 'header' },
        { content: '1. Edit data in any sheet (modify descriptions, levels, status, etc.)', style: 'text' },
        { content: '2. Keep the Name/Key unchanged for items you want to UPDATE', style: 'text' },
        { content: '3. Save this Excel file', style: 'text' },
        { content: '4. In the application, select the target product', style: 'text' },
        { content: '5. Click Import button and select this file', style: 'text' },
        { content: '6. System will UPDATE existing records (no duplicates created)', style: 'text' },
        { content: '', style: 'empty' },
        { content: 'HOW TO IMPORT (ADD NEW DATA)', style: 'header' },
        { content: '1. Add new rows at the bottom of any sheet', style: 'text' },
        { content: '2. Fill in Name (required) and other columns', style: 'text' },
        { content: '3. Save this Excel file', style: 'text' },
        { content: '4. In the application, select the target product', style: 'text' },
        { content: '5. Click Import button and select this file', style: 'text' },
        { content: '6. System will CREATE new records', style: 'text' },
        { content: '', style: 'empty' },
        { content: 'UPSERT LOGIC (SMART IMPORT)', style: 'header' },
        { content: 'The import process uses intelligent matching:', style: 'text' },
        { content: '• Outcomes: Matched by Name (case-insensitive)', style: 'text' },
        { content: '• Licenses: Matched by Name (case-insensitive)', style: 'text' },
        { content: '• Releases: Matched by Name (case-insensitive)', style: 'text' },
  { content: '• Tasks: Matched by Name (case-insensitive)', style: 'text' },
  { content: '• Custom Attributes: Matched by Key (case-insensitive)', style: 'text' },
        { content: '', style: 'empty' },
        { content: 'If a Name/Key exists → Record is UPDATED', style: 'text' },
        { content: 'If a Name/Key is new → Record is CREATED', style: 'text' },
        { content: 'Whitespace is automatically trimmed during matching', style: 'text' },
        { content: '', style: 'empty' },
  { content: 'PRIMARY KEY GUIDANCE', style: 'header' },
  { content: '• The Name column is the primary key on every sheet (Outcomes, Licenses, Releases, Tasks).', style: 'text' },
  { content: '• Do NOT change the Name unless you want to create a brand-new record.', style: 'text' },
  { content: '• To update existing data, edit other columns while keeping the Name exactly the same.', style: 'text' },
  { content: '', style: 'empty' },
        { content: 'REQUIRED FIELDS', style: 'header' },
  { content: '• Simple Attributes: Name (required), Description (optional)', style: 'text' },
        { content: '• Outcomes: Name (required), Description (optional)', style: 'text' },
        { content: '• Licenses: Name (required), Level (required), Description (optional), Active (Yes/No)', style: 'text' },
        { content: '• Releases: Name (required), Level (required), Description (optional), Active (Yes/No)', style: 'text' },
  { content: '• Custom Attributes: Key (required), Value (optional - supports JSON, numbers, booleans)', style: 'text' },
  { content: '• Tasks: Name (required), Sequence (optional), Estimated Minutes (optional), Priority (optional)', style: 'text' },
        { content: '', style: 'empty' },
        { content: 'TIPS', style: 'header' },
        { content: '✓ Always keep a backup before importing', style: 'text' },
        { content: '✓ Test with small changes first', style: 'text' },
        { content: '✓ Check the import summary after completion (Created/Updated/Errors)', style: 'text' },
        { content: '✓ Active column accepts: Yes, No (case-insensitive)', style: 'text' },
        { content: '✓ Level columns must be numbers', style: 'text' },
  { content: '✓ License Name links tasks to licenses; license level is set automatically', style: 'text' },
  { content: '✓ Do NOT modify column headers', style: 'text' },
        { content: '', style: 'empty' },
  { content: 'SCOPE NOTES', style: 'header' },
  { content: '• Telemetry history and audit logs are not included', style: 'text' },
  { content: '• Relationship lookups (e.g., linking to new outcomes) require the related items to exist', style: 'text' },
        { content: '', style: 'empty' },
        { content: `Export Date: ${new Date().toLocaleString()}`, style: 'text' },
        { content: `Product: ${product.name}`, style: 'text' },
        { content: `File: ${`product-complete-${product.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`}`, style: 'text' },
      ];

      instructions.forEach((item, index) => {
        const row = instructionsSheet.getRow(index + 1);
        row.getCell(1).value = item.content;
        
        if (item.style === 'title') {
          row.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF1976D2' } };
          row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
          row.height = 30;
        } else if (item.style === 'header') {
          row.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1976D2' } };
          row.height = 25;
        } else if (item.style === 'text') {
          row.getCell(1).font = { size: 11 };
          row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
        }
      });

      // Freeze the first row
      instructionsSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

      // Add Simple Attributes sheet
      const simpleAttributesSheet = workbook.addWorksheet('Simple Attributes');
      simpleAttributesSheet.columns = [
        { header: 'Attribute', key: 'attribute', width: 30 },
        { header: 'Value', key: 'value', width: 60 }
      ];
      simpleAttributesSheet.addRows([
        { attribute: 'Name', value: product.name },
        { attribute: 'Description', value: product.description || '' }
      ]);
      simpleAttributesSheet.getRow(1).font = { bold: true };
      simpleAttributesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add Outcomes sheet
      const outcomesSheet = workbook.addWorksheet('Outcomes');
      outcomesSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 60 }
      ];
      outcomesSheet.addRows(product.outcomes.map((outcome: any) => ({
        name: outcome.name,
        description: outcome.description || ''
      })));
      // Style the header row
      outcomesSheet.getRow(1).font = { bold: true };
      outcomesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add Licenses sheet
      const licensesSheet = workbook.addWorksheet('Licenses');
      licensesSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Level', key: 'level', width: 10 },
        { header: 'Active', key: 'isActive', width: 10 }
      ];
      licensesSheet.addRows(productLicenses.map((license: any) => ({
        name: license.name,
        description: license.description || '',
        level: license.level,
        isActive: license.isActive ? 'Yes' : 'No'
      })));
      licensesSheet.getRow(1).font = { bold: true };
      licensesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add Releases sheet
      const releasesSheet = workbook.addWorksheet('Releases');
      releasesSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Level', key: 'level', width: 10 },
        { header: 'Active', key: 'isActive', width: 10 }
      ];
      releasesSheet.addRows(productReleases.map((release: any) => ({
        name: release.name,
        description: release.description || '',
        level: release.level,
        isActive: release.isActive ? 'Yes' : 'No'
      })));
      releasesSheet.getRow(1).font = { bold: true };
      releasesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add Tasks sheet
      const tasksSheet = workbook.addWorksheet('Tasks');
      tasksSheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Sequence Number', key: 'sequenceNumber', width: 18 },
        { header: 'Estimated Minutes', key: 'estMinutes', width: 18 },
        { header: 'Weight', key: 'weight', width: 12 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'License Name', key: 'licenseName', width: 24 },
        { header: 'Outcome Names', key: 'outcomeNames', width: 30 },
        { header: 'Release Names', key: 'releaseNames', width: 30 },
        { header: 'Notes', key: 'notes', width: 40 },
        { header: 'How To Doc', key: 'howToDoc', width: 50 },
        { header: 'How To Video', key: 'howToVideo', width: 50 },
        { header: 'Telemetry Attributes', key: 'telemetryAttributes', width: 60 }
      ];
      tasksSheet.addRows(productTasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        description: task.description || '',
        sequenceNumber: task.sequenceNumber ?? '',
        estMinutes: task.estMinutes ?? '',
        weight: task.weight ?? '',
        priority: task.priority || '',
        licenseName: task.license?.name || '',
        outcomeNames: (task.outcomes || []).map((outcome: any) => outcome.name).filter(Boolean).join(', '),
        releaseNames: (task.releases || []).map((release: any) => release.name).filter(Boolean).join(', '),
        notes: task.notes || '',
        howToDoc: Array.isArray(task.howToDoc) ? task.howToDoc.join('; ') : (task.howToDoc || ''),
        howToVideo: Array.isArray(task.howToVideo) ? task.howToVideo.join('; ') : (task.howToVideo || ''),
        telemetryAttributes: (task.telemetryAttributes || [])
          .filter((attr: any) => attr.isActive)
          .map((attr: any) => {
            const parts = [`${attr.name} (${attr.dataType}${attr.isRequired ? ', required' : ''})`];
            if (attr.successCriteria) {
              parts.push(`Success: ${attr.successCriteria}`);
            }
            return parts.join(' | ');
          })
          .join('; ') || ''
      })));
      tasksSheet.getRow(1).font = { bold: true };
      tasksSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add Custom Attributes sheet
      const customAttrsSheet = workbook.addWorksheet('Custom Attributes');
      customAttrsSheet.columns = [
        { header: 'Key', key: 'key', width: 30 },
        { header: 'Value', key: 'value', width: 60 }
      ];
      if (product.customAttrs && typeof product.customAttrs === 'object') {
        const attrsArray = Object.entries(product.customAttrs).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        customAttrsSheet.addRows(attrsArray);
      }
      customAttrsSheet.getRow(1).font = { bold: true };
      customAttrsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add Telemetry Attributes sheet
      const telemetrySheet = workbook.addWorksheet('Telemetry Attributes');
      telemetrySheet.columns = [
        { header: 'Task Name', key: 'taskName', width: 30 },
        { header: 'Attribute Name', key: 'attributeName', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Data Type', key: 'dataType', width: 15 },
        { header: 'Is Required', key: 'isRequired', width: 12 },
        { header: 'Success Criteria', key: 'successCriteria', width: 40 },
        { header: 'Order', key: 'order', width: 10 },
        { header: 'Is Active', key: 'isActive', width: 12 }
      ];
      const telemetryRows: any[] = [];
      productTasks.forEach((task: any) => {
        if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
          task.telemetryAttributes.forEach((attr: any) => {
            // Export successCriteria as JSON string for reliable import
            let successCriteriaStr = '';
            if (attr.successCriteria) {
              console.log(`[Export] Attribute "${attr.name}" successCriteria type:`, typeof attr.successCriteria);
              console.log(`[Export] Attribute "${attr.name}" successCriteria RAW:`, JSON.stringify(attr.successCriteria, null, 2));
              console.log(`[Export] Attribute "${attr.name}" successCriteria keys:`, Object.keys(attr.successCriteria || {}));
              // If it's already a string (from DB), use it
              if (typeof attr.successCriteria === 'string') {
                successCriteriaStr = attr.successCriteria;
                console.log(`[Export] String length:`, successCriteriaStr.length);
              } else {
                // If it's an object, stringify it
                successCriteriaStr = JSON.stringify(attr.successCriteria);
                console.log(`[Export] Stringified length:`, successCriteriaStr.length);
              }
              console.log(`[Export] Attribute "${attr.name}" FINAL exported string:`, successCriteriaStr);
            } else {
              console.log(`[Export] Attribute "${attr.name}" has NO successCriteria (null/undefined/empty)`);
            }
            
            telemetryRows.push({
              taskName: task.name,
              attributeName: attr.name,
              description: attr.description || '',
              dataType: attr.dataType,
              isRequired: attr.isRequired ? 'Yes' : 'No',
              successCriteria: successCriteriaStr,
              order: attr.order ?? '',
              isActive: attr.isActive ? 'Yes' : 'No'
            });
          });
        }
      });
      telemetrySheet.addRows(telemetryRows);
      telemetrySheet.getRow(1).font = { bold: true };
      telemetrySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Generate Excel file and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      const filename = `product-complete-${product.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
      
      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = filename;
      linkElement.click();
      
      URL.revokeObjectURL(url);

      console.log('Complete product data exported to Excel');
  alert('Product data exported to Excel successfully!\nIncludes: Simple Attributes, Outcomes, Licenses, Releases, Tasks, Custom Attributes, and Telemetry Attributes');
    } catch (error) {
      console.error('Error exporting complete product data:', error);
      alert(`Failed to export complete product data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Import all product data (comprehensive import) with Excel support and upsert logic
  const handleImportAllProductData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show progress dialog
      setImportProgressMessage('Reading Excel file...');
      setImportProgressDialog(true);

      const formatUserMessage = (context: string, error: unknown) => {
        if (error instanceof ApolloError) {
          const graphMessages = error.graphQLErrors.map((gqlError) => gqlError.message).filter(Boolean);
          const networkMessage = error.networkError && 'message' in error.networkError
            ? (error.networkError as { message: string }).message
            : undefined;
          const parts = [...graphMessages, error.message, networkMessage].filter(Boolean);
          const detail = parts.length > 0 ? parts.join(' ') : 'Please try again.';
          return `${context}. ${detail}`;
        }
        if (error instanceof Error) {
          return `${context}. ${error.message}`;
        }
        return `${context}. An unexpected error occurred. Please try again.`;
      };

      const collectedErrors: string[] = [];
      const appendError = (message: string) => {
        if (!collectedErrors.includes(message)) {
          collectedErrors.push(message);
        }
      };

      const recordError = (context: string, error: unknown) => {
        const message = formatUserMessage(context, error);
        console.error(context, error);
        appendError(message);
      };

      const noteIssue = (message: string) => {
        console.warn(message);
        appendError(message);
      };

      const alertFriendlyError = (context: string, error: unknown) => {
        const message = formatUserMessage(context, error);
        console.error(context, error);
        appendError(message);
        alert(message);
      };

      try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const toPlainString = (cellValue: any): string => {
          if (cellValue === null || cellValue === undefined) return '';
          if (typeof cellValue === 'object') {
            if (typeof cellValue.text === 'string') {
              return cellValue.text;
            }
            if (Array.isArray(cellValue.richText)) {
              return cellValue.richText.map((part: any) => part.text ?? '').join('');
            }
            if (typeof cellValue.result !== 'undefined') {
              return toPlainString(cellValue.result);
            }
          }
          return cellValue.toString();
        };

        const toNumberOrUndefined = (cellValue: any): number | undefined => {
          if (cellValue === null || cellValue === undefined || cellValue === '') {
            return undefined;
          }
          if (typeof cellValue === 'number') {
            return Number.isNaN(cellValue) ? undefined : cellValue;
          }
          const text = toPlainString(cellValue).trim();
          if (!text) return undefined;
          const parsed = Number(text);
          return Number.isNaN(parsed) ? undefined : parsed;
        };

        const parseDelimitedList = (cellValue: any): string[] => {
          const text = toPlainString(cellValue).trim();
          if (!text) return [];
          return text
            .split(/[,;\n]/)
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        };

        const simpleAttributesSheet = workbook.getWorksheet('Simple Attributes');
        const simpleAttributes: Record<string, string> = {};
        if (simpleAttributesSheet) {
          simpleAttributesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const attributeName = toPlainString(row.getCell(1).value).trim().toLowerCase();
            const valueString = toPlainString(row.getCell(2).value).trim();
            if (attributeName) {
              simpleAttributes[attributeName] = valueString;
            }
          });
        }

        const importedProductName = (simpleAttributes['name'] || '').trim();
        const importedProductDescription = simpleAttributes['description'] || '';

        let productForImport = products.find((p: any) => p.id === selectedProduct) || null;
        let importTargetProductId = productForImport?.id || '';

        const resolution = resolveImportTarget({
          selectedProduct: productForImport ? { id: productForImport.id, name: productForImport.name } : null,
          importedName: importedProductName,
          existingProducts: products.map((p: any) => ({ id: p.id, name: p.name }))
        });

        if (resolution.status === 'abort') {
          const reasonMessages: Record<ResolveImportAbortReason, string> = {
            'missing-name': 'Please select a product or include a Name in the Simple Attributes tab before importing.'
          };
          setImportProgressDialog(false);
          alert(reasonMessages[resolution.reason]);
          return;
        }

        setImportProgressMessage('Processing product information...');

        if (resolution.status === 'use-existing') {
          const existingFull = products.find((p: any) => p.id === resolution.product.id);
          if (!existingFull) {
            setImportProgressDialog(false);
            alert('Unable to locate the product referenced in Excel. Please refresh and try again.');
            return;
          }
          productForImport = existingFull;
          importTargetProductId = existingFull.id;
          setSelectedProduct(existingFull.id);
        } else if (resolution.status === 'create-new') {
          const newProductName = resolution.name.trim();
          if (!newProductName) {
            setImportProgressDialog(false);
            alert('The Excel file is missing a product name in the Simple Attributes tab. Please add a Name value to create a new product or select an existing product to update.');
            return;
          }

          setImportProgressMessage(`Creating new product "${newProductName}"...`);

          try {
            const createResult = await client.mutate({
              mutation: gql`
                mutation CreateProduct($input: ProductInput!) {
                  createProduct(input: $input) {
                    id
                    name
                    description
                  }
                }
              `,
              variables: {
                input: {
                  name: newProductName,
                  description: importedProductDescription,
                  customAttrs: {}
                }
              }
            });

            const createdProduct = createResult.data?.createProduct;
            if (!createdProduct) {
              throw new Error('The product was not created successfully. Please try again or contact support if the problem persists.');
            }

            productForImport = {
              ...createdProduct,
              customAttrs: {},
              outcomes: [],
              licenses: [],
              releases: []
            };
            importTargetProductId = productForImport.id;
            setSelectedProduct(productForImport.id);
          } catch (error) {
            alertFriendlyError(`Simple Attributes tab: We couldn't create the product "${newProductName}"`, error);
            setImportProgressDialog(false);
            return;
          }
        }

        if (!productForImport) {
          setImportProgressDialog(false);
          alert('Could not determine which product to import. Please select a product or include a Name in the Simple Attributes tab.');
          return;
        }

        const product = productForImport;
        const productIdForImport = importTargetProductId || product.id;

        setImportProgressMessage('Loading existing data...');

        // Get current licenses and releases for upsert logic
        let currentLicenses: any[] = [];
        let currentReleases: any[] = [];
        let currentTasks: any[] = [];

        try {
          const allLicensesResult = await client.query({
            query: gql`
              query AllLicenses {
                licenses {
                  id
                  name
                  description
                  level
                  isActive
                  product {
                    id
                  }
                }
              }
            `,
            fetchPolicy: 'network-only'
          });

          currentLicenses = allLicensesResult.data.licenses.filter((license: any) => 
            license.product?.id === productIdForImport
          );
        } catch (error) {
          alertFriendlyError('Unable to retrieve existing licenses from the server. Please check your connection and try again', error);
          setImportProgressDialog(false);
          return;
        }

        try {
          const allReleasesResult = await client.query({
            query: gql`
              query AllReleases {
                releases {
                  id
                  name
                  description
                  level
                  isActive
                  product {
                    id
                  }
                }
              }
            `,
            fetchPolicy: 'network-only'
          });

          currentReleases = allReleasesResult.data.releases.filter((release: any) => 
            release.product?.id === productIdForImport
          );
        } catch (error) {
          alertFriendlyError('Unable to retrieve existing releases from the server. Please check your connection and try again', error);
          return;
        }

        try {
          const currentTasksResult = await client.query({
            query: TASKS_FOR_PRODUCT,
            variables: { productId: productIdForImport },
            fetchPolicy: 'network-only'
          });

          currentTasks = (currentTasksResult.data?.tasks?.edges || []).map((edge: any) => edge.node);
        } catch (error) {
          alertFriendlyError('Unable to retrieve existing tasks from the server. Please check your connection and try again', error);
          return;
        }

  const licensesByName = new Map<string, any>(currentLicenses.map((license: any) => [license.name.toLowerCase().trim(), license]));
  const releasesByName = new Map<string, any>(currentReleases.map((release: any) => [release.name.toLowerCase().trim(), release]));
  const outcomeList: any[] = product.outcomes || [];
  const outcomesByName = new Map<string, any>(outcomeList.map((outcome: any) => [outcome.name.toLowerCase().trim(), outcome]));
  
  // Initialize task maps that will be used by both Tasks and Telemetry sections
  const tasksById = new Map<string, any>(currentTasks.map((task: any) => [task.id, task]));
  const tasksByName = new Map<string, any>(currentTasks.map((task: any) => [task.name.toLowerCase().trim(), task]));

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        const productUpdatePayload: any = {
          name: product.name,
          description: product.description || '',
          customAttrs: { ...(product.customAttrs || {}) }
        };
        let productNeedsUpdate = false;
        let simpleAttributeChanges = 0;

        // Import Simple Attributes (basic product fields)
        if (simpleAttributesSheet) {
          simpleAttributesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const attributeName = toPlainString(row.getCell(1).value).trim().toLowerCase();
            const rawValue = row.getCell(2).value;
            const valueString = toPlainString(rawValue).trim();

            if (!attributeName) return;

            switch (attributeName) {
              case 'name':
                if (valueString && valueString !== productUpdatePayload.name) {
                  productUpdatePayload.name = valueString;
                  simpleAttributeChanges++;
                  productNeedsUpdate = true;
                }
                break;
              case 'description':
                if (valueString !== productUpdatePayload.description) {
                  productUpdatePayload.description = valueString;
                  simpleAttributeChanges++;
                  productNeedsUpdate = true;
                }
                break;
              case 'status percent':
              case 'statuspercent':
              case 'status %':
                console.info('Status percent column is deprecated and will be ignored.');
                break;
              default:
                console.warn(`Unknown simple attribute "${attributeName}" encountered during import. Skipping.`);
                break;
            }
          });
        }

        if (simpleAttributeChanges > 0) {
          updatedCount += simpleAttributeChanges;
        }

        setImportProgressMessage('Importing outcomes...');

        // Import Outcomes with upsert logic
        const outcomesSheet = workbook.getWorksheet('Outcomes');
        if (outcomesSheet) {
          const outcomes: any[] = [];
          outcomesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const name = toPlainString(row.getCell(1).value).trim();
            const description = toPlainString(row.getCell(2).value).trim() || '';
            if (name) {
              outcomes.push({ rowNumber, name, description });
            }
          });

          for (const outcome of outcomes) {
            try {
              const outcomeKey = outcome.name.toLowerCase().trim();
              const existingOutcome = outcomesByName.get(outcomeKey);

              if (existingOutcome) {
                // Update existing outcome
                        const updateResult = await client.mutate({
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
                            id: existingOutcome.id,
                            input: {
                              name: outcome.name,
                              description: outcome.description,
                              productId: productIdForImport
                            }
                          }
                        });
                if (updateResult.data?.updateOutcome) {
                  const updatedOutcome = updateResult.data.updateOutcome;
                  const updatedKey = updatedOutcome.name.toLowerCase().trim();
                  outcomesByName.delete(outcomeKey);
                  outcomesByName.set(updatedKey, updatedOutcome);
                }
                updatedCount++;
              } else {
                // Create new outcome
                const createResult = await client.mutate({
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
                      description: outcome.description,
                      productId: productIdForImport
                    }
                  }
                });
                if (createResult.data?.createOutcome) {
                  const createdOutcome = createResult.data.createOutcome;
                  const createdKey = createdOutcome.name.toLowerCase().trim();
                  outcomeList.push(createdOutcome);
                  outcomesByName.set(createdKey, createdOutcome);
                }
                createdCount++;
              }
            } catch (error) {
              recordError(`Outcomes tab (row ${outcome.rowNumber}): Outcome "${outcome.name}" couldn't be saved`, error);
              errorCount++;
            }
          }
        }

        setImportProgressMessage('Importing licenses...');

        // Import Licenses with upsert logic
        const licensesSheet = workbook.getWorksheet('Licenses');
        if (licensesSheet) {
          const licenses: any[] = [];
          licensesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const name = toPlainString(row.getCell(1).value).trim();
            const description = toPlainString(row.getCell(2).value).trim() || '';
            const level = toNumberOrUndefined(row.getCell(3).value) ?? 1;
            const isActive = toPlainString(row.getCell(4).value).toLowerCase().trim() !== 'no';
            if (name) {
              licenses.push({ rowNumber, name, description, level, isActive });
            }
          });

          for (const license of licenses) {
            try {
              const licenseKey = license.name.toLowerCase().trim();
              const existingLicense = licensesByName.get(licenseKey);

              if (existingLicense) {
                // Update existing license
                const updateResult = await client.mutate({
                  mutation: UPDATE_LICENSE,
                  variables: {
                    id: existingLicense.id,
                    input: {
                      name: license.name,
                      description: license.description,
                      level: license.level,
                      isActive: license.isActive,
                      productId: productIdForImport
                    }
                  }
                });
                if (updateResult.data?.updateLicense) {
                  const updatedLicense = updateResult.data.updateLicense;
                  const updatedKey = updatedLicense.name.toLowerCase().trim();
                  licensesByName.delete(licenseKey);
                  licensesByName.set(updatedKey, updatedLicense);
                }
                updatedCount++;
              } else {
                // Create new license
                const createResult = await client.mutate({
                  mutation: CREATE_LICENSE,
                  variables: {
                    input: {
                      name: license.name,
                      description: license.description,
                      level: license.level,
                      isActive: license.isActive,
                      productId: productIdForImport
                    }
                  }
                });
                if (createResult.data?.createLicense) {
                  const createdLicense = createResult.data.createLicense;
                  const createdKey = createdLicense.name.toLowerCase().trim();
                  currentLicenses.push(createdLicense);
                  licensesByName.set(createdKey, createdLicense);
                }
                createdCount++;
              }
            } catch (error) {
              recordError(`Licenses tab (row ${license.rowNumber}): License "${license.name}" couldn't be saved`, error);
              errorCount++;
            }
          }
        }

        setImportProgressMessage('Importing releases...');

        // Import Releases with upsert logic
        const releasesSheet = workbook.getWorksheet('Releases');
        if (releasesSheet) {
          const releases: any[] = [];
          releasesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const name = toPlainString(row.getCell(1).value).trim();
            const description = toPlainString(row.getCell(2).value).trim() || '';
            const level = toNumberOrUndefined(row.getCell(3).value) ?? 1;
            const isActive = toPlainString(row.getCell(4).value).toLowerCase().trim() !== 'no';
            if (name) {
              releases.push({ rowNumber, name, description, level, isActive });
            }
          });

          for (const release of releases) {
            try {
              const releaseKey = release.name.toLowerCase().trim();
              const existingRelease = releasesByName.get(releaseKey);

              if (existingRelease) {
                // Update existing release
                const updateResult = await client.mutate({
                  mutation: UPDATE_RELEASE,
                  variables: {
                    id: existingRelease.id,
                    input: {
                      name: release.name,
                      description: release.description,
                      level: release.level,
                      isActive: release.isActive,
                      productId: productIdForImport
                    }
                  }
                });
                if (updateResult.data?.updateRelease) {
                  const updatedRelease = updateResult.data.updateRelease;
                  const updatedKey = updatedRelease.name.toLowerCase().trim();
                  releasesByName.delete(releaseKey);
                  releasesByName.set(updatedKey, updatedRelease);
                }
                updatedCount++;
              } else {
                // Create new release
                const createResult = await client.mutate({
                  mutation: CREATE_RELEASE,
                  variables: {
                    input: {
                      name: release.name,
                      description: release.description,
                      level: release.level,
                      isActive: release.isActive,
                      productId: productIdForImport
                    }
                  }
                });
                if (createResult.data?.createRelease) {
                  const createdRelease = createResult.data.createRelease;
                  const createdKey = createdRelease.name.toLowerCase().trim();
                  currentReleases.push(createdRelease);
                  releasesByName.set(createdKey, createdRelease);
                }
                createdCount++;
              }
            } catch (error) {
              recordError(`Releases tab (row ${release.rowNumber}): Release "${release.name}" couldn't be saved`, error);
              errorCount++;
            }
          }
        }

        setImportProgressMessage('Importing tasks...');

        // Import Tasks with upsert logic
        const normalizeLicenseLevel = (level?: string | number): string | undefined => {
          if (level === undefined || level === null) return undefined;
          if (typeof level === 'number') {
            if (level >= 2.5) return 'Signature';
            if (level >= 1.5) return 'Advantage';
            return 'Essential';
          }
          const normalized = level.trim().toLowerCase();
          if (!normalized) return undefined;
          if (normalized === 'essential') return 'Essential';
          if (normalized === 'advantage') return 'Advantage';
          if (normalized === 'signature') return 'Signature';
          return undefined;
        };

        const normalizePriority = (value?: string): string | undefined => {
          if (!value) return undefined;
          const normalized = value.trim().toLowerCase();
          if (!normalized) return undefined;
          const priorityMap: Record<string, string> = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Critical'
          };
          return priorityMap[normalized] || value.trim();
        };

        const tasksSheet = workbook.getWorksheet('Tasks');
        if (tasksSheet) {
          // tasksById and tasksByName are already defined at the beginning of import
          
          const headerAliases: Record<string, string[]> = {
            id: ['id'],
            name: ['name'],
            description: ['description'],
            sequenceNumber: ['sequence number', 'sequence'],
            estMinutes: ['estimated minutes', 'est minutes', 'est. minutes'],
            weight: ['weight'],
            licenseLevel: ['license level'],
            priority: ['priority'],
            licenseName: ['license name'],
            outcomeNames: ['outcome names', 'outcomes'],
            releaseNames: ['release names', 'releases'],
            notes: ['notes'],
            howToDoc: ['how to doc', 'how-to doc', 'documentation link'],
            howToVideo: ['how to video', 'how-to video', 'video link']
          };

          const headerIndices: Record<string, number> = {};
          const headerRow = tasksSheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            const headerValue = toPlainString(cell.value).trim().toLowerCase();
            if (!headerValue) return;
            Object.entries(headerAliases).forEach(([key, aliases]) => {
              if (!headerIndices[key] && aliases.includes(headerValue)) {
                headerIndices[key] = colNumber;
              }
            });
          });

          const getCellValue = (row: any, key: string) => {
            const index = headerIndices[key];
            return index ? row.getCell(index).value : undefined;
          };

          const fallbackIndices: Record<string, number> = {
            id: 1,
            name: 2,
            description: 3,
            sequenceNumber: 4,
            estMinutes: 5,
            weight: 6,
            priority: 7,
            licenseName: 8,
            outcomeNames: 9,
            releaseNames: 10,
            notes: 11,
            howToDoc: 12,
            howToVideo: 13
          };

          // Ensure essential headers have fallback indices for backward compatibility
          Object.entries(fallbackIndices).forEach(([key, index]) => {
            if (!headerIndices[key]) {
              headerIndices[key] = index;
            }
          });

          const tasksToProcess: any[] = [];
          tasksSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const id = toPlainString(getCellValue(row, 'id')).trim();
            const name = toPlainString(getCellValue(row, 'name')).trim();
            if (!name) return;

            const rawPriority = toPlainString(getCellValue(row, 'priority')).trim();
            const normalizedPriority = normalizePriority(rawPriority);
            const rawLicenseLevel = toPlainString(getCellValue(row, 'licenseLevel')).trim();

            tasksToProcess.push({
              rowNumber,
              id,
              name,
              description: toPlainString(getCellValue(row, 'description')).trim(),
              sequenceNumber: toNumberOrUndefined(getCellValue(row, 'sequenceNumber')),
              estMinutes: toNumberOrUndefined(getCellValue(row, 'estMinutes')),
              weight: toNumberOrUndefined(getCellValue(row, 'weight')),
              priority: normalizedPriority,
              licenseName: toPlainString(getCellValue(row, 'licenseName')).trim(),
              outcomeNames: parseDelimitedList(getCellValue(row, 'outcomeNames')),
              releaseNames: parseDelimitedList(getCellValue(row, 'releaseNames')),
              notes: toPlainString(getCellValue(row, 'notes')),
              howToDoc: parseDelimitedList(getCellValue(row, 'howToDoc')),
              howToVideo: parseDelimitedList(getCellValue(row, 'howToVideo')),
              licenseLevel: normalizeLicenseLevel(rawLicenseLevel)
            });
          });

          for (const taskRow of tasksToProcess) {
            try {
              const rowLabel = `Tasks tab (row ${taskRow.rowNumber})`;
              const idKey = taskRow.id;
              const nameKey = taskRow.name.toLowerCase().trim();
              const existingTask = (idKey && tasksById.get(idKey)) || tasksByName.get(nameKey);

              const licenseMatch = taskRow.licenseName ? licensesByName.get(taskRow.licenseName.toLowerCase()) : undefined;
              const licenseId = licenseMatch?.id;
              if (taskRow.licenseName && !licenseId) {
                noteIssue(`${rowLabel}: License "${taskRow.licenseName}" not found in Licenses tab. Update the License Name column to match an existing license.`);
              }

              const outcomeIds = taskRow.outcomeNames
                .map((outcomeName: string) => {
                  const outcome = outcomesByName.get(outcomeName.toLowerCase());
                  if (!outcome) {
                    noteIssue(`${rowLabel}: Outcome "${outcomeName}" not found in Outcomes tab. Confirm the Outcome Names column uses exact names from the Outcomes tab.`);
                  }
                  return outcome?.id;
                })
                .filter((id: string | undefined): id is string => Boolean(id));

              const releaseIds = taskRow.releaseNames
                .map((releaseName: string) => {
                  const release = releasesByName.get(releaseName.toLowerCase());
                  if (!release) {
                    noteIssue(`${rowLabel}: Release "${releaseName}" not found in Releases tab. Verify the Release Names column.`);
                  }
                  return release?.id;
                })
                .filter((id: string | undefined): id is string => Boolean(id));

              const buildCommonInput = (existing?: any) => {
                const input: any = {
                  name: taskRow.name
                };

                input.description = taskRow.description || '';

                if (typeof taskRow.estMinutes === 'number') {
                  input.estMinutes = taskRow.estMinutes;
                } else if (!existing) {
                  input.estMinutes = 0;
                }
                if (typeof taskRow.weight === 'number') {
                  input.weight = taskRow.weight;
                } else if (!existing) {
                  input.weight = 0;
                }
                if (typeof taskRow.sequenceNumber === 'number') {
                  input.sequenceNumber = taskRow.sequenceNumber;
                }
                const effectivePriority = normalizePriority(taskRow.priority) || normalizePriority(existing?.priority) || 'Medium';
                input.priority = effectivePriority;

                const licenseLevelFromExisting = normalizeLicenseLevel(existing?.licenseLevel);
                const licenseLevelFromSheet = normalizeLicenseLevel(taskRow.licenseLevel);
                const licenseLevelFromLicense = normalizeLicenseLevel(licenseMatch?.level);
                const resolvedLicenseLevel = licenseLevelFromSheet || licenseLevelFromExisting || licenseLevelFromLicense || 'Essential';
                input.licenseLevel = resolvedLicenseLevel;
                if (licenseId) {
                  input.licenseId = licenseId;
                }
                if (outcomeIds.length > 0) {
                  input.outcomeIds = outcomeIds;
                }
                if (releaseIds.length > 0) {
                  input.releaseIds = releaseIds;
                }

                input.notes = taskRow.notes || '';
                input.howToDoc = taskRow.howToDoc || '';
                input.howToVideo = taskRow.howToVideo || '';

                return input;
              };

              if (existingTask) {
                const updateInput = buildCommonInput(existingTask);

                const updateResult = await client.mutate({
                  mutation: UPDATE_TASK,
                  variables: {
                    id: existingTask.id,
                    input: updateInput
                  }
                });

                if (updateResult.data?.updateTask) {
                  const updatedTask = updateResult.data.updateTask;
                  tasksById.set(updatedTask.id, updatedTask);
                  tasksByName.delete(existingTask.name.toLowerCase().trim());
                  tasksByName.set(updatedTask.name.toLowerCase().trim(), updatedTask);
                }

                updatedCount++;
              } else {
                const createInput = buildCommonInput();
                createInput.productId = productIdForImport;

                const createResult = await client.mutate({
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
                  variables: { input: createInput }
                });

                if (createResult.data?.createTask) {
                  const createdTask = createResult.data.createTask;
                  tasksById.set(createdTask.id, createdTask);
                  tasksByName.set(createdTask.name.toLowerCase().trim(), createdTask);
                  currentTasks.push(createdTask);
                }

                createdCount++;
              }
            } catch (error) {
              recordError(`Tasks tab (row ${taskRow.rowNumber}): Task "${taskRow.name || taskRow.id || 'Unknown'}" couldn't be saved`, error);
              errorCount++;
            }
          }
        }

        setImportProgressMessage('Importing custom attributes...');

        // Import Custom Attributes with merge logic
        const customAttrsSheet = workbook.getWorksheet('Custom Attributes');
        if (customAttrsSheet) {
          const mergedAttrs: any = { ...(productUpdatePayload.customAttrs || {}) };
          customAttrsSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const key = toPlainString(row.getCell(1).value).trim();
            const rawValue = row.getCell(2).value;
            const valueString = toPlainString(rawValue).trim();

            if (key) {
              let parsedValue: any = valueString;

              if (valueString === '') {
                parsedValue = '';
              } else if (/^(true|false)$/i.test(valueString)) {
                parsedValue = valueString.toLowerCase() === 'true';
              } else if (valueString.toLowerCase() === 'null') {
                parsedValue = null;
              } else if ((valueString.startsWith('{') && valueString.endsWith('}')) || (valueString.startsWith('[') && valueString.endsWith(']'))) {
                try {
                  parsedValue = JSON.parse(valueString);
                } catch (jsonError) {
                  noteIssue(`Custom Attributes tab (row ${rowNumber}): Value for "${key}" is not valid JSON. Stored as text instead.`);
                  parsedValue = valueString;
                }
              } else if (!Number.isNaN(Number(valueString))) {
                parsedValue = Number(valueString);
              } else if (typeof rawValue === 'number') {
                parsedValue = rawValue;
              }

              const existingValue = mergedAttrs.hasOwnProperty(key) ? mergedAttrs[key] : undefined;
              const valueChanged = JSON.stringify(existingValue) !== JSON.stringify(parsedValue);

              if (existingValue === undefined) {
                createdCount++;
              } else if (valueChanged) {
                updatedCount++;
              }

              if (existingValue === undefined || valueChanged) {
                mergedAttrs[key] = parsedValue;
                productNeedsUpdate = true;
              }
            }
          });

          productUpdatePayload.customAttrs = mergedAttrs;
        }

        if (productNeedsUpdate) {
          try {
            const productInput: any = {
              name: productUpdatePayload.name,
              description: productUpdatePayload.description,
              customAttrs: productUpdatePayload.customAttrs
            };

            await client.mutate({
              mutation: UPDATE_PRODUCT,
              variables: {
                id: productIdForImport,
                input: productInput
              }
            });
          } catch (error) {
            recordError(`Simple Attributes tab: Product "${productUpdatePayload.name}" couldn't be updated`, error);
            errorCount++;
          }
        }

        // Process Telemetry Attributes sheet
        setImportProgressMessage('Processing telemetry attributes...');
        const telemetrySheet = workbook.getWorksheet('Telemetry Attributes');
        if (telemetrySheet) {
          const headerIndices: { [key: string]: number } = {};
          telemetrySheet.getRow(1).eachCell((cell, colNumber) => {
            const key = toPlainString(cell.value).trim().toLowerCase().replace(/\s+/g, '');
            if (key) {
              headerIndices[key] = colNumber;
            }
          });

          const getCellValue = (row: any, key: string): any => {
            const colIndex = headerIndices[key.toLowerCase().replace(/\s+/g, '')];
            return colIndex ? row.getCell(colIndex).value : undefined;
          };

          // tasksByName is already built and maintained during task import - no need to rebuild

          // Build a map of existing telemetry attributes by task name and attribute name
          const existingTelemetryMap = new Map<string, Map<string, any>>();
          currentTasks.forEach((task: any) => {
            const taskKey = task.name.toLowerCase().trim();
            const attrMap = new Map<string, any>();
            (task.telemetryAttributes || []).forEach((attr: any) => {
              attrMap.set(attr.name.toLowerCase().trim(), attr);
            });
            existingTelemetryMap.set(taskKey, attrMap);
          });

          const telemetryAttributesToProcess: any[] = [];
          telemetrySheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const taskName = toPlainString(getCellValue(row, 'taskname')).trim();
            const attributeName = toPlainString(getCellValue(row, 'attributename')).trim();
            
            if (!taskName || !attributeName) return;

            const dataType = toPlainString(getCellValue(row, 'datatype')).trim();
            const isRequiredStr = toPlainString(getCellValue(row, 'isrequired')).trim().toLowerCase();
            const isActiveStr = toPlainString(getCellValue(row, 'isactive')).trim().toLowerCase();

            telemetryAttributesToProcess.push({
              rowNumber,
              taskName,
              attributeName,
              description: toPlainString(getCellValue(row, 'description')).trim(),
              dataType: dataType || 'string',
              isRequired: isRequiredStr === 'yes' || isRequiredStr === 'true',
              successCriteria: toPlainString(getCellValue(row, 'successcriteria')).trim(),
              order: toNumberOrUndefined(getCellValue(row, 'order')),
              isActive: isActiveStr !== 'no' && isActiveStr !== 'false' // Default to true
            });
          });

          for (const telemetryRow of telemetryAttributesToProcess) {
            try {
              const rowLabel = `Telemetry Attributes tab (row ${telemetryRow.rowNumber})`;
              const taskKey = telemetryRow.taskName.toLowerCase().trim();
              const task = tasksByName.get(taskKey);

              if (!task) {
                noteIssue(`${rowLabel}: Task "${telemetryRow.taskName}" not found. Ensure the Task Name matches an existing task from the Tasks tab.`);
                continue;
              }

              const attrKey = telemetryRow.attributeName.toLowerCase().trim();
              const taskAttrMap = existingTelemetryMap.get(taskKey);
              const existingAttr = taskAttrMap?.get(attrKey);

              // Process successCriteria - it should be a JSON string for the backend
              let successCriteriaForBackend: string | undefined = undefined;
              if (telemetryRow.successCriteria) {
                const criteriaStr = telemetryRow.successCriteria.trim();
                console.log(`[Import] ========== Processing "${telemetryRow.attributeName}" ==========`);
                console.log(`[Import] Raw from Excel (length ${criteriaStr.length}):`, criteriaStr);
                if (criteriaStr) {
                  // Check if it's already valid JSON
                  try {
                    const parsed = JSON.parse(criteriaStr);
                    console.log(`[Import] Successfully parsed JSON!`);
                    console.log(`[Import] Parsed object:`, JSON.stringify(parsed, null, 2));
                    console.log(`[Import] Parsed keys:`, Object.keys(parsed));
                    console.log(`[Import] Has type?`, parsed.type);
                    console.log(`[Import] Has operator?`, parsed.operator);
                    console.log(`[Import] Has threshold?`, parsed.threshold);
                    console.log(`[Import] Has pattern?`, parsed.pattern);
                    // It's valid JSON, use as-is
                    successCriteriaForBackend = criteriaStr;
                  } catch (e) {
                    // Not valid JSON - skip it
                    console.error(`[Import] ❌ Invalid JSON for success criteria:`, e);
                    console.error(`[Import] String was:`, criteriaStr);
                  }
                }
              } else {
                console.log(`[Import] ⚠️ No success criteria in Excel for "${telemetryRow.attributeName}"`);
              }

              const input: any = {
                taskId: task.id,
                name: telemetryRow.attributeName,
                description: telemetryRow.description || '',
                dataType: telemetryRow.dataType,
                isRequired: telemetryRow.isRequired,
                successCriteria: successCriteriaForBackend || '',  // Send empty string if no valid JSON
                order: telemetryRow.order ?? 0,
                isActive: telemetryRow.isActive
              };

              if (existingAttr) {
                // Check if anything changed
                // Normalize successCriteria for comparison (both should be strings)
                const existingCriteria = existingAttr.successCriteria || '';
                const newCriteria = input.successCriteria || '';
                
                console.log(`[Import] 🔍 Comparing existing vs new for "${telemetryRow.attributeName}"`);
                console.log(`[Import] Existing criteria (type: ${typeof existingCriteria}, length: ${existingCriteria.length}):`, existingCriteria);
                console.log(`[Import] New criteria (type: ${typeof newCriteria}, length: ${newCriteria.length}):`, newCriteria);
                console.log(`[Import] Criteria equal?`, existingCriteria === newCriteria);
                
                const changed = 
                  existingAttr.description !== input.description ||
                  existingAttr.dataType !== input.dataType ||
                  existingAttr.isRequired !== input.isRequired ||
                  existingCriteria !== newCriteria ||
                  existingAttr.order !== input.order ||
                  existingAttr.isActive !== input.isActive;

                if (changed) {
                  console.log(`[Import] ✅ Changes detected! Updating telemetry attribute "${telemetryRow.attributeName}" for task "${telemetryRow.taskName}"`);
                  console.log('[Import] Mutation input:', JSON.stringify(input, null, 2));
                  await client.mutate({
                    mutation: UPDATE_TELEMETRY_ATTRIBUTE,
                    variables: {
                      id: existingAttr.id,
                      input: input
                    }
                  });
                  updatedCount++;
                  console.log(`[Import] ✅ Update mutation completed for "${telemetryRow.attributeName}"`);
                } else {
                  console.log(`[Import] ⚠️ No changes detected for "${telemetryRow.attributeName}" - skipping update`);
                }
              } else {
                // Create new telemetry attribute
                console.log(`[Import] ✨ Creating NEW telemetry attribute "${telemetryRow.attributeName}" for task "${telemetryRow.taskName}"`);
                console.log('[Import] Success criteria to create:', input.successCriteria);
                console.log('[Import] Mutation input:', JSON.stringify(input, null, 2));
                await client.mutate({
                  mutation: CREATE_TELEMETRY_ATTRIBUTE,
                  variables: {
                    input: input
                  }
                });
                createdCount++;
                console.log(`[Import] ✅ Create mutation completed for "${telemetryRow.attributeName}"`);
              }
            } catch (error) {
              recordError(`Telemetry Attributes tab (row ${telemetryRow.rowNumber}): Failed to process telemetry attribute "${telemetryRow.attributeName}" for task "${telemetryRow.taskName}"`, error);
              errorCount++;
            }
          }
        }

        setImportProgressMessage('Finalizing import...');

        // Refresh data
        try {
          await refetchProducts();
          await refetchTasks({ productId: productIdForImport });
        } catch (error) {
          console.warn('Failed to refresh data after import:', error);
          noteIssue('Import completed, but the display may not reflect the latest changes. Please refresh the page to see all updates.');
        }

        // Close progress dialog
        setImportProgressDialog(false);

        const errorSummary = collectedErrors.length > 0
          ? `\n\nIssues detected:\n- ${collectedErrors.join('\n- ')}`
          : '';

        alert(`Excel import completed!\n\nCreated: ${createdCount}\nUpdated: ${updatedCount}\nErrors: ${errorCount}${errorSummary}\n\nImported: Simple Attributes, Outcomes, Licenses, Releases, Tasks, Custom Attributes, Telemetry Attributes\nRemember: Keep Name columns unchanged to update existing records.`);

      } catch (error) {
        setImportProgressDialog(false);
        alertFriendlyError('We were unable to process the Excel file', error);
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
                  sx={{ 
                    pl: 6,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#e0e0e0',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '12px',
                      height: '2px',
                      backgroundColor: '#e0e0e0',
                    }
                  }}
                  selected={selectedProductSubSection === 'main'}
                  onClick={() => handleProductSubSectionChange('main')}
                >
                  <ListItemIcon>
                    <MainIcon />
                  </ListItemIcon>
                  <ListItemText primary="Main" />
                </ListItemButton>

                <ListItemButton
                  sx={{ 
                    pl: 6,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#e0e0e0',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '12px',
                      height: '2px',
                      backgroundColor: '#e0e0e0',
                    }
                  }}
                  selected={selectedProductSubSection === 'tasks'}
                  onClick={() => handleProductSubSectionChange('tasks')}
                >
                  <ListItemIcon>
                    <TaskIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tasks" />
                </ListItemButton>

                <ListItemButton
                  sx={{ 
                    pl: 6,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#e0e0e0',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '12px',
                      height: '2px',
                      backgroundColor: '#e0e0e0',
                    }
                  }}
                  selected={selectedProductSubSection === 'licenses'}
                  onClick={() => handleProductSubSectionChange('licenses')}
                >
                  <ListItemIcon>
                    <LicenseIcon />
                  </ListItemIcon>
                  <ListItemText primary="Licenses" />
                </ListItemButton>

                <ListItemButton
                  sx={{ 
                    pl: 6,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#e0e0e0',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '12px',
                      height: '2px',
                      backgroundColor: '#e0e0e0',
                    }
                  }}
                  selected={selectedProductSubSection === 'releases'}
                  onClick={() => handleProductSubSectionChange('releases')}
                >
                  <ListItemIcon>
                    <ReleaseIcon />
                  </ListItemIcon>
                  <ListItemText primary="Releases" />
                </ListItemButton>

                <ListItemButton
                  sx={{ 
                    pl: 6,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#e0e0e0',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '12px',
                      height: '2px',
                      backgroundColor: '#e0e0e0',
                    }
                  }}
                  selected={selectedProductSubSection === 'outcomes'}
                  onClick={() => handleProductSubSectionChange('outcomes')}
                >
                  <ListItemIcon>
                    <OutcomeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Outcomes" />
                </ListItemButton>

                <ListItemButton
                  sx={{ 
                    pl: 6,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: 0,
                      bottom: '50%',
                      width: '2px',
                      backgroundColor: '#e0e0e0',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      width: '12px',
                      height: '2px',
                      backgroundColor: '#e0e0e0',
                    }
                  }}
                  selected={selectedProductSubSection === 'customAttributes'}
                  onClick={() => handleProductSubSectionChange('customAttributes')}
                >
                  <ListItemIcon>
                    <CustomAttributeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Custom Attributes" />
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
                {/* Header - Only show on 'main' submenu */}
                {selectedProductSubSection === 'main' && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                      Products
                    </Typography>
                  </Box>
                )}

                {/* Product Selection - Only show on 'main' submenu */}
                {selectedProductSubSection === 'main' && (
                  <Paper sx={{ p: 3, mb: 2 }}>
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

                    {/* Product Selector and Actions Row */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Products Dropdown */}
                      <FormControl sx={{ minWidth: 300, flex: '1 1 300px' }}>
                        <InputLabel>Select Product</InputLabel>
                        <Select
                          value={selectedProduct}
                          onChange={(e) => {
                            setSelectedProduct(e.target.value);
                            setSelectedProductSubSection('main');
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

                      {/* Product Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button 
                          variant="contained" 
                          startIcon={<Add />}
                          onClick={() => setAddProductDialog(true)}
                          size="medium"
                        >
                          Add
                        </Button>
                        {selectedProduct && (
                          <>
                            <Button 
                              variant="contained" 
                              startIcon={<Edit />}
                              onClick={() => {
                                const product = products.find((p: any) => p.id === selectedProduct);
                                if (product) {
                                  setEditingProduct({ ...product });
                                  setEditProductDialog(true);
                                }
                              }}
                              size="medium"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="contained" 
                              color="success"
                              startIcon={<FileDownload />}
                              onClick={() => handleExportAllProductData()}
                              size="medium"
                            >
                              Export
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary"
                              startIcon={<FileUpload />}
                              onClick={() => handleImportAllProductData()}
                              size="medium"
                            >
                              Import
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => {
                                const product = products.find((p: any) => p.id === selectedProduct);
                                if (product && window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                  handleDeleteProduct(product.id);
                                }
                              }}
                              size="medium"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>

                  </Paper>
                )}

                {/* Main Sub-section - Summary Tiles */}
                {selectedProductSubSection === 'main' && selectedProduct && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
                    <Paper sx={{ p: 4, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                      {(() => {
                        const currentProduct = products.find((p: any) => p.id === selectedProduct);
                        return currentProduct ? (
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.9,
                              fontSize: '1.05rem',
                              whiteSpace: 'pre-line'
                            }}
                          >
                            {currentProduct.description || 'No description provided'}
                          </Typography>
                        ) : (
                          <Typography variant="body1" color="text.secondary">
                            No product selected
                          </Typography>
                        );
                      })()}
                    </Paper>

                    {(() => {
                      const currentProduct = products.find((p: any) => p.id === selectedProduct);
                      if (!currentProduct) {
                        return null;
                      }

                      const outcomeNames = (currentProduct.outcomes || []).map((item: any) => item.name).filter(Boolean);
                      const licenseNames = (currentProduct.licenses || []).map((item: any) => item.name).filter(Boolean);
                      const releases = (currentProduct.releases || []).map((item: any) => ({ name: item.name, level: item.level })).filter((r: any) => r.name);
                      const customAttrs = currentProduct.customAttrs || {};
                      const customAttrEntries = Object.entries(customAttrs);

                      const tileData = [
                        { key: 'outcomes' as const, title: 'Outcomes', items: outcomeNames, type: 'list' },
                        { key: 'licenses' as const, title: 'Licenses', items: licenseNames, type: 'list' },
                        { key: 'releases' as const, title: 'Releases', items: releases, type: 'releaseWithLevel' },
                        { key: 'customAttributes' as const, title: 'Custom Attributes', items: customAttrEntries, type: 'keyValue' }
                      ];

                      const NAME_DISPLAY_LIMIT = 12;

                      return (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: 2
                          }}
                        >
                          {tileData.map((tile) => (
                            <Paper
                              key={tile.key}
                              elevation={1}
                              onClick={() => handleProductSubSectionChange(tile.key)}
                              sx={{
                                p: 3,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: '1px solid #e0e0e0',
                                '&:hover': {
                                  boxShadow: 4,
                                  borderColor: '#d0d0d0'
                                }
                              }}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                {tile.title}
                              </Typography>
                              {tile.items.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {tile.type === 'keyValue' ? (
                                    // For custom attributes, show key: value
                                    <>
                                      {(tile.items.length <= NAME_DISPLAY_LIMIT ? tile.items : tile.items.slice(0, NAME_DISPLAY_LIMIT)).map(([key, value]: [string, any]) => (
                                        <Typography
                                          key={key}
                                          variant="body2"
                                          sx={{
                                            color: '#424242',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}
                                        >
                                          <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </Typography>
                                      ))}
                                      {tile.items.length > NAME_DISPLAY_LIMIT && (
                                        <Typography variant="caption" color="text.secondary">
                                          +{tile.items.length - NAME_DISPLAY_LIMIT} more
                                        </Typography>
                                      )}
                                    </>
                                  ) : tile.type === 'releaseWithLevel' ? (
                                    // For releases, show name with level
                                    <>
                                      {(tile.items.length <= NAME_DISPLAY_LIMIT ? tile.items : tile.items.slice(0, NAME_DISPLAY_LIMIT)).map((release: any) => (
                                        <Typography
                                          key={release.name}
                                          variant="body2"
                                          sx={{
                                            color: '#424242',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}
                                        >
                                          {release.name} <strong>(v{release.level})</strong>
                                        </Typography>
                                      ))}
                                      {tile.items.length > NAME_DISPLAY_LIMIT && (
                                        <Typography variant="caption" color="text.secondary">
                                          +{tile.items.length - NAME_DISPLAY_LIMIT} more
                                        </Typography>
                                      )}
                                    </>
                                  ) : (
                                    // For other items, show just the name
                                    <>
                                      {(tile.items.length <= NAME_DISPLAY_LIMIT ? tile.items : tile.items.slice(0, NAME_DISPLAY_LIMIT)).map((name: string) => (
                                        <Typography
                                          key={name}
                                          variant="body2"
                                          sx={{
                                            color: '#424242',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}
                                        >
                                          {name}
                                        </Typography>
                                      ))}
                                      {tile.items.length > NAME_DISPLAY_LIMIT && (
                                        <Typography variant="caption" color="text.secondary">
                                          +{tile.items.length - NAME_DISPLAY_LIMIT} more
                                        </Typography>
                                      )}
                                    </>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  No entries yet
                                </Typography>
                              )}
                            </Paper>
                          ))}
                        </Box>
                      );
                    })()}
                  </Box>
                )}

                {/* Outcomes Sub-section */}
                {selectedProductSubSection === 'outcomes' && selectedProduct && (
                  <Paper sx={{ p: 2, ml: 3, borderLeft: '4px solid #1976d2' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Outcomes for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Double-click to edit
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddOutcomeDialog(true)}>
                          Add Outcome
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
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {outcome.name}
                                  </Typography>
                                  {outcome.description && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {outcome.description}
                                    </Typography>
                                  )}
                                </Box>
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
                  <Paper sx={{ p: 2, ml: 3, borderLeft: '4px solid #1976d2' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Licenses for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Double-click to edit
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddLicenseDialog(true)}>
                          Add License
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
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {license.name}
                                    </Typography>
                                    {license.description && (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                      >
                                        {license.description}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
                                    <Chip
                                      label={`Level ${license.level}`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ flexShrink: 0 }}
                                    />
                                    {license.isActive ? (
                                      <Chip label="Active" size="small" color="success" variant="outlined" sx={{ flexShrink: 0 }} />
                                    ) : (
                                      <Chip label="Inactive" size="small" color="error" variant="outlined" sx={{ flexShrink: 0 }} />
                                    )}
                                  </Box>
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
                  <Paper sx={{ p: 2, ml: 3, borderLeft: '4px solid #1976d2' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Releases for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Double-click to edit
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddReleaseDialog(true)}>
                          Add Release
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
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {release.name}
                                    </Typography>
                                    {release.description && (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                      >
                                        {release.description}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
                                    <Chip
                                      label={`v${release.level}`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ flexShrink: 0 }}
                                    />
                                    {release.isActive ? (
                                      <Chip label="Active" size="small" color="success" variant="outlined" sx={{ flexShrink: 0 }} />
                                    ) : (
                                      <Chip label="Inactive" size="small" color="error" variant="outlined" sx={{ flexShrink: 0 }} />
                                    )}
                                  </Box>
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
                        Custom Attributes for {products.find((p: any) => p.id === selectedProduct)?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Double-click to edit
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setAddCustomAttributeDialog(true)}>
                          Add Attribute
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
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {key}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </Typography>
                                </Box>
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
                  <Paper sx={{ p: 2, ml: 3, borderLeft: '4px solid #1976d2' }}>
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
                      <>
                        {/* Column Headers - Using ListItemButton for perfect alignment */}
                        <ListItemButton
                          sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            backgroundColor: '#f5f5f5',
                            mb: 1,
                            cursor: 'default',
                            '&:hover': {
                              backgroundColor: '#f5f5f5'
                            }
                          }}
                          disableRipple
                        >
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            {/* Empty space for drag handle */}
                          </ListItemIcon>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              {/* Sequence number */}
                              <Box sx={{ minWidth: '56px', flexShrink: 0 }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">#</Typography>
                              </Box>
                              
                              {/* Task name */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">Task Name</Typography>
                              </Box>
                              
                              {/* Weight */}
                              <Box sx={{ minWidth: '105px', flexShrink: 0 }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">Weight (%)</Typography>
                              </Box>
                              
                              {/* How-to links - matching task structure with gap: 1 between internal boxes */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px', flexShrink: 0, justifyContent: 'flex-end' }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">How-To</Typography>
                              </Box>
                            </Box>
                          </Box>
                          {/* Spacer for Edit and Delete buttons - matching task row structure */}
                          <Box sx={{ display: 'flex', gap: 1, width: '80px', justifyContent: 'flex-end' }}>
                            {/* Empty space to align with Edit/Delete buttons */}
                          </Box>
                        </ListItemButton>

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
                                  onWeightChange={handleTaskWeightChange}
                                />
                              ))}
                            </Box>
                          </SortableContext>
                        </DndContext>
                      </>
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
                            selectedProductSubSection === 'licenses' ? 'licenses' :
                              selectedProductSubSection === 'outcomes' ? 'outcomes' :
                                selectedProductSubSection === 'customAttributes' ? 'custom attributes' :
                                  selectedProductSubSection === 'releases' ? 'releases' : 'details'
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

            {/* Add Custom Attributes Dialog */}
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

            {/* Import Progress Dialog */}
            <Dialog 
              open={importProgressDialog}
              disableEscapeKeyDown
              onClose={(event, reason) => {
                if (reason !== 'backdropClick') {
                  return;
                }
              }}
            >
              <DialogTitle>Importing Product Data</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2, minWidth: 300 }}>
                  <Typography>{importProgressMessage}</Typography>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ 
                      width: '100%', 
                      height: 4, 
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: 'primary.main',
                        animation: 'progress-bar 1.5s ease-in-out infinite',
                        '@keyframes progress-bar': {
                          '0%': { transform: 'translateX(-100%)' },
                          '100%': { transform: 'translateX(100%)' }
                        }
                      }} />
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
            </Dialog>

            {/* Documentation Links Menu */}
            <Menu
              anchorEl={docMenuAnchor?.el}
              open={Boolean(docMenuAnchor)}
              onClose={() => setDocMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
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

            {/* Video Links Menu */}
            <Menu
              anchorEl={videoMenuAnchor?.el}
              open={Boolean(videoMenuAnchor)}
              onClose={() => setVideoMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
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
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;