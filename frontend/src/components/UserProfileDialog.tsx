import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useAuth } from './AuthContext';

const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      fullName
      isAdmin
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, onClose }) => {
  const { user: authUser, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // GraphQL
  const { data, loading, refetch } = useQuery(GET_ME, {
    skip: !open,
    onCompleted: (data) => {
      if (data?.me) {
        setFullName(data.me.fullName || '');
        setEmail(data.me.email || '');
      }
    }
  });
  
  const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD);
  
  const user = data?.me;
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSuccessMsg('');
    setErrorMsg('');
  };
  
  const handleClose = () => {
    setActiveTab(0);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMsg('');
    setErrorMsg('');
    onClose();
  };
  
  const handlePasswordChange = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('All password fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    
    if (!user?.id) {
      setErrorMsg('User ID not found');
      return;
    }
    
    try {
      await changePassword({
        variables: {
          input: {
            userId: user.id,
            oldPassword: currentPassword,
            newPassword
          }
        }
      });
      
      setSuccessMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password');
    }
  };
  
  const handleProfileUpdate = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // For now, just update the local user state
    // You can add a mutation to update user profile on backend if needed
    if (authUser) {
      const updatedUser = {
        ...authUser,
        fullName,
        email
      };
      setUser(updatedUser);
      setSuccessMsg('Profile updated successfully!');
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>User Profile</DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Profile" />
              <Tab label="Change Password" />
            </Tabs>
            
            {successMsg && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {successMsg}
              </Alert>
            )}
            
            {errorMsg && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMsg}
              </Alert>
            )}
            
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Username"
                  value={user?.username || ''}
                  disabled
                  margin="normal"
                  helperText="Username cannot be changed"
                />
                
                <TextField
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                />
                
                {user?.isAdmin && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    You are an administrator
                  </Alert>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose a strong password with at least 6 characters.
                </Typography>
                
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  margin="normal"
                  autoComplete="current-password"
                />
                
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  margin="normal"
                  autoComplete="new-password"
                />
                
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                  autoComplete="new-password"
                />
              </Box>
            </TabPanel>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeTab === 0 ? (
          <Button 
            onClick={handleProfileUpdate} 
            variant="contained"
            disabled={loading}
          >
            Update Profile
          </Button>
        ) : (
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={changingPassword || loading}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

