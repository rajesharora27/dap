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
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as ResetPasswordIcon,
  CheckCircle,
  Cancel
} from '@shared/components/FAIcon';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL Queries
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      email
      fullName
      isAdmin
      isActive
      mustChangePassword
      roles
    }
  }
`;

// GraphQL Mutations
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      email
      fullName
      isAdmin
      isActive
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($userId: ID!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      id
      username
      email
      fullName
      isAdmin
      isActive
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`;

const RESET_PASSWORD = gql`
  mutation ResetPasswordToDefault($userId: ID!) {
    resetPasswordToDefault(userId: $userId)
  }
`;

const ACTIVATE_USER = gql`
  mutation ActivateUser($userId: ID!) {
    activateUser(userId: $userId)
  }
`;

const DEACTIVATE_USER = gql`
  mutation DeactivateUser($userId: ID!) {
    deactivateUser(userId: $userId)
  }
`;

const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
      description
      userCount
    }
  }
`;

const GET_USER_ROLES = gql`
  query GetUserRoles($userId: ID!) {
    userRoles(userId: $userId) {
      id
      name
      description
    }
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
}

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  roles?: string[];
}

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
}

export const UserManagement: React.FC = () => {
  const [userDialog, setUserDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    fullName: '',
    isAdmin: false
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Queries
  const { data, loading, error, refetch } = useQuery(GET_USERS);
  const { data: rolesData, loading: rolesLoading } = useQuery(GET_ROLES);
  const { data: userRolesData, refetch: refetchUserRoles } = useQuery(GET_USER_ROLES, {
    skip: !editingUser,
    variables: { userId: editingUser?.id }
  });

  // Mutations
  const [createUser, { loading: creating }] = useMutation(CREATE_USER, {
    onCompleted: () => {
      setSuccessMsg('User created successfully! Default password: DAP123');
      setUserDialog(false);
      refetch();
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER, {
    // Don't use onCompleted here - we'll handle it manually after role sync
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER, {
    onCompleted: () => {
      setSuccessMsg('User deleted successfully!');
      setDeleteDialog(false);
      setDeletingUser(null);
      refetch();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [resetPassword, { loading: resetting }] = useMutation(RESET_PASSWORD, {
    onCompleted: () => {
      setSuccessMsg('Password reset to DAP123 successfully.');
      setResetPasswordDialog(false);
      setResettingUser(null);
      refetch();
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [activateUser] = useMutation(ACTIVATE_USER, {
    onCompleted: () => {
      setSuccessMsg('User activated successfully!');
      refetch();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [deactivateUser] = useMutation(DEACTIVATE_USER, {
    onCompleted: () => {
      setSuccessMsg('User deactivated successfully!');
      refetch();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [assignRoleToUser] = useMutation(ASSIGN_ROLE_TO_USER, {
    onError: (err) => {
      setErrorMsg(`Failed to assign role: ${err.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const [removeRoleFromUser] = useMutation(REMOVE_ROLE_FROM_USER, {
    onError: (err) => {
      setErrorMsg(`Failed to remove role: ${err.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  // Load user roles when editing user
  React.useEffect(() => {
    if (editingUser && userRolesData?.userRoles) {
      setSelectedRoles(userRolesData.userRoles.map((r: Role) => r.id));
    } else {
      setSelectedRoles([]);
    }
  }, [editingUser, userRolesData]);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      fullName: '',
      isAdmin: false
    });
    setSelectedRoles([]);
    setUserDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      isAdmin: user.isAdmin
    });
    setUserDialog(true);
    // Roles will be loaded by useEffect
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setDeleteDialog(true);
  };

  const handleResetPassword = (user: User) => {
    setResettingUser(user);
    setResetPasswordDialog(true);
  };

  const handleToggleActive = (user: User) => {
    if (user.isActive) {
      deactivateUser({ variables: { userId: user.id } });
    } else {
      activateUser({ variables: { userId: user.id } });
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    
    // Validation
    if (!formData.username.trim() || !formData.email.trim()) {
      setErrorMsg('Username and email are required');
      return;
    }

    if (editingUser) {
      // Update user
      try {
        await updateUser({
          variables: {
            userId: editingUser.id,
            input: {
              email: formData.email,
              fullName: formData.fullName || null,
              isAdmin: formData.isAdmin
            }
          }
        });

        // Sync roles: Get current roles from backend
        const currentRoles = userRolesData?.userRoles?.map((r: any) => r.id) || [];
        const rolesToAdd = selectedRoles.filter((roleId: string) => !currentRoles.includes(roleId));
        const rolesToRemove = currentRoles.filter((roleId: string) => !selectedRoles.includes(roleId));

        // Add new roles
        for (const roleId of rolesToAdd) {
          await assignRoleToUser({
            variables: {
              userId: editingUser.id,
              roleId
            }
          });
        }

        // Remove unselected roles
        for (const roleId of rolesToRemove) {
          await removeRoleFromUser({
            variables: {
              userId: editingUser.id,
              roleId
            }
          });
        }

        // Refetch everything to ensure UI is up to date
        await refetchUserRoles();
        await refetch(); // Refetch the main user list
        
        // Close dialog and show success message
        setUserDialog(false);
        setSuccessMsg('User and roles updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        setErrorMsg(err.message);
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } else {
      // Create user
      createUser({
        variables: {
          input: formData
        }
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      deleteUser({ variables: { userId: deletingUser.id } });
    }
  };

  const handleConfirmReset = () => {
    if (resettingUser) {
      resetPassword({ variables: { userId: resettingUser.id } });
    }
  };

  const users = data?.users || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading users: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
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

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Full Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>System Role</strong></TableCell>
              <TableCell><strong>Assigned Roles</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: User) => (
              <TableRow 
                key={user.id} 
                hover
                onDoubleClick={() => handleEditUser(user)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.fullName || '-'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.isAdmin ? 'Admin' : 'User'}
                    color={user.isAdmin ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((roleName, idx) => (
                        <Chip
                          key={idx}
                          label={roleName}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={user.isActive ? <CheckCircle /> : <Cancel />}
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                    onClick={() => handleToggleActive(user)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit User">
                    <IconButton size="small" onClick={() => handleEditUser(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset Password to DAP123">
                    <IconButton size="small" onClick={() => handleResetPassword(user)}>
                      <ResetPasswordIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete User">
                    <IconButton size="small" onClick={() => handleDeleteUser(user)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No users found. Add your first user to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Dialog (Add/Edit) */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
              required
              disabled={!!editingUser} // Username cannot be changed
              helperText={editingUser ? 'Username cannot be changed' : ''}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                />
              }
              label="Administrator"
            />
            
            {/* Role Assignment Section */}
            {editingUser && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Assigned Roles
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Select Roles</InputLabel>
                  <Select
                    multiple
                    value={selectedRoles}
                    onChange={(e) => setSelectedRoles(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    input={<OutlinedInput label="Select Roles" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((roleId) => {
                          const role = rolesData?.roles?.find((r: any) => r.id === roleId);
                          return (
                            <Chip 
                              key={roleId} 
                              label={role?.name || roleId} 
                              size="small" 
                              color="secondary"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    )}
                    disabled={rolesLoading}
                  >
                    {rolesData?.roles?.map((role: any) => (
                      <MenuItem key={role.id} value={role.id}>
                        <Checkbox checked={selectedRoles.indexOf(role.id) > -1} />
                        <ListItemText 
                          primary={role.name} 
                          secondary={role.description}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Permission Flow:</strong> Roles grant permissions to resources (Products/Solutions/Customers).
                    Solution access automatically grants access to all its products, and vice versa.
                  </Typography>
                </Alert>
              </Box>
            )}
            
            {!editingUser && (
              <Alert severity="info">
                New user will be created with default password <strong>DAP123</strong>.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={creating || updating}
          >
            {creating || updating ? <CircularProgress size={24} /> : (editingUser ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{deletingUser?.username}</strong>?
            This action cannot be undone.
          </Typography>
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

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography>
            Reset password for user <strong>{resettingUser?.username}</strong> to the default password <strong>DAP123</strong>?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            The password will be reset to DAP123.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmReset}
            variant="contained"
            color="warning"
            disabled={resetting}
          >
            {resetting ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

