import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Divider,
  Stack,
  FormLabel,
  RadioGroup,
  Radio,
  Autocomplete,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as AssignIcon,
  Close as CloseIcon
} from '@shared/components/FAIcon';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL Queries
const GET_ROLES = gql`
  query Roles {
    roles {
      id
      name
      description
      userCount
      users {
        id
        username
        fullName
        email
      }
      permissions {
        id
        resourceType
        resourceId
        resourceName
        permissionLevel
      }
    }
  }
`;

const GET_ROLE = gql`
  query Role($id: ID!) {
    role(id: $id) {
      id
      name
      description
      userCount
      permissions {
        id
        resourceType
        resourceId
        permissionLevel
      }
    }
  }
`;

const GET_USERS = gql`
  query Users {
    users {
      id
      username
      fullName
      email
    }
  }
`;

const GET_USER_ROLES = gql`
  query UserRoles($userId: ID!) {
    userRoles(userId: $userId) {
      id
      name
      description
      permissions {
        id
        resourceType
        resourceId
        permissionLevel
      }
    }
  }
`;

const GET_AVAILABLE_RESOURCES = gql`
  query AvailableResources($resourceType: String) {
    availableResources(resourceType: $resourceType) {
      id
      name
      type
    }
  }
`;

// GraphQL Mutations
const CREATE_ROLE = gql`
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
      description
      permissions {
        id
        resourceType
        resourceId
        permissionLevel
      }
    }
  }
`;

const UPDATE_ROLE = gql`
  mutation UpdateRole($roleId: ID!, $input: UpdateRoleInput!) {
    updateRole(roleId: $roleId, input: $input) {
      id
      name
      description
      permissions {
        id
        resourceType
        resourceId
        permissionLevel
      }
    }
  }
`;

const DELETE_ROLE = gql`
  mutation DeleteRole($roleId: ID!) {
    deleteRole(roleId: $roleId)
  }
`;

const ASSIGN_ROLE_TO_USER = gql`
  mutation AssignRoleToUser($userId: ID!, $roleId: ID!) {
    assignRoleToUser(userId: $userId, roleId: $roleId)
  }
`;

const REMOVE_ROLE_FROM_USER = gql`
  mutation RemoveRoleFromUser($userId: ID!, $roleId: ID!) {
    removeRoleFromUser(userId: $userId, roleId: $roleId)
  }
`;

interface Role {
  id: string;
  name: string;
  description: string | null;
  userCount?: number;
  users?: User[];
  permissions: RolePermission[];
}

interface RolePermission {
  id: string;
  resourceType: string;
  resourceId: string | null;
  resourceName?: string | null;
  permissionLevel: string;
}

interface User {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: {
    resourceType: string;
    resourceId: string | null;
    permissionLevel: string;
  }[];
}

interface PermissionBuilder {
  products: {
    mode: 'none' | 'all' | 'specific';
    selectedIds: string[];
    permissionLevel: string; // For 'all' mode
    specificPermissions: { [resourceId: string]: string }; // For 'specific' mode - per-resource levels
  };
  solutions: {
    mode: 'none' | 'all' | 'specific';
    selectedIds: string[];
    permissionLevel: string; // For 'all' mode
    specificPermissions: { [resourceId: string]: string }; // For 'specific' mode - per-resource levels
  };
  customers: {
    mode: 'none' | 'all' | 'specific';
    selectedIds: string[];
    permissionLevel: string; // For 'all' mode
    specificPermissions: { [resourceId: string]: string }; // For 'specific' mode - per-resource levels
  };
}

export const RoleManagement: React.FC = () => {
  const [roleDialog, setRoleDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: []
  });
  const [permissionBuilder, setPermissionBuilder] = useState<PermissionBuilder>({
    products: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} },
    solutions: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} },
    customers: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} }
  });
  const [permissionTab, setPermissionTab] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Queries
  const { data: rolesData, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useQuery(GET_ROLES);
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);
  const { data: userRolesData, refetch: refetchUserRoles } = useQuery(GET_USER_ROLES, {
    variables: { userId: selectedUserId },
    skip: !selectedUserId
  });
  const { data: resourcesData } = useQuery(GET_AVAILABLE_RESOURCES);

  // Mutations
  const [createRole, { loading: creating }] = useMutation(CREATE_ROLE, {
    // Don't use onCompleted here - we'll handle it manually to ensure proper timing
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [updateRole, { loading: updating }] = useMutation(UPDATE_ROLE, {
    // Don't use onCompleted here - we'll handle it manually after user assignment sync
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [deleteRole, { loading: deleting }] = useMutation(DELETE_ROLE, {
    onCompleted: () => {
      setSuccessMsg('Role deleted successfully!');
      setDeleteDialog(false);
      setDeletingRole(null);
      refetchRoles();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [assignRoleToUser, { loading: assigning }] = useMutation(ASSIGN_ROLE_TO_USER, {
    onCompleted: () => {
      setSuccessMsg('Role assigned successfully!');
      refetchRoles();
      refetchUserRoles();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [removeRoleFromUser] = useMutation(REMOVE_ROLE_FROM_USER, {
    onCompleted: () => {
      setSuccessMsg('Role removed successfully!');
      refetchRoles();
      refetchUserRoles();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  // Load assigned users when editing role
  React.useEffect(() => {
    if (editingRole && editingRole.users) {
      setSelectedUsers(editingRole.users.map((u: any) => u.id));
    } else {
      setSelectedUsers([]);
    }
  }, [editingRole]);

  const handleAddRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setPermissionBuilder({
      products: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} },
      solutions: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} },
      customers: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} }
    });
    setSelectedUsers([]);
    setPermissionTab(0);
    setRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions.map(p => ({
        resourceType: p.resourceType,
        resourceId: p.resourceId,
        permissionLevel: p.permissionLevel
      }))
    });

    // Convert permissions to permission builder format
    const builder: PermissionBuilder = {
      products: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} },
      solutions: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} },
      customers: { mode: 'none', selectedIds: [], permissionLevel: 'READ', specificPermissions: {} }
    };

    role.permissions.forEach(p => {
      const key = p.resourceType.toLowerCase() + 's' as keyof PermissionBuilder;
      if (p.resourceId === null) {
        // All resources mode
        builder[key].mode = 'all';
        builder[key].permissionLevel = p.permissionLevel;
      } else {
        // Specific resources mode
        builder[key].mode = 'specific';
        if (!builder[key].selectedIds.includes(p.resourceId)) {
          builder[key].selectedIds.push(p.resourceId);
        }
        // Store per-resource permission level
        builder[key].specificPermissions[p.resourceId] = p.permissionLevel;
      }
    });

    setPermissionBuilder(builder);
    setPermissionTab(0);
    setRoleDialog(true);
  };

  const handleDeleteRole = (role: Role) => {
    setDeletingRole(role);
    setDeleteDialog(true);
  };

  const handleAssignRole = (role: Role) => {
    setAssigningRole(role);
    setSelectedUserId('');
    setAssignDialog(true);
  };

  const buildPermissionsFromBuilder = (): any[] => {
    const permissions: any[] = [];

    // Products
    if (permissionBuilder.products.mode === 'all') {
      permissions.push({
        resourceType: 'PRODUCT',
        resourceId: null,
        permissionLevel: permissionBuilder.products.permissionLevel
      });
    } else if (permissionBuilder.products.mode === 'specific') {
      permissionBuilder.products.selectedIds.forEach(id => {
        permissions.push({
          resourceType: 'PRODUCT',
          resourceId: id,
          permissionLevel: permissionBuilder.products.specificPermissions[id] || 'READ'
        });
      });
    }
    // If mode is 'none', add no permissions (user won't see any products)

    // Solutions
    if (permissionBuilder.solutions.mode === 'all') {
      permissions.push({
        resourceType: 'SOLUTION',
        resourceId: null,
        permissionLevel: permissionBuilder.solutions.permissionLevel
      });
    } else if (permissionBuilder.solutions.mode === 'specific') {
      permissionBuilder.solutions.selectedIds.forEach(id => {
        permissions.push({
          resourceType: 'SOLUTION',
          resourceId: id,
          permissionLevel: permissionBuilder.solutions.specificPermissions[id] || 'READ'
        });
      });
    }
    // If mode is 'none', add no permissions (user won't see any solutions)

    // Customers
    if (permissionBuilder.customers.mode === 'all') {
      permissions.push({
        resourceType: 'CUSTOMER',
        resourceId: null,
        permissionLevel: permissionBuilder.customers.permissionLevel
      });
    } else if (permissionBuilder.customers.mode === 'specific') {
      permissionBuilder.customers.selectedIds.forEach(id => {
        permissions.push({
          resourceType: 'CUSTOMER',
          resourceId: id,
          permissionLevel: permissionBuilder.customers.specificPermissions[id] || 'READ'
        });
      });
    }
    // If mode is 'none', add no permissions (user won't see any customers)

    return permissions;
  };

  // Calculate effective permissions with bidirectional flow
  const getEffectivePermissions = () => {
    const hierarchy: { [key: string]: number } = { READ: 1, WRITE: 2, ADMIN: 3 };
    
    const hasAllProducts = permissionBuilder.products.mode === 'all';
    const hasAllSolutions = permissionBuilder.solutions.mode === 'all';
    const hasSpecificProducts = permissionBuilder.products.mode === 'specific' && permissionBuilder.products.selectedIds.length > 0;
    const hasSpecificSolutions = permissionBuilder.solutions.mode === 'specific' && permissionBuilder.solutions.selectedIds.length > 0;
    
    const productLevel = permissionBuilder.products.permissionLevel;
    const solutionLevel = permissionBuilder.solutions.permissionLevel;
    
    const result: {
      products: { level: string; source: 'explicit' | 'inherited'; note?: string };
      solutions: { level: string; source: 'explicit' | 'inherited'; note?: string };
      specificProducts?: { count: number; level: string };
      specificSolutions?: { count: number; level: string; names?: string[] };
    } = {
      products: { level: 'NONE', source: 'explicit' },
      solutions: { level: 'NONE', source: 'explicit' }
    };
    
    // Calculate effective product permissions
    if (hasAllProducts) {
      result.products = { level: productLevel, source: 'explicit' };
      
      // If specific solutions have higher permissions, products in those solutions get elevated
      if (hasSpecificSolutions && hierarchy[solutionLevel] > hierarchy[productLevel]) {
        result.specificSolutions = { 
          count: permissionBuilder.solutions.selectedIds.length, 
          level: solutionLevel,
          names: permissionBuilder.solutions.selectedIds.map(id => solutions.find((s: Resource) => s.id === id)?.name || id)
        };
        result.products.note = `Except products in ${permissionBuilder.solutions.selectedIds.length} solution(s) which get ${solutionLevel}`;
      }
    } else if (hasAllSolutions) {
      // Inherited from all solutions
      result.products = { level: solutionLevel, source: 'inherited', note: 'From all-solutions permission' };
    } else if (hasSpecificProducts) {
      result.specificProducts = { count: permissionBuilder.products.selectedIds.length, level: productLevel };
    }
    
    // Calculate effective solution permissions
    if (hasAllSolutions) {
      result.solutions = { level: solutionLevel, source: 'explicit' };
      
      // Check if product permission overrides
      if (hasAllProducts && hierarchy[productLevel] > hierarchy[solutionLevel]) {
        result.solutions = { level: productLevel, source: 'inherited', note: `Elevated from all-products ${productLevel}` };
      }
    } else if (hasAllProducts) {
      // Inherited from all products
      if (hasSpecificSolutions) {
        result.solutions = { level: productLevel, source: 'inherited', note: 'Other solutions inherit from all-products' };
        result.specificSolutions = { 
          count: permissionBuilder.solutions.selectedIds.length, 
          level: solutionLevel,
          names: permissionBuilder.solutions.selectedIds.map(id => solutions.find((s: Resource) => s.id === id)?.name || id)
        };
      } else {
        result.solutions = { level: productLevel, source: 'inherited', note: 'From all-products permission' };
      }
    } else if (hasSpecificSolutions) {
      result.specificSolutions = { 
        count: permissionBuilder.solutions.selectedIds.length, 
        level: solutionLevel,
        names: permissionBuilder.solutions.selectedIds.map(id => solutions.find((s: Resource) => s.id === id)?.name || id)
      };
    }
    
    return result;
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    
    // Validation
    if (!formData.name.trim()) {
      setErrorMsg('Role name is required');
      return;
    }

    const permissions = buildPermissionsFromBuilder();
    
    // Note: It's OK to have zero permissions (role with no access)
    // But if you want to enforce at least one permission, uncomment:
    // if (permissions.length === 0) {
    //   setErrorMsg('Please define at least one permission for this role.');
    //   return;
    // }
    
    console.log('Built permissions:', permissions);

    if (editingRole) {
      // Update role
      try {
        console.log('Updating role with permissions:', permissions);
        await updateRole({
          variables: {
            roleId: editingRole.id,
            input: {
              name: formData.name,
              description: formData.description || null,
              permissions
            }
          }
        });

        // Sync user assignments: Get current users with this role
        const currentUsers = editingRole.users?.map((u: any) => u.id) || [];
        const usersToAdd = selectedUsers.filter((userId: string) => !currentUsers.includes(userId));
        const usersToRemove = currentUsers.filter((userId: string) => !selectedUsers.includes(userId));

        // Add new users to role
        for (const userId of usersToAdd) {
          await assignRoleToUser({
            variables: {
              userId,
              roleId: editingRole.id
            }
          });
        }

        // Remove unselected users from role
        for (const userId of usersToRemove) {
          await removeRoleFromUser({
            variables: {
              userId,
              roleId: editingRole.id
            }
          });
        }

        // Refetch roles to update the UI
        await refetchRoles();
        
        // Close dialog and show success message
        setRoleDialog(false);
        setSuccessMsg('Role and user assignments updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        console.error('Error updating role:', err);
        setErrorMsg(err.message || 'Failed to update role');
        setTimeout(() => setErrorMsg(''), 5000);
        // Keep dialog open so user can see the error and fix it
      }
    } else {
      // Create role
      try {
        console.log('Creating role with permissions:', permissions);
        const result = await createRole({
          variables: {
            input: {
              name: formData.name,
              description: formData.description || null,
              permissions
            }
          }
        });
        console.log('Role created successfully:', result);
        
        // Refetch roles to update the UI
        await refetchRoles();
        
        // Close dialog and show success message
        setRoleDialog(false);
        setSuccessMsg('Role created successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        console.error('Error creating role:', err);
        setErrorMsg(err.message || 'Failed to create role');
        setTimeout(() => setErrorMsg(''), 5000);
        // Keep dialog open so user can see the error and fix it
      }
    }
  };

  const handleConfirmDelete = () => {
    if (deletingRole) {
      deleteRole({ variables: { roleId: deletingRole.id } });
    }
  };

  const handleAssignRoleToUser = () => {
    if (!selectedUserId || !assigningRole) {
      setErrorMsg('Please select a user');
      return;
    }

    assignRoleToUser({
      variables: {
        userId: selectedUserId,
        roleId: assigningRole.id
      }
    });
  };

  const handleRemoveRoleFromUser = (userId: string, roleId: string) => {
    removeRoleFromUser({
      variables: {
        userId,
        roleId
      }
    });
  };

  const handleResourceToggle = (resourceType: 'products' | 'solutions' | 'customers', resourceId: string) => {
    setPermissionBuilder(prev => {
      const updated = { ...prev };
      const section = updated[resourceType];
      const index = section.selectedIds.indexOf(resourceId);
      
      if (index > -1) {
        section.selectedIds = section.selectedIds.filter(id => id !== resourceId);
      } else {
        section.selectedIds = [...section.selectedIds, resourceId];
      }
      
      return updated;
    });
  };

  const getPermissionSummary = (permissions: RolePermission[]): React.ReactNode => {
    if (permissions.length === 0) return 'No permissions';
    
    const byType: { [key: string]: RolePermission[] } = {};
    
    permissions.forEach(p => {
      if (!byType[p.resourceType]) byType[p.resourceType] = [];
      byType[p.resourceType].push(p);
    });
    
    const productPerms = byType['PRODUCT'] || [];
    const solutionPerms = byType['SOLUTION'] || [];
    const customerPerms = byType['CUSTOMER'] || [];
    
    const allProducts = productPerms.find(p => p.resourceId === null);
    const allSolutions = solutionPerms.find(p => p.resourceId === null);
    const allCustomers = customerPerms.find(p => p.resourceId === null);
    
    const specificProducts = productPerms.filter(p => p.resourceId !== null);
    const specificSolutions = solutionPerms.filter(p => p.resourceId !== null);
    
    const summary: React.ReactNode[] = [];
    const hierarchy: { [key: string]: number } = { READ: 1, WRITE: 2, ADMIN: 3 };
    
    // Handle PRODUCTS display
    if (allProducts) {
      // Check if any specific solutions grant higher permissions than all-products
      const hasHigherSolutionPerms = specificSolutions.some(s => 
        hierarchy[s.permissionLevel] > hierarchy[allProducts.permissionLevel]
      );
      
      if (hasHigherSolutionPerms) {
        // Show: All Products (READ) except: 1 solution(s) → elevated access
        summary.push(
          <Box key="products" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label={`All Products (${allProducts.permissionLevel})`} size="small" color="primary" />
            <Typography variant="caption" color="text.secondary">except:</Typography>
            <Tooltip title={`Products in these solutions have higher permissions: ${specificSolutions.filter(s => hierarchy[s.permissionLevel] > hierarchy[allProducts.permissionLevel]).map(s => `${s.resourceName || s.resourceId} (${s.permissionLevel})`).join(', ')}`}>
              <Chip 
                label={`${specificSolutions.filter(s => hierarchy[s.permissionLevel] > hierarchy[allProducts.permissionLevel]).length} solution(s) → elevated`} 
                size="small" 
                color="warning"
                icon={<Box component="span" sx={{ fontSize: '12px' }}>⬆</Box>}
              />
            </Tooltip>
          </Box>
        );
      } else {
        summary.push(
          <Box key="products" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label={`All Products (${allProducts.permissionLevel})`} size="small" color="primary" />
          </Box>
        );
      }
    } else if (specificProducts.length > 0) {
      summary.push(
        <Chip key="products" label={`${specificProducts.length} Product(s)`} size="small" variant="outlined" />
      );
    }
    
    // Handle SOLUTIONS display
    if (allSolutions && allProducts) {
      // Both "all products" and "all solutions" exist - compare levels
      const productLevel = hierarchy[allProducts.permissionLevel] || 0;
      const solutionLevel = hierarchy[allSolutions.permissionLevel] || 0;
      
      if (productLevel > solutionLevel) {
        // Product permission is higher → solutions get elevated
        summary.push(
          <Box key="solutions" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label={`All Solutions (${allProducts.permissionLevel})`} size="small" color="success" icon={<Box component="span" sx={{ fontSize: '12px' }}>✓</Box>} />
            <Tooltip title={`Inherited from all-products permission. Explicit solution permission (${allSolutions.permissionLevel}) is overridden.`}>
              <Chip label={`was ${allSolutions.permissionLevel}`} size="small" variant="outlined" />
            </Tooltip>
          </Box>
        );
      } else if (solutionLevel > productLevel) {
        // Solution permission is higher → products get elevated (show in products section)
        summary.push(
          <Box key="solutions" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label={`All Solutions (${allSolutions.permissionLevel})`} size="small" color="primary" />
          </Box>
        );
      } else {
        // Same level
        summary.push(
          <Box key="solutions" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label={`All Solutions (${allSolutions.permissionLevel})`} size="small" color="primary" />
          </Box>
        );
      }
    } else if (allSolutions && !allProducts) {
      // Only "all solutions" - implies all products at same level
      summary.push(
        <Box key="solutions" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip label={`All Solutions (${allSolutions.permissionLevel})`} size="small" color="primary" />
        </Box>
      );
    } else if (!allSolutions && specificSolutions.length > 0) {
      // We have specific solutions but no "all solutions"
      if (allProducts) {
        // Case: ALL PRODUCTS + SPECIFIC SOLUTIONS (SASE SME case)
        const solutionChips = specificSolutions.map(s => (
          <Chip 
            key={s.resourceId}
            label={`${s.resourceName || 'Solution'} (${s.permissionLevel})`}
            size="small" 
            color="secondary"
          />
        ));
        
        summary.push(
          <Box key="solutions" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip 
              label={`Other Solutions (${allProducts.permissionLevel})`} 
              size="small" 
              color="success"
              variant="outlined"
              icon={<Box component="span" sx={{ fontSize: '12px' }}>✓</Box>}
            />
            <Typography variant="caption" color="text.secondary">+</Typography>
            {solutionChips}
          </Box>
        );
      } else {
        // Only specific solutions, no all-products
        const solutionChips = specificSolutions.map(s => (
          <Chip 
            key={s.resourceId}
            label={`${s.resourceName || 'Solution'} (${s.permissionLevel})`}
            size="small" 
            color="primary"
          />
        ));
        
        summary.push(
          <Box key="solutions" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {solutionChips}
          </Box>
        );
      }
    } else if (allProducts && !allSolutions && specificSolutions.length === 0) {
      // ALL PRODUCTS but NO solutions at all → all solutions inherit
      summary.push(
        <Box key="solutions" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip 
            label={`All Solutions (${allProducts.permissionLevel})`} 
            size="small" 
            color="success"
            variant="outlined"
            icon={<Box component="span" sx={{ fontSize: '12px' }}>✓</Box>}
          />
          <Tooltip title="Inherited from all-products permission">
            <Chip label="inherited" size="small" variant="outlined" />
          </Tooltip>
        </Box>
      );
    }
    
    if (allCustomers) {
      summary.push(
        <Chip key="customers" label={`All Customers (${allCustomers.permissionLevel})`} size="small" color="primary" />
      );
    } else if (customerPerms.length > 0) {
      summary.push(
        <Chip key="customers" label={`${customerPerms.length} Customer(s)`} size="small" variant="outlined" />
      );
    }
    
    if (summary.length === 0) return 'No permissions';
    
    return <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>{summary}</Box>;
  };

  const roles = rolesData?.roles || [];
  const users = usersData?.users || [];
  const userRoles = userRolesData?.userRoles || [];
  const resources = resourcesData?.availableResources || [];

  const products = resources.filter((r: Resource) => r.type === 'PRODUCT');
  const solutions = resources.filter((r: Resource) => r.type === 'SOLUTION');
  const customers = resources.filter((r: Resource) => r.type === 'CUSTOMER');

  if (rolesLoading || usersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (rolesError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading roles: {rolesError.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Role Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRole}
        >
          Add Role
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Roles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Role Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Users</strong></TableCell>
              <TableCell><strong>Permissions</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role: Role) => (
              <TableRow 
                key={role.id} 
                hover
                onDoubleClick={() => handleEditRole(role)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Chip label={role.name} color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{role.description || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip label={role.userCount || 0} size="small" color="info" />
                    {role.users && role.users.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: 1 }}>
                        {role.users.slice(0, 3).map((user) => (
                          <Chip
                            key={user.id}
                            label={user.username}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ))}
                        {role.users.length > 3 && (
                          <Chip
                            label={`+${role.users.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {getPermissionSummary(role.permissions)}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Assign to User">
                    <IconButton size="small" onClick={() => handleAssignRole(role)} color="primary">
                      <AssignIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Role">
                    <IconButton size="small" onClick={() => handleEditRole(role)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Role">
                    <IconButton size="small" onClick={() => handleDeleteRole(role)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No roles found. Add your first role to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Role Dialog (Add/Edit) */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Add New Role'}
        </DialogTitle>
        <DialogContent>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Role Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., SME, CS_MANAGER, PRODUCT_ADMIN"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Describe the role's purpose and responsibilities"
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="h6">Permissions</Typography>
            
            <Tabs value={permissionTab} onChange={(_, v) => setPermissionTab(v)}>
              <Tab label="Products" />
              <Tab label="Solutions" />
              <Tab label="Customers" />
              {editingRole && <Tab label="Assigned Users" />}
            </Tabs>

            {/* Products Tab */}
            {permissionTab === 0 && (
              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Product Access</FormLabel>
                  <RadioGroup
                    value={permissionBuilder.products.mode}
                    onChange={(e) => setPermissionBuilder({
                      ...permissionBuilder,
                      products: { ...permissionBuilder.products, mode: e.target.value as 'none' | 'all' | 'specific' }
                    })}
                  >
                    <FormControlLabel value="none" control={<Radio />} label="No Access (Not Visible)" />
                    <FormControlLabel value="all" control={<Radio />} label="All Products" />
                    <FormControlLabel value="specific" control={<Radio />} label="Specific Products" />
                  </RadioGroup>
                </FormControl>

                {permissionBuilder.products.mode !== 'none' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Permission Level</InputLabel>
                    <Select
                      value={permissionBuilder.products.permissionLevel}
                      onChange={(e) => setPermissionBuilder({
                        ...permissionBuilder,
                        products: { ...permissionBuilder.products, permissionLevel: e.target.value }
                      })}
                      label="Permission Level"
                    >
                      <MenuItem value="READ">Read Only</MenuItem>
                      <MenuItem value="WRITE">Read & Write</MenuItem>
                      <MenuItem value="ADMIN">Admin (Full Control)</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {permissionBuilder.products.mode === 'specific' && (
                  <Box sx={{ mt: 2 }}>
                    {products.length === 0 ? (
                      <Alert severity="warning">
                        No products available. Please create products first in the Products menu before assigning role permissions.
                      </Alert>
                    ) : (
                      <Box>
                        <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                          Select products and set individual permission levels:
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox"></TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Permission Level</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {products.map((product: Resource) => {
                                const isSelected = permissionBuilder.products.selectedIds.includes(product.id);
                                const currentLevel = permissionBuilder.products.specificPermissions[product.id] || 'READ';
                                
                                return (
                                  <TableRow key={product.id} hover>
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const newSelectedIds = e.target.checked
                                            ? [...permissionBuilder.products.selectedIds, product.id]
                                            : permissionBuilder.products.selectedIds.filter(id => id !== product.id);
                                          
                                          const newSpecificPermissions = { ...permissionBuilder.products.specificPermissions };
                                          if (e.target.checked && !newSpecificPermissions[product.id]) {
                                            newSpecificPermissions[product.id] = 'READ';
                                          }
                                          
                                          setPermissionBuilder({
                                            ...permissionBuilder,
                                            products: {
                                              ...permissionBuilder.products,
                                              selectedIds: newSelectedIds,
                                              specificPermissions: newSpecificPermissions
                                            }
                                          });
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>
                                      <Select
                                        size="small"
                                        value={currentLevel}
                                        disabled={!isSelected}
                                        onChange={(e) => {
                                          setPermissionBuilder({
                                            ...permissionBuilder,
                                            products: {
                                              ...permissionBuilder.products,
                                              specificPermissions: {
                                                ...permissionBuilder.products.specificPermissions,
                                                [product.id]: e.target.value
                                              }
                                            }
                                          });
                                        }}
                                        sx={{ minWidth: 120 }}
                                      >
                                        <MenuItem value="READ">Read</MenuItem>
                                        <MenuItem value="WRITE">Write</MenuItem>
                                        <MenuItem value="ADMIN">Admin</MenuItem>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {permissionBuilder.products.selectedIds.length} product(s) selected
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                {/* Permission Flow Info */}
                {permissionBuilder.products.mode === 'all' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Permission Flow:</strong> Granting permission to <strong>ALL Products</strong> automatically grants the <strong>same level</strong> of permission to <strong>ALL Solutions</strong>.
                      {permissionBuilder.products.permissionLevel === 'ADMIN' && ' ADMIN on all products = ADMIN on all solutions.'}
                      {permissionBuilder.products.permissionLevel === 'WRITE' && ' WRITE on all products = WRITE on all solutions.'}
                      {permissionBuilder.products.permissionLevel === 'READ' && ' READ on all products = READ on all solutions.'}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            {/* Solutions Tab */}
            {permissionTab === 1 && (
              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Solution Access</FormLabel>
                  <RadioGroup
                    value={permissionBuilder.solutions.mode}
                    onChange={(e) => setPermissionBuilder({
                      ...permissionBuilder,
                      solutions: { ...permissionBuilder.solutions, mode: e.target.value as 'none' | 'all' | 'specific' }
                    })}
                  >
                    <FormControlLabel value="none" control={<Radio />} label="No Access (Not Visible)" />
                    <FormControlLabel value="all" control={<Radio />} label="All Solutions" />
                    <FormControlLabel value="specific" control={<Radio />} label="Specific Solutions" />
                  </RadioGroup>
                </FormControl>

                {permissionBuilder.solutions.mode !== 'none' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Permission Level</InputLabel>
                    <Select
                      value={permissionBuilder.solutions.permissionLevel}
                      onChange={(e) => setPermissionBuilder({
                        ...permissionBuilder,
                        solutions: { ...permissionBuilder.solutions, permissionLevel: e.target.value }
                      })}
                      label="Permission Level"
                    >
                      <MenuItem value="READ">Read Only</MenuItem>
                      <MenuItem value="WRITE">Read & Write</MenuItem>
                      <MenuItem value="ADMIN">Admin (Full Control)</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {permissionBuilder.solutions.mode === 'specific' && (
                  <Box sx={{ mt: 2 }}>
                    {solutions.length === 0 ? (
                      <Alert severity="warning">
                        No solutions available. Please create solutions first in the Solutions menu before assigning role permissions.
                      </Alert>
                    ) : (
                      <Box>
                        <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                          Select solutions and set individual permission levels:
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox"></TableCell>
                                <TableCell>Solution Name</TableCell>
                                <TableCell>Permission Level</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {solutions.map((solution: Resource) => {
                                const isSelected = permissionBuilder.solutions.selectedIds.includes(solution.id);
                                const currentLevel = permissionBuilder.solutions.specificPermissions[solution.id] || 'READ';
                                
                                return (
                                  <TableRow key={solution.id} hover>
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const newSelectedIds = e.target.checked
                                            ? [...permissionBuilder.solutions.selectedIds, solution.id]
                                            : permissionBuilder.solutions.selectedIds.filter(id => id !== solution.id);
                                          
                                          const newSpecificPermissions = { ...permissionBuilder.solutions.specificPermissions };
                                          if (e.target.checked && !newSpecificPermissions[solution.id]) {
                                            newSpecificPermissions[solution.id] = 'READ';
                                          }
                                          
                                          setPermissionBuilder({
                                            ...permissionBuilder,
                                            solutions: {
                                              ...permissionBuilder.solutions,
                                              selectedIds: newSelectedIds,
                                              specificPermissions: newSpecificPermissions
                                            }
                                          });
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>{solution.name}</TableCell>
                                    <TableCell>
                                      <Select
                                        size="small"
                                        value={currentLevel}
                                        disabled={!isSelected}
                                        onChange={(e) => {
                                          setPermissionBuilder({
                                            ...permissionBuilder,
                                            solutions: {
                                              ...permissionBuilder.solutions,
                                              specificPermissions: {
                                                ...permissionBuilder.solutions.specificPermissions,
                                                [solution.id]: e.target.value
                                              }
                                            }
                                          });
                                        }}
                                        sx={{ minWidth: 120 }}
                                      >
                                        <MenuItem value="READ">Read</MenuItem>
                                        <MenuItem value="WRITE">Write</MenuItem>
                                        <MenuItem value="ADMIN">Admin</MenuItem>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {permissionBuilder.solutions.selectedIds.length} solution(s) selected
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                {/* Permission Flow Info */}
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Permission Flow (Bidirectional):</strong>
                  </Typography>
                  <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                    <li>
                      Granting permission to a <strong>specific solution</strong> automatically grants the <strong>same level</strong> of permission to <strong>all products</strong> within that solution.
                    </li>
                    {permissionBuilder.solutions.mode === 'all' && (
                      <>
                        <li>
                          Granting permission to <strong>ALL Solutions</strong> automatically grants the <strong>same level</strong> of permission to <strong>ALL Products</strong>.
                        </li>
                        <li>
                          If a role has permission on <strong>ALL Products</strong>, the <strong>highest permission level</strong> applies to <strong>ALL Solutions</strong>.
                        </li>
                      </>
                    )}
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Customers Tab */}
            {permissionTab === 2 && (
              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Customer Access</FormLabel>
                  <RadioGroup
                    value={permissionBuilder.customers.mode}
                    onChange={(e) => setPermissionBuilder({
                      ...permissionBuilder,
                      customers: { ...permissionBuilder.customers, mode: e.target.value as 'none' | 'all' | 'specific' }
                    })}
                  >
                    <FormControlLabel value="none" control={<Radio />} label="No Access (Not Visible)" />
                    <FormControlLabel value="all" control={<Radio />} label="All Customers" />
                    <FormControlLabel value="specific" control={<Radio />} label="Specific Customers" />
                  </RadioGroup>
                </FormControl>

                {permissionBuilder.customers.mode !== 'none' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Permission Level</InputLabel>
                    <Select
                      value={permissionBuilder.customers.permissionLevel}
                      onChange={(e) => setPermissionBuilder({
                        ...permissionBuilder,
                        customers: { ...permissionBuilder.customers, permissionLevel: e.target.value }
                      })}
                      label="Permission Level"
                    >
                      <MenuItem value="READ">Read Only</MenuItem>
                      <MenuItem value="WRITE">Read & Write</MenuItem>
                      <MenuItem value="ADMIN">Admin (Full Control)</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {permissionBuilder.customers.mode === 'specific' && (
                  <Box sx={{ mt: 2 }}>
                    {customers.length === 0 ? (
                      <Alert severity="warning">
                        No customers available. Please create customers first in the Customers menu before assigning role permissions.
                      </Alert>
                    ) : (
                      <Box>
                        <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                          Select customers and set individual permission levels:
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox"></TableCell>
                                <TableCell>Customer Name</TableCell>
                                <TableCell>Permission Level</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {customers.map((customer: Resource) => {
                                const isSelected = permissionBuilder.customers.selectedIds.includes(customer.id);
                                const currentLevel = permissionBuilder.customers.specificPermissions[customer.id] || 'READ';
                                
                                return (
                                  <TableRow key={customer.id} hover>
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const newSelectedIds = e.target.checked
                                            ? [...permissionBuilder.customers.selectedIds, customer.id]
                                            : permissionBuilder.customers.selectedIds.filter(id => id !== customer.id);
                                          
                                          const newSpecificPermissions = { ...permissionBuilder.customers.specificPermissions };
                                          if (e.target.checked && !newSpecificPermissions[customer.id]) {
                                            newSpecificPermissions[customer.id] = 'READ';
                                          }
                                          
                                          setPermissionBuilder({
                                            ...permissionBuilder,
                                            customers: {
                                              ...permissionBuilder.customers,
                                              selectedIds: newSelectedIds,
                                              specificPermissions: newSpecificPermissions
                                            }
                                          });
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>{customer.name}</TableCell>
                                    <TableCell>
                                      <Select
                                        size="small"
                                        value={currentLevel}
                                        disabled={!isSelected}
                                        onChange={(e) => {
                                          setPermissionBuilder({
                                            ...permissionBuilder,
                                            customers: {
                                              ...permissionBuilder.customers,
                                              specificPermissions: {
                                                ...permissionBuilder.customers.specificPermissions,
                                                [customer.id]: e.target.value
                                              }
                                            }
                                          });
                                        }}
                                        sx={{ minWidth: 120 }}
                                      >
                                        <MenuItem value="READ">Read</MenuItem>
                                        <MenuItem value="WRITE">Write</MenuItem>
                                        <MenuItem value="ADMIN">Admin</MenuItem>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {permissionBuilder.customers.selectedIds.length} customer(s) selected
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Assigned Users Tab */}
            {editingRole && permissionTab === 3 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Users with this role
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Select Users</InputLabel>
                  <Select
                    multiple
                    value={selectedUsers}
                    onChange={(e) => setSelectedUsers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    input={<OutlinedInput label="Select Users" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((userId) => {
                          const user = usersData?.users?.find((u: any) => u.id === userId);
                          return (
                            <Chip 
                              key={userId} 
                              label={user?.username || userId} 
                              size="small" 
                              color="secondary"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    )}
                    disabled={usersLoading}
                  >
                    {usersData?.users?.map((user: any) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Checkbox checked={selectedUsers.indexOf(user.id) > -1} />
                        <ListItemText 
                          primary={user.username} 
                          secondary={user.email}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Permission Flow:</strong> Users assigned to this role will inherit all permissions defined in the Products, Solutions, and Customers tabs.
                    Changes will take effect immediately after saving.
                  </Typography>
                </Alert>
                {editingRole?.users && editingRole.users.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Currently assigned users:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {editingRole.users.map((user: any) => (
                        <Chip 
                          key={user.id} 
                          label={`${user.username} (${user.email})`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
          
          {/* Effective Permissions Preview */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              📊 Effective Permissions Preview
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              This shows the actual permissions that will be applied after bidirectional flow rules.
            </Typography>
            
            {(() => {
              const effective = getEffectivePermissions();
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Products Section */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                      🔷 Products
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 2 }}>
                      {effective.products.level !== 'NONE' ? (
                        <>
                          <Chip 
                            label={`All Products: ${effective.products.level}`}
                            size="small"
                            color={effective.products.source === 'explicit' ? 'primary' : 'success'}
                            variant={effective.products.source === 'explicit' ? 'filled' : 'outlined'}
                            icon={effective.products.source === 'inherited' ? <Box component="span" sx={{ fontSize: '12px' }}>✓</Box> : undefined}
                          />
                          {effective.products.source === 'inherited' && (
                            <Typography variant="caption" color="text.secondary">
                              (inherited)
                            </Typography>
                          )}
                          {effective.products.note && (
                            <Tooltip title={effective.products.note}>
                              <Chip 
                                label="mixed permissions"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                        </>
                      ) : effective.specificProducts ? (
                        <Chip 
                          label={`${effective.specificProducts.count} specific product(s): ${effective.specificProducts.level}`}
                          size="small"
                          color="primary"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No product permissions
                        </Typography>
                      )}
                    </Box>
                    {effective.products.note && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2, mt: 0.5 }}>
                        ℹ️ {effective.products.note}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Solutions Section */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                      🔶 Solutions
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 2 }}>
                      {effective.solutions.level !== 'NONE' ? (
                        <>
                          {effective.solutions.source === 'inherited' && !effective.specificSolutions ? (
                            <>
                              <Chip 
                                label={`All Solutions: ${effective.solutions.level}`}
                                size="small"
                                color="success"
                                variant="outlined"
                                icon={<Box component="span" sx={{ fontSize: '12px' }}>✓</Box>}
                              />
                              <Typography variant="caption" color="text.secondary">
                                (inherited)
                              </Typography>
                            </>
                          ) : effective.specificSolutions ? (
                            <>
                              {effective.solutions.note && (
                                <>
                                  <Chip 
                                    label={`Other Solutions: ${effective.solutions.level}`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    icon={<Box component="span" sx={{ fontSize: '12px' }}>✓</Box>}
                                  />
                                  <Typography variant="caption" color="text.secondary">+</Typography>
                                </>
                              )}
                              <Tooltip title={effective.specificSolutions.names?.join(', ') || 'Specific solutions'}>
                                <Chip 
                                  label={`${effective.specificSolutions.count} solution(s): ${effective.specificSolutions.level}`}
                                  size="small"
                                  color="secondary"
                                />
                              </Tooltip>
                            </>
                          ) : (
                            <Chip 
                              label={`All Solutions: ${effective.solutions.level}`}
                              size="small"
                              color={effective.solutions.source === 'explicit' ? 'primary' : 'success'}
                              variant={effective.solutions.source === 'explicit' ? 'filled' : 'outlined'}
                              icon={effective.solutions.source === 'inherited' ? <Box component="span" sx={{ fontSize: '12px' }}>✓</Box> : undefined}
                            />
                          )}
                        </>
                      ) : effective.specificSolutions ? (
                        <Tooltip title={effective.specificSolutions.names?.join(', ') || 'Specific solutions'}>
                          <Chip 
                            label={`${effective.specificSolutions.count} specific solution(s): ${effective.specificSolutions.level}`}
                            size="small"
                            color="primary"
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No solution permissions
                        </Typography>
                      )}
                    </Box>
                    {effective.solutions.note && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2, mt: 0.5 }}>
                        ℹ️ {effective.solutions.note}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Customers Section */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                      👥 Customers
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 2 }}>
                      {permissionBuilder.customers.mode === 'all' ? (
                        <Chip 
                          label={`All Customers: ${permissionBuilder.customers.permissionLevel}`}
                          size="small"
                          color="primary"
                        />
                      ) : permissionBuilder.customers.selectedIds.length > 0 ? (
                        <Chip 
                          label={`${permissionBuilder.customers.selectedIds.length} specific customer(s): ${permissionBuilder.customers.permissionLevel}`}
                          size="small"
                          color="primary"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No customer permissions
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })()}
            
            <Divider sx={{ my: 2 }} />
            
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="caption">
                <strong>Legend:</strong>{' '}
                🔵 Blue = Explicit permission |{' '}
                ✅ Green outlined = Inherited permission |{' '}
                🟣 Purple = Specific resources
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={creating || updating}
          >
            {creating || updating ? <CircularProgress size={24} /> : (editingRole ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete role <strong>{deletingRole?.name}</strong>?
            This action cannot be undone.
          </Typography>
          {deletingRole?.userCount && deletingRole.userCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This role is assigned to {deletingRole.userCount} user(s). Deleting it will remove the role from all users.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role to User Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Role: {assigningRole?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select User</InputLabel>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                label="Select User"
              >
                {users.map((user: User) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.fullName || user.username} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedUserId && userRoles.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Current Roles:
                </Typography>
                <List dense>
                  {userRoles.map((role: any) => (
                    <ListItem key={role.id}>
                      <ListItemText primary={role.name} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveRoleFromUser(selectedUserId, role.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignRoleToUser}
            variant="contained"
            disabled={assigning || !selectedUserId}
          >
            {assigning ? <CircularProgress size={24} /> : 'Assign Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
