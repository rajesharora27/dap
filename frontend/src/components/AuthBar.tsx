import * as React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Dashboard, TrendingUp } from '@mui/icons-material';
import { useAuth } from './AuthContext';

export const AuthBar: React.FC = () => {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, flex: 1 }}>
          {/* Modern Icon with Light Background */}
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              borderRadius: 2.5,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            <Dashboard sx={{ fontSize: { xs: 24, sm: 28 }, color: '#FFFFFF' }} />
          </Box>
          
          {/* Title and Subtitle */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.35rem', md: '1.5rem' },
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
                color: '#FFFFFF',
                fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Dynamic Adoption Plans
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <TrendingUp sx={{ fontSize: { xs: 13, sm: 15 }, color: '#A7F3D0' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  letterSpacing: '0.5px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  textTransform: 'uppercase',
                  fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif'
                }}
              >
                Accelerate Customer Success
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Status Badge */}
        <Box 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box 
            sx={{ 
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#10B981',
              boxShadow: '0 0 12px #10B981',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.7, transform: 'scale(1.1)' }
              }
            }}
          />
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.5px'
            }}
          >
            LIVE
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
