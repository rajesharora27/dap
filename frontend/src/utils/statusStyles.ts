/**
 * Shared status styling utilities for consistent status display across the app
 */

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'COMPLETED' | 'NO_LONGER_USING' | 'NOT_APPLICABLE' | 'BLOCKED';
export type StatusUpdateSource = 'MANUAL' | 'TELEMETRY' | 'IMPORT' | 'SYSTEM';

/**
 * Get the background color for a status chip/cell
 */
export const getStatusBackgroundColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
    case 'DONE':
      return '#e8f5e9'; // Light green
    case 'IN_PROGRESS':
      return '#e3f2fd'; // Light blue
    case 'NOT_STARTED':
      return '#fafafa'; // Very light grey
    case 'BLOCKED':
      return '#ffebee'; // Light red
    case 'NO_LONGER_USING':
      return '#ffe0b2'; // Darker light orange
    case 'NOT_APPLICABLE':
      return '#f5f5f5'; // Light grey
    default:
      return '#fafafa';
  }
};

/**
 * Get the text/border color for a status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
    case 'DONE':
      return '#2e7d32'; // Green
    case 'IN_PROGRESS':
      return '#1565c0'; // Blue
    case 'NOT_STARTED':
      return '#757575'; // Grey
    case 'BLOCKED':
      return '#c62828'; // Red
    case 'NO_LONGER_USING':
      return '#e65100'; // Orange
    case 'NOT_APPLICABLE':
      return '#9e9e9e'; // Light grey
    default:
      return '#757575';
  }
};

/**
 * Get MUI color prop for status chip
 */
export const getStatusChipColor = (status: string): 'success' | 'info' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'COMPLETED':
    case 'DONE':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'BLOCKED':
    case 'NO_LONGER_USING':
      return 'error';
    case 'NOT_STARTED':
    case 'NOT_APPLICABLE':
    default:
      return 'default';
  }
};

/**
 * Get MUI color prop for update source chip
 */
export const getUpdateSourceChipColor = (source: string): 'primary' | 'success' | 'info' | 'default' => {
  switch (source) {
    case 'MANUAL':
      return 'primary';
    case 'TELEMETRY':
      return 'success';
    case 'IMPORT':
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Format status for display (replace underscores with spaces)
 */
export const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ');
};

/**
 * Get status cell styles for table cells
 */
export const getStatusCellStyles = (status: string) => ({
  backgroundColor: getStatusBackgroundColor(status),
  borderLeft: `3px solid ${getStatusColor(status)}`,
  fontWeight: 500,
});

