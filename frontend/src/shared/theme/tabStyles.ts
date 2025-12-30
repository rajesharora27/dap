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
      backgroundColor: 'rgba(4, 159, 217, 0.08)',
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
    titleColor: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10B981',
    titleIcon: '📦',
  },
  solution: {
    titleColor: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: '#3B82F6',
    titleIcon: '🎯',
  },
  default: {
    titleColor: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: '#3B82F6',
    titleIcon: '📋',
  },
};

