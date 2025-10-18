import * as React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Rocket } from '@mui/icons-material';
import { useAuth } from './AuthContext';

export const AuthBar: React.FC = () => {
  const { token, setToken } = useAuth();
  return (
    <AppBar 
      position="fixed" 
      color="primary" 
      sx={{ 
        zIndex: 1400,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Rocket sx={{ fontSize: 32, transform: 'rotate(-45deg)' }} />
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: '0.5px',
                lineHeight: 1,
                mb: 0.5
              }}
            >
              Dynamic Adoption Plans
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.9,
                fontSize: '0.7rem',
                letterSpacing: '1px',
                fontWeight: 500
              }}
            >
              Accelerate Customer Success
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
