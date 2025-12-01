/**
 * Shared tab styling for consistent appearance across the app
 */
import { SxProps, Theme } from '@mui/material';

export const getTabsContainerStyles = (): SxProps<Theme> => ({
  borderBottom: 2,
  borderColor: 'primary.main',
  backgroundColor: '#ffffff',
  borderRadius: '12px 12px 0 0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
});

export const getTabsStyles = (): SxProps<Theme> => ({
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '3px 3px 0 0',
    backgroundColor: 'primary.main',
  },
  '& .MuiTab-root': {
    fontWeight: 600,
    fontSize: '0.9rem',
    textTransform: 'none',
    minWidth: 100,
    py: 1.5,
    px: 2.5,
    color: 'text.secondary',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
      color: 'primary.main',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
    },
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      color: 'primary.main',
    },
  },
});

/**
 * Adoption plan color schemes for different contexts
 */
export const adoptionPlanColors = {
  product: {
    titleColor: '#00897B',
    bgColor: '#E0F2F1',
    borderColor: '#00897B',
    titleIcon: '📦',
  },
  solution: {
    titleColor: '#7B1FA2',
    bgColor: '#F3E5F5',
    borderColor: '#7B1FA2',
    titleIcon: '🎯',
  },
  default: {
    titleColor: '#1976d2',
    bgColor: '#e3f2fd',
    borderColor: '#1976d2',
    titleIcon: '📋',
  },
};

