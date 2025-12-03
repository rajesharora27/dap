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
  Collapse,
  Menu,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import { TaskDialog } from '../components/dialogs/TaskDialog';
import { ProductsPage } from './ProductsPage';
import { SolutionsPage } from './SolutionsPage';
import { CustomersPage } from './CustomersPage';
import { ProductDialog } from '../components/dialogs/ProductDialog';
import { SolutionDialog } from '../components/dialogs/SolutionDialog';
import { LicenseDialog } from '../components/dialogs/LicenseDialog';
import { ReleaseDialog } from '../components/dialogs/ReleaseDialog';
import { OutcomeDialog } from '../components/dialogs/OutcomeDialog';
import { CustomAttributeDialog } from '../components/dialogs/CustomAttributeDialog';
import { CustomerAdoptionPanelV4 } from '../components/CustomerAdoptionPanelV4';
import { UserProfileDialog } from '../components/UserProfileDialog';
import { UserManagement } from '../components/UserManagement';
import { RoleManagement } from '../components/RoleManagement';
import { BackupManagementPanel } from '../components/BackupManagementPanel';
import { ThemeSelector } from '../components/ThemeSelector';
import { License, Outcome } from '../types/shared';
import {
  Inventory2 as ProductIcon,
  Lightbulb as SolutionIcon,
  People as CustomerIcon,
  Backup as BackupIcon,
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
  Rocket as ReleaseIcon,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  AdminPanelSettings as AdminIcon,
  People as UsersIcon,
  Security as RolesIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { AuthBar } from '../components/AuthBar';
import { useAuth } from '../components/AuthContext';
import { LoginPage } from '../components/LoginPage';
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

const TASKS_FOR_PRODUCT = gql`
  query TasksForProduct($productId: ID!) {
    tasks(productId: $productId) {
      edges {
        node {
          id
          name
          description
          estMinutes
          weight
          sequenceNumber
          licenseLevel
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
    }
  }
`;


const CUSTOMERS = gql`
  query Customers {
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
        adoptionPlan {
          id
        }
      }
      solutions {
        id
        name
        solution {
          id
          name
        }
        adoptionPlan {
          id
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
  mutation ReorderTasks($productId: ID, $solutionId: ID, $order: [ID!]!) {
    reorderTasks(productId: $productId, solutionId: $solutionId, order: $order)
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

const DELETE_SOLUTION = gql`
  mutation DeleteSolution($id: ID!) {
    deleteSolution(id: $id)
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
function SortableTaskItem({ task, onEdit, onDelete, onDoubleClick, onWeightChange, onSequenceChange }: any) {
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
    <>
      <TableRow
        ref={setNodeRef}
        style={style}
        hover
        onDoubleClick={() => onDoubleClick(task)}
        title={task.description || 'No description available'}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          }
        }}
      >
        {/* Drag handle */}
        <TableCell sx={{ width: 32, padding: '8px 4px', cursor: 'grab' }} {...attributes} {...listeners}>
          <DragIndicator sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
        </TableCell>

        {/* Sequence number - editable */}
        <TableCell sx={{ whiteSpace: 'nowrap', padding: '8px' }}>
          {task.sequenceNumber && (
            <input
              key={`seq-${task.id}-${task.sequenceNumber}`}
              type="number"
              defaultValue={task.sequenceNumber || 0}
              onBlur={(e) => {
                e.stopPropagation();
                const newSeq = parseInt(e.target.value) || 1;
                if (newSeq >= 1 && newSeq !== task.sequenceNumber) {
                  if (onSequenceChange) {
                    onSequenceChange(task.id, task.name, newSeq);
                  }
                } else {
                  e.target.value = task.sequenceNumber.toString();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  e.currentTarget.value = task.sequenceNumber.toString();
                  e.currentTarget.blur();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => {
                e.stopPropagation();
                e.target.select();
              }}
              step="1"
              min="1"
              className="sequence-input-spinner"
              style={{
                width: '50px',
                padding: '4px 6px',
                border: '1px solid #9c27b0',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: '#9c27b0',
                backgroundColor: 'transparent',
                cursor: 'text'
              }}
              title="Click to edit sequence (≥1), press Enter to save"
            />
          )}
        </TableCell>

        {/* Task name */}
        <TableCell sx={{ maxWidth: 400 }}>
          <Typography variant="body2" sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {task.name}
          </Typography>
        </TableCell>

        {/* Resources */}
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', justifyContent: 'center' }}>
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

        {/* Weight - editable */}
        <TableCell sx={{ whiteSpace: 'nowrap', padding: '8px' }}>
          <input
            key={`weight-${task.id}-${task.weight}`}
            type="number"
            defaultValue={task.weight || 0}
            onBlur={(e) => {
              e.stopPropagation();
              const newWeight = parseFloat(e.target.value) || 0;
              if (newWeight >= 0 && newWeight <= 100) {
                if (Math.abs(newWeight - task.weight) > 0.001) {
                  if (onWeightChange) {
                    onWeightChange(task.id, task.name, newWeight);
                  }
                }
              } else {
                e.target.value = task.weight.toString();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
              if (e.key === 'Escape') {
                e.currentTarget.value = task.weight.toString();
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
              width: '70px',
              padding: '4px 6px',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: '#1976d2',
              backgroundColor: 'transparent',
              cursor: 'text'
            }}
            title="Click to edit weight (0-100), press Enter to save"
          />
        </TableCell>

        {/* Telemetry */}
        <TableCell>
          {(() => {
            const totalAttributes = task.telemetryAttributes?.length || 0;
            const attributesWithCriteria = task.telemetryAttributes?.filter((attr: any) =>
              attr.successCriteria && attr.successCriteria !== null
            ).length || 0;

            if (totalAttributes === 0) {
              return <Typography variant="caption" color="text.secondary">-</Typography>;
            }

            return (
              <Tooltip
                title={
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Telemetry Attributes</Typography>
                    <Typography variant="caption" display="block">
                      {attributesWithCriteria} of {totalAttributes} attributes have success criteria configured
                    </Typography>
                  </Box>
                }
              >
                <Chip
                  label={`${attributesWithCriteria}/${totalAttributes}`}
                  size="small"
                  color={attributesWithCriteria === totalAttributes ? 'success' : attributesWithCriteria > 0 ? 'warning' : 'default'}
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Tooltip>
            );
          })()}
        </TableCell>

        {/* Actions */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

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
    </>
  );
}

const drawerWidth = 240;

export function App() {
  // Apollo client for mutations
  const client = useApolloClient();
  const { token, isAuthenticated, isLoading, user } = useAuth();

  // State management
  const [selectedSection, setSelectedSection] = useState<'products' | 'solutions' | 'customers' | 'admin'>('products');


  const [selectedCustomer, setSelectedCustomer] = useState('');



  const [selectedAdminSubSection, setSelectedAdminSubSection] = useState<'users' | 'roles' | 'backup' | 'theme'>('users');
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [solutionsExpanded, setSolutionsExpanded] = useState(true);
  const [customersExpanded, setCustomersExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem('lastSelectedCustomerId');
  });



  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detail'>('list');
  const [productDialogInitialTab, setProductDialogInitialTab] = useState<'general' | 'outcomes' | 'licenses' | 'releases' | 'customAttributes'>('general');
  const [editingRelease, setEditingRelease] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedSolution, setSelectedSolution] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [addCustomAttributeDialog, setAddCustomAttributeDialog] = useState(false);
  const [editCustomAttributeDialog, setEditCustomAttributeDialog] = useState(false);
  const [editingCustomAttribute, setEditingCustomAttribute] = useState<any>(null);
  // Dialog states
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [addSolutionDialog, setAddSolutionDialog] = useState(false);

  const [editProductDialog, setEditProductDialog] = useState(false);

  const [addLicenseDialog, setAddLicenseDialog] = useState(false);
  const [editLicenseDialog, setEditLicenseDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [addReleaseDialog, setAddReleaseDialog] = useState(false);
  const [editReleaseDialog, setEditReleaseDialog] = useState(false);
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '' });
  const [profileDialog, setProfileDialog] = useState(false);

  const [editingProduct, setEditingProduct] = useState<any>(null);



  // New dialog states for sub-sections


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
  const { data: tasksData, refetch: refetchTasks } = useQuery(TASKS_FOR_PRODUCT, {
    variables: { productId: selectedProduct },
    skip: !selectedProduct || !isAuthenticated
  });

  const tasks = tasksData?.tasks?.edges?.map((edge: any) => edge.node) || [];

  // GraphQL queries - MUST be called before any conditional returns
  const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery(PRODUCTS, {
    skip: !isAuthenticated,  // Skip if not authenticated
    errorPolicy: 'all',
    onError: (error) => {
      console.error('🚨 PRODUCTS Query Error:', error);
      console.error('🚨 Network Error:', error.networkError);
      console.error('🚨 GraphQL Errors:', error.graphQLErrors);
      if (error.networkError && (error.networkError as any).statusCode === 400) {
        console.error('🚨 400 ERROR - This suggests a GraphQL query format issue');
      }
    },
    // onCompleted: (data) => {
    //   console.log('✅ PRODUCTS Query Success:', data);
    // }
  });

  const products = productsData?.products?.edges?.map((edge: any) => {
    const node = edge.node;
    let normalizedCustomAttrs = {};
    if (node.customAttrs) {
      if (typeof node.customAttrs === 'string') {
        try {
          normalizedCustomAttrs = JSON.parse(node.customAttrs);
        } catch (e) {
          normalizedCustomAttrs = {};
        }
      } else {
        normalizedCustomAttrs = node.customAttrs;
      }
    }
    return {
      ...node,
      customAttrs: normalizedCustomAttrs
    };
  }) || [];
  const { data: solutionsData, loading: solutionsLoading, error: solutionsError, refetch: refetchSolutions } = useQuery(gql`
    query Solutions {
      solutions {
        id
        name
        description
        product {
          id
          name
        }
      }
    }
  `, {
    skip: !isAuthenticated
  });



  const { data: customersData, loading: customersLoading, error: customersError } = useQuery(CUSTOMERS, {
    skip: !isAuthenticated,  // Skip if not authenticated
    errorPolicy: 'all'
  });





  const { data: outcomesData } = useQuery(OUTCOMES, {
    variables: { productId: selectedProduct },
    skip: !selectedProduct || !isAuthenticated,
    errorPolicy: 'all'
  });

  // Extract data from GraphQL responses (for use in hooks)


  const customers = customersData?.customers || [];

  // Check if user has access to any resources (for menu visibility)
  // Role-based menu access:
  // - ADMIN: Full access to all menus
  // - SME: Access to Products and Solutions menus
  // - CSS/CS: Access to Customers menu only
  const isAdminUser = user?.isAdmin || user?.role === 'ADMIN';
  const userRoles = user?.roles || [];
  const isSME = userRoles.includes('SME');
  const isCSS = userRoles.includes('CSS') || userRoles.includes('CS');

  // Menu visibility based on roles (not data availability)
  const hasProducts = isAdminUser || isSME;
  const hasSolutions = isAdminUser || isSME;
  const hasCustomers = isAdminUser || isCSS;

  // Auto-select first product if none selected (MUST be before early returns)
  React.useEffect(() => {
    if (isAuthenticated && products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].id);
      localStorage.setItem('lastSelectedProductId', products[0].id);
    }
  }, [isAuthenticated, products, selectedProduct]);

  // Auto-select first customer when customers section is opened (MUST be before early returns)
  React.useEffect(() => {
    if (isAuthenticated && selectedSection === 'customers' && customers.length > 0 && !selectedCustomerId) {
      const lastCustomerId = localStorage.getItem('lastSelectedCustomerId');
      // Only auto-select if there's a saved customer ID
      // This allows the "Add Customer" button to work by clearing localStorage
      if (lastCustomerId) {
        // Check if last selected customer still exists
        const customerExists = customers.some((c: any) => c.id === lastCustomerId);
        if (customerExists) {
          setSelectedCustomerId(lastCustomerId);
        }
      }
    }
  }, [isAuthenticated, selectedSection, customers, selectedCustomerId]);

  // Persist customer selection to localStorage (MUST be before early returns)
  React.useEffect(() => {
    if (isAuthenticated && selectedCustomerId) {
      localStorage.setItem('lastSelectedCustomerId', selectedCustomerId);
    }
  }, [isAuthenticated, selectedCustomerId]);

  // Auto-redirect if user doesn't have access to current section (MUST be before early returns)
  React.useEffect(() => {
    if (!isAuthenticated) return;

    // Check if current section is accessible
    const sectionAccessible =
      (selectedSection === 'products' && hasProducts) ||
      (selectedSection === 'solutions' && hasSolutions) ||
      (selectedSection === 'customers' && hasCustomers) ||
      (selectedSection === 'admin' && user?.isAdmin);

    // If current section is not accessible, redirect to first available section
    if (!sectionAccessible) {
      if (hasProducts) {
        setSelectedSection('products');
      } else if (hasSolutions) {
        setSelectedSection('solutions');
      } else if (hasCustomers) {
        setSelectedSection('customers');
      } else if (user?.isAdmin) {
        setSelectedSection('admin');
      }
      // If no sections available, selectedSection will remain as is
      // (handled in main content rendering)
    }
  }, [isAuthenticated, selectedSection, hasProducts, hasSolutions, hasCustomers, user?.isAdmin]);

  // Memoized callbacks to prevent infinite loops (MUST be before early returns)


  const handleProductClickFromSolution = React.useCallback((productId: string) => {
    setSelectedSection('products');
    setSelectedProduct(productId);
    setViewMode('detail');
    localStorage.setItem('lastSelectedProductId', productId);
  }, []);

  // Authentication Guard - Show loading or login page (AFTER all hooks)
  if (isLoading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: 3,
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          mb: 3
        }}>
          <Dashboard sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Dynamic Adoption Plans
        </Typography>
        <LinearProgress sx={{ width: 200, mt: 2, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
          Verifying session...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Extract remaining data (products/solutions/customers extracted before auth guard)




  const outcomes = outcomesData?.outcomes || [];

  // Create handler objects for mutation operations
  const licenseHandlers = {
    createLicense: async (input: any, options?: any) => {
      try {
        await client.mutate({
          mutation: CREATE_LICENSE,
          variables: { input },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error creating license:', error);
        return { success: false, error };
      }
    },
    updateLicense: async (id: string, input: any, options?: any) => {
      try {
        await client.mutate({
          mutation: UPDATE_LICENSE,
          variables: { id, input },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error updating license:', error);
        return { success: false, error };
      }
    },
    deleteLicense: async (id: string, options?: any) => {
      try {
        await client.mutate({
          mutation: DELETE_LICENSE,
          variables: { id },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error deleting license:', error);
        return { success: false, error };
      }
    }
  };

  const releaseHandlers = {
    createRelease: async (input: any, options?: any) => {
      try {
        await client.mutate({
          mutation: CREATE_RELEASE,
          variables: { input },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error creating release:', error);
        return { success: false, error };
      }
    },
    updateRelease: async (id: string, input: any, options?: any) => {
      try {
        await client.mutate({
          mutation: UPDATE_RELEASE,
          variables: { id, input },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error updating release:', error);
        return { success: false, error };
      }
    }
  };

  const outcomeHandlers = {
    createOutcome: async (input: any, options?: any) => {
      try {
        const result = await client.mutate({
          mutation: gql`
            mutation CreateOutcome($input: OutcomeInput!) {
              createOutcome(input: $input) {
                id
                name
                description
              }
            }
          `,
          variables: { input },
          refetchQueries: ['Products', 'Outcomes'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true, data: result.data.createOutcome };
      } catch (error: any) {
        console.error('Error creating outcome:', error);
        return { success: false, error };
      }
    },
    updateOutcome: async (id: string, input: any, options?: any) => {
      try {
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
          variables: { id, input },
          refetchQueries: ['Products', 'Outcomes'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error updating outcome:', error);
        return { success: false, error };
      }
    },
    deleteOutcome: async (id: string, options?: any) => {
      try {
        await client.mutate({
          mutation: gql`
            mutation DeleteOutcome($id: ID!) {
              deleteOutcome(id: $id)
            }
          `,
          variables: { id },
          refetchQueries: ['Products', 'Outcomes'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error deleting outcome:', error);
        return { success: false, error };
      }
    }
  };

  const productHandlers = {
    createProduct: async (input: any, options?: any) => {
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
          variables: { input },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true, data: result.data.createProduct };
      } catch (error: any) {
        console.error('Error creating product:', error);
        return { success: false, error };
      }
    },
    updateProduct: async (id: string, input: any, options?: any) => {
      try {
        await client.mutate({
          mutation: UPDATE_PRODUCT,
          variables: { id, input },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error updating product:', error);
        return { success: false, error };
      }
    },
    updateProductWithDetails: async (id: string, data: any, options?: any) => {
      console.log('=== updateProductWithDetails called ===');
      console.log('Product ID:', id);
      console.log('Data:', JSON.stringify(data, null, 2));

      try {
        // Update the product basic info
        console.log('Updating product basic info...');
        await client.mutate({
          mutation: UPDATE_PRODUCT,
          variables: {
            id,
            input: {
              name: data.name,
              description: data.description,
              customAttrs: data.customAttrs || {}
            }
          },
          refetchQueries: ['Products'],
          awaitRefetchQueries: true
        });
        console.log('Product basic info updated');

        // Handle licenses
        if (data.licenses && data.licenses.length > 0) {
          console.log('Processing licenses:', data.licenses.length);
          for (const license of data.licenses) {
            try {
              if (license.delete && license.id) {
                console.log(`Deleting license: ${license.name}`);
                await client.mutate({
                  mutation: DELETE_LICENSE,
                  variables: { id: license.id },
                  refetchQueries: ['Products'],
                  awaitRefetchQueries: true
                });
              } else if (license.isNew || !license.id) {
                console.log(`Creating license: ${license.name}`);
                await client.mutate({
                  mutation: CREATE_LICENSE,
                  variables: {
                    input: {
                      name: license.name,
                      description: license.description || '',
                      level: parseInt(license.level) || 1,
                      isActive: license.isActive !== false,
                      productId: id
                    }
                  },
                  refetchQueries: ['Products'],
                  awaitRefetchQueries: true
                });
              } else if (license.id) {
                console.log(`Updating license: ${license.name}`);
                await client.mutate({
                  mutation: UPDATE_LICENSE,
                  variables: {
                    id: license.id,
                    input: {
                      name: license.name,
                      description: license.description || '',
                      level: parseInt(license.level) || 1,
                      isActive: license.isActive !== false,
                      productId: id
                    }
                  },
                  refetchQueries: ['Products'],
                  awaitRefetchQueries: true
                });
              }
            } catch (licenseError: any) {
              console.error(`Failed to save license ${license.name}:`, licenseError);
              throw new Error(`Failed to save license "${license.name}": ${licenseError.message}`);
            }
          }
        }

        // Handle outcomes
        if (data.outcomes && data.outcomes.length > 0) {
          console.log('Processing outcomes:', data.outcomes.length);
          for (const outcome of data.outcomes) {
            try {
              if (outcome.delete && outcome.id) {
                console.log(`Deleting outcome: ${outcome.name}`);
                await client.mutate({
                  mutation: gql`mutation DeleteOutcome($id: ID!) { deleteOutcome(id: $id) }`,
                  variables: { id: outcome.id },
                  refetchQueries: ['Products', 'Outcomes'],
                  awaitRefetchQueries: true
                });
              } else if (outcome.isNew || !outcome.id) {
                console.log(`Creating outcome: ${outcome.name}`);
                await client.mutate({
                  mutation: gql`
                    mutation CreateOutcome($input: OutcomeInput!) {
                      createOutcome(input: $input) { id name description }
                    }
                  `,
                  variables: {
                    input: {
                      name: outcome.name,
                      description: outcome.description || '',
                      productId: id
                    }
                  },
                  refetchQueries: ['Products', 'Outcomes'],
                  awaitRefetchQueries: true
                });
              } else if (outcome.id) {
                console.log(`Updating outcome: ${outcome.name}`);
                await client.mutate({
                  mutation: gql`
                    mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
                      updateOutcome(id: $id, input: $input) { id name description }
                    }
                  `,
                  variables: {
                    id: outcome.id,
                    input: {
                      name: outcome.name,
                      description: outcome.description || '',
                      productId: id
                    }
                  },
                  refetchQueries: ['Products', 'Outcomes'],
                  awaitRefetchQueries: true
                });
              }
            } catch (outcomeError: any) {
              console.error(`Failed to save outcome ${outcome.name}:`, outcomeError);
              throw new Error(`Failed to save outcome "${outcome.name}": ${outcomeError.message}`);
            }
          }
        }

        // Handle releases
        if (data.releases && data.releases.length > 0) {
          console.log('Processing releases:', data.releases.length);
          for (const release of data.releases) {
            try {
              if (release.delete && release.id) {
                console.log(`Deleting release: ${release.name}`);
                await client.mutate({
                  mutation: DELETE_RELEASE,
                  variables: { id: release.id },
                  refetchQueries: ['Products'],
                  awaitRefetchQueries: true
                });
              } else if (release.isNew || !release.id) {
                console.log(`Creating release: ${release.name}`);
                await client.mutate({
                  mutation: CREATE_RELEASE,
                  variables: {
                    input: {
                      name: release.name,
                      description: release.description || '',
                      level: Number(release.level) || 1.0,
                      productId: id
                    }
                  },
                  refetchQueries: ['Products'],
                  awaitRefetchQueries: true
                });
              } else if (release.id) {
                console.log(`Updating release: ${release.name}`);
                await client.mutate({
                  mutation: UPDATE_RELEASE,
                  variables: {
                    id: release.id,
                    input: {
                      name: release.name,
                      description: release.description || '',
                      level: Number(release.level) || 1.0,
                      productId: id
                    }
                  },
                  refetchQueries: ['Products'],
                  awaitRefetchQueries: true
                });
              }
            } catch (releaseError: any) {
              console.error(`Failed to save release ${release.name}:`, releaseError);
              throw new Error(`Failed to save release "${release.name}": ${releaseError.message}`);
            }
          }
        }

        console.log('=== All product updates completed successfully ===');
        if (options?.refetchProducts) await options.refetchProducts();
        return { success: true };
      } catch (error: any) {
        console.error('Error updating product:', error);
        return { success: false, error };
      }
    }
  };

  // Debug logging - uncomment for troubleshooting
  // console.log('App Component Loaded!');
  // console.log('App authentication status:', {
  //   isAuthenticated,
  //   token: token ? 'Token present' : 'No token',
  //   tokenLength: token?.length || 0
  // });
  // console.log('App Data Debug:', {
  //   productsCount: products.length,
  //   solutionsCount: solutions.length,
  //   customersCount: customers.length,
  //   tasksCount: tasks.length,
  //   outcomesCount: outcomes.length,
  //   selectedProduct,
  //   selectedSection,
  //   viewMode,
  //   productsLoading,
  //   tasksLoading,
  //   productsError: productsError?.message,
  //   tasksError: tasksError?.message,
  //   products: products.slice(0, 2),
  //   tasks: tasks.slice(0, 2),
  //   outcomes: outcomes.slice(0, 2)
  // });

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


  // Navigation handlers
  const handleSectionChange = (section: 'products' | 'solutions' | 'customers') => {
    setSelectedSection(section);
    setSelectedSolution('');
    setSelectedCustomer('');
    setSelectedTask('');


  };





  // Helper function to calculate total weight of tasks for a product



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

      // console.log('Product created successfully');
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

      // console.log('Product created successfully:', result.data.createProduct);
      setNewProduct({ name: '', description: '' });
      setAddProductDialog(false);

      await refetchProducts();
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert('Failed to add product: ' + (error?.message || 'Unknown error'));
    }
  };
  const handleAddCustomAttributeSave = async (attribute: any) => {
    if (!selectedProduct) return;
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;
    const newAttrs = { ...product.customAttrs, [attribute.key]: attribute.value };
    try {
      await client.mutate({
        mutation: UPDATE_PRODUCT,
        variables: { id: selectedProduct, input: { name: product.name, description: product.description, customAttrs: newAttrs } }
      });
      setAddCustomAttributeDialog(false);
      await refetchProducts();
    } catch (error) {
      console.error('Error adding custom attribute:', error);
      alert('Failed to add custom attribute');
    }
  };

  const handleEditCustomAttributeSave = async (attribute: any) => {
    if (!selectedProduct) return;
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;
    const newAttrs = { ...product.customAttrs };
    if (editingCustomAttribute && editingCustomAttribute.key !== attribute.key) {
      delete newAttrs[editingCustomAttribute.key];
    }
    newAttrs[attribute.key] = attribute.value;
    try {
      await client.mutate({
        mutation: UPDATE_PRODUCT,
        variables: { id: selectedProduct, input: { name: product.name, description: product.description, customAttrs: newAttrs } }
      });
      setEditCustomAttributeDialog(false);
      setEditingCustomAttribute(null);
      await refetchProducts();
    } catch (error) {
      console.error('Error editing custom attribute:', error);
      alert('Failed to edit custom attribute');
    }
  };



  // Custom Attributes export/import handlers (JSON format)

  const handleUpdateProduct = async (data: any) => {
    if (!editingProduct) return;
    try {
      await client.mutate({
        mutation: UPDATE_PRODUCT,
        variables: {
          id: editingProduct.id,
          input: {
            name: data.name,
            description: data.description,
            customAttrs: data.customAttrs
          }
        }
      });
      setEditProductDialog(false);
      setEditingProduct(null);
      await refetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AuthBar
        onMenuClick={() => setDrawerOpen(!drawerOpen)}
        drawerOpen={drawerOpen}
        onProfileClick={() => setProfileDialog(true)}
      />
      <Toolbar />

      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
          overflowX: 'hidden',
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : 0,
            boxSizing: 'border-box',
            transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
            overflowX: 'hidden',
            borderRight: drawerOpen ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {/* Products Section - Only show if user has access to at least one product */}
            {hasProducts && (
              <>
                <ListItemButton
                  selected={selectedSection === 'products'}
                  onClick={() => {
                    setSelectedSection('products');
                    setProductsExpanded(true); // Always expand when clicked
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(4, 159, 217, 0.08)',
                      '& .MuiListItemIcon-root': {
                        color: '#049FD9'
                      },
                      '& .MuiListItemText-primary': {
                        color: '#049FD9',
                        fontWeight: 600
                      }
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'rgba(4, 159, 217, 0.12)'
                    }
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
                    {/* Add Product Button */}
                    <ListItemButton
                      sx={{
                        pl: 4,
                        backgroundColor: 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        }
                      }}
                      onClick={() => setAddProductDialog(true)}
                    >
                      <ListItemIcon>
                        <Add />
                      </ListItemIcon>
                      <ListItemText
                        primary="Add Product"
                        primaryTypographyProps={{
                          fontWeight: 'medium',
                          color: 'primary.main'
                        }}
                      />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {/* Solutions Section - Only show if user has access to at least one solution */}
            {hasSolutions && (
              <>
                <ListItemButton
                  selected={selectedSection === 'solutions'}
                  onClick={() => {
                    setSelectedSection('solutions');
                    setSolutionsExpanded(true); // Always expand when clicked
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(4, 159, 217, 0.08)',
                      '& .MuiListItemIcon-root': {
                        color: '#049FD9'
                      },
                      '& .MuiListItemText-primary': {
                        color: '#049FD9',
                        fontWeight: 600
                      }
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'rgba(4, 159, 217, 0.12)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <SolutionIcon />
                  </ListItemIcon>
                  <ListItemText primary="Solutions" />
                  {solutionsExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={solutionsExpanded && selectedSection === 'solutions'} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {/* Add Solution Button */}
                    <ListItemButton
                      sx={{
                        pl: 4,
                        backgroundColor: 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        }
                      }}
                      onClick={() => setAddSolutionDialog(true)}
                    >
                      <ListItemIcon>
                        <Add />
                      </ListItemIcon>
                      <ListItemText
                        primary="Add Solution"
                        primaryTypographyProps={{
                          fontWeight: 'medium',
                          color: 'primary.main'
                        }}
                      />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {/* Customers Section - Only show if user has access to at least one customer */}
            {hasCustomers && (
              <>
                <ListItemButton
                  selected={selectedSection === 'customers'}
                  onClick={() => {
                    setSelectedSection('customers');
                    setCustomersExpanded(true); // Always expand when clicked
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(4, 159, 217, 0.08)',
                      '& .MuiListItemIcon-root': {
                        color: '#049FD9'
                      },
                      '& .MuiListItemText-primary': {
                        color: '#049FD9',
                        fontWeight: 600
                      }
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'rgba(4, 159, 217, 0.12)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <CustomerIcon />
                  </ListItemIcon>
                  <ListItemText primary="Customers" />
                  {customersExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={customersExpanded && selectedSection === 'customers'} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {/* Add Customer Button */}
                    <ListItemButton
                      sx={{
                        pl: 4,
                        backgroundColor: 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        }
                      }}
                      onClick={() => {
                        // Clear localStorage to prevent auto-selection
                        localStorage.removeItem('lastSelectedCustomerId');
                        setSelectedCustomerId(null);
                        setSelectedSection('customers');
                        // Open the add customer dialog directly
                        setTimeout(() => {
                          if ((window as any).__openAddCustomerDialog) {
                            (window as any).__openAddCustomerDialog();
                          }
                        }, 100);
                      }}
                    >
                      <ListItemIcon>
                        <Add />
                      </ListItemIcon>
                      <ListItemText
                        primary="Add Customer"
                        primaryTypographyProps={{
                          fontWeight: 'medium',
                          color: 'primary.main'
                        }}
                      />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {/* Admin Section (Admin Only) - Expandable with Submenus */}
            {user?.isAdmin && (
              <>
                <ListItemButton
                  selected={selectedSection === 'admin'}
                  onClick={() => {
                    setSelectedSection('admin');
                    setAdminExpanded(!adminExpanded);
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(4, 159, 217, 0.08)',
                      '& .MuiListItemIcon-root': {
                        color: '#049FD9'
                      },
                      '& .MuiListItemText-primary': {
                        color: '#049FD9',
                        fontWeight: 600
                      }
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'rgba(4, 159, 217, 0.12)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <AdminIcon />
                  </ListItemIcon>
                  <ListItemText primary="Admin" />
                  {adminExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={adminExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton
                      sx={{
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(4, 159, 217, 0.08)',
                          '& .MuiListItemIcon-root': {
                            color: '#049FD9'
                          },
                          '& .MuiListItemText-primary': {
                            color: '#049FD9',
                            fontWeight: 600
                          }
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'rgba(4, 159, 217, 0.12)'
                        }
                      }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'users'}
                      onClick={() => {
                        setSelectedSection('admin');
                        setSelectedAdminSubSection('users');
                      }}
                    >
                      <ListItemIcon>
                        <UsersIcon />
                      </ListItemIcon>
                      <ListItemText primary="Users" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(4, 159, 217, 0.08)',
                          '& .MuiListItemIcon-root': {
                            color: '#049FD9'
                          },
                          '& .MuiListItemText-primary': {
                            color: '#049FD9',
                            fontWeight: 600
                          }
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'rgba(4, 159, 217, 0.12)'
                        }
                      }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'roles'}
                      onClick={() => {
                        setSelectedSection('admin');
                        setSelectedAdminSubSection('roles');
                      }}
                    >
                      <ListItemIcon>
                        <RolesIcon />
                      </ListItemIcon>
                      <ListItemText primary="Roles" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(4, 159, 217, 0.08)',
                          '& .MuiListItemIcon-root': {
                            color: '#049FD9'
                          },
                          '& .MuiListItemText-primary': {
                            color: '#049FD9',
                            fontWeight: 600
                          }
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'rgba(4, 159, 217, 0.12)'
                        }
                      }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'backup'}
                      onClick={() => {
                        setSelectedSection('admin');
                        setSelectedAdminSubSection('backup');
                      }}
                    >
                      <ListItemIcon>
                        <BackupIcon />
                      </ListItemIcon>
                      <ListItemText primary="Backup & Restore" />
                    </ListItemButton>
                    <ListItemButton
                      sx={{
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(4, 159, 217, 0.08)',
                          '& .MuiListItemIcon-root': {
                            color: '#049FD9'
                          },
                          '& .MuiListItemText-primary': {
                            color: '#049FD9',
                            fontWeight: 600
                          }
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'rgba(4, 159, 217, 0.12)'
                        }
                      }}
                      selected={selectedSection === 'admin' && selectedAdminSubSection === 'theme'}
                      onClick={() => {
                        setSelectedSection('admin');
                        setSelectedAdminSubSection('theme');
                      }}
                    >
                      <ListItemIcon>
                        <PaletteIcon />
                      </ListItemIcon>
                      <ListItemText primary="Theme" />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}
          </List>
          <Divider />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          transition: 'margin 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
          width: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
        }}
      >
        {/* Main List View */}
        {viewMode === 'list' && (
          <>
            {/* Products Section */}
            {
              selectedSection === 'products' && (
                <ProductsPage
                  onEditProduct={(product) => {
                    setEditingProduct({ ...product });
                    setEditProductDialog(true);
                  }}
                />
              )
            }

            {/* Solutions Section */}
            {selectedSection === 'solutions' && (
              <SolutionsPage />
            )}

            {/* Customers Section */}
            {selectedSection === 'customers' && <CustomersPage />}

            {/* Admin Section (Admin Only) */}
            {selectedSection === 'admin' && user?.isAdmin && (
              <>
                {selectedAdminSubSection === 'users' && <UserManagement />}
                {selectedAdminSubSection === 'roles' && <RoleManagement />}
                {selectedAdminSubSection === 'backup' && <BackupManagementPanel />}
                {selectedAdminSubSection === 'theme' && <ThemeSelector />}
              </>
            )}

            {/* No Access Message - Show when user has no access to any section */}
            {!hasProducts && !hasSolutions && !hasCustomers && !user?.isAdmin && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '60vh',
                  textAlign: 'center',
                  px: 3
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    maxWidth: 600,
                    borderRadius: 2
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      bgcolor: 'error.light',
                      color: 'white',
                      mb: 3,
                      mx: 'auto'
                    }}
                  >
                    <Dashboard sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    No Access
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    You currently don't have access to any resources in this application.
                    Please contact your administrator to request access to products, solutions, or customers.
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    User: <strong>{user?.username || 'Unknown'}</strong>
                  </Typography>
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

            {/* Add Solution Dialog */}
            <SolutionDialog
              open={addSolutionDialog}
              onClose={() => setAddSolutionDialog(false)}
              onSave={() => {
                refetchSolutions();
                setAddSolutionDialog(false);
              }}
              solution={null}
              allProducts={products}
              initialTab="general"
            />




            {/* Edit Product Dialog */}
            <ProductDialog
              open={editProductDialog}
              onClose={() => {
                setEditProductDialog(false);
                setProductDialogInitialTab('general');
              }}
              onSave={handleUpdateProduct}
              product={editingProduct}
              title="Edit Product"
              availableReleases={editingProduct?.releases || []}
              initialTab={productDialogInitialTab}
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

        {/* User Profile Dialog */}
        <UserProfileDialog
          open={profileDialog}
          onClose={() => setProfileDialog(false)}
        />
      </Box>
    </Box>
  );

}
export default App;