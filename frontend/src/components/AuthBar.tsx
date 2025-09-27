import * as React from 'react';
import { AppBar, Toolbar, Button, Typography } from '@mui/material';
import { useAuth } from './AuthContext';

export const AuthBar: React.FC = () => {
  const { token, setToken } = useAuth();
  return (
    <AppBar position="fixed" color="primary" sx={{ zIndex: 1400 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ mr:2 }}>DAP</Typography>
        {token && <Button color="inherit" onClick={()=>setToken(null)}>Logout</Button>}
      </Toolbar>
    </AppBar>
  );
};
