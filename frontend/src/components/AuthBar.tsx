import * as React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Dashboard,
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Person,
  Psychology,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import { useAuth } from './AuthContext';
import { AIChat } from './AIChat';
import { IS_AI_AGENT_AVAILABLE, IsAIAgentAvailableResponse } from '../graphql/ai';

interface AuthBarProps {
  onMenuClick?: () => void;
  drawerOpen?: boolean;
  onProfileClick?: () => void;
  onNavigate?: (type: string, id: string) => void;
}

export const AuthBar: React.FC<AuthBarProps> = ({ onMenuClick, drawerOpen, onProfileClick, onNavigate }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [aiChatOpen, setAiChatOpen] = React.useState(false);

  // Check if AI Agent is available (aiuser exists)
  const { data: aiAvailabilityData, loading: aiLoading } = useQuery<IsAIAgentAvailableResponse>(
    IS_AI_AGENT_AVAILABLE,
    {
      // Check availability once on mount, and refresh every 5 minutes
      pollInterval: 300000,
      fetchPolicy: 'cache-first',
    }
  );
  
  const isAIAgentAvailable = aiAvailabilityData?.isAIAgentAvailable?.available ?? false;
  const aiUnavailableMessage = aiAvailabilityData?.isAIAgentAvailable?.message || 'AI Agent is not available';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAIChatOpen = () => {
    if (isAIAgentAvailable) {
      setAiChatOpen(true);
    }
  };

  const handleAIChatClose = () => {
    setAiChatOpen(false);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.fullName) {
      const names = user.fullName.split(' ');
      return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.username?.[0]?.toUpperCase() || '?';
  };

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        zIndex: 1400,
        background: '#0D274D',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(13, 39, 77, 0.25)',
        // Enterprise Professional theme - updated
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

        {/* AI Assistant & User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* AI Assistant Button - only shown if aiuser exists */}
          {!aiLoading && isAIAgentAvailable && (
            <Tooltip title="AI Assistant" arrow>
              <IconButton
                onClick={handleAIChatOpen}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                  mr: 1,
                }}
              >
                <Badge
                  variant="dot"
                  color="success"
                  invisible={false}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#4caf50',
                      boxShadow: '0 0 6px rgba(76, 175, 80, 0.6)',
                    },
                  }}
                >
                  <Psychology />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          {user && (
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                display: { xs: 'none', sm: 'block' },
                mr: 1
              }}
            >
              {user.fullName || user.username}
            </Typography>
          )}
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              p: 0.5,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {getUserInitials()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.fullName || user?.username || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || ''}
              </Typography>
              {user?.isAdmin && (
                <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 600 }}>
                  Administrator
                </Typography>
              )}
            </Box>

            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile & Settings</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* AI Chat Dialog - only render if aiuser exists */}
      {isAIAgentAvailable && (
        <AIChat
          open={aiChatOpen}
          onClose={handleAIChatClose}
          onNavigate={onNavigate}
        />
      )}
    </AppBar>
  );
};
