import * as React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { Dashboard, Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from './AuthContext';

interface AuthBarProps {
  onMenuClick?: () => void;
  drawerOpen?: boolean;
}

export const AuthBar: React.FC<AuthBarProps> = ({ onMenuClick, drawerOpen }) => {
  const { token, setToken } = useAuth();
  return (
    <AppBar 
      position="fixed" 
      elevation={2}
      sx={{ 
        zIndex: 1400,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
      }}
    >
      <Toolbar sx={{ py: { xs: 0.5, sm: 1 } }}>
        {/* Menu Toggle Button */}
        {onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={onMenuClick}
            edge="start"
            sx={{ 
              mr: 2,
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {/* Modern Icon */}
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 36, sm: 42 },
              height: { xs: 36, sm: 42 },
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <Dashboard sx={{ fontSize: { xs: 22, sm: 26 }, color: '#FFFFFF' }} />
          </Box>
          
          {/* Modern Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.05rem', sm: '1.25rem', md: '1.4rem' },
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
                color: '#FFFFFF',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
            >
              Dynamic Adoption Plans
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                letterSpacing: '0.3px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.85)',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
            >
              Customer Success Platform
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
