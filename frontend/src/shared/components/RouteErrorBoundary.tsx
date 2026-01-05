/**
 * Route Error Boundary
 * 
 * Granular error boundary for individual routes.
 * Catches errors within a specific route without crashing the entire app,
 * allowing users to navigate away using the sidebar.
 * 
 * @module shared/components/RouteErrorBoundary
 */

import React, { Component, ErrorInfo } from 'react';
import { Box, Typography, Button, Paper, Stack, Alert, Collapse } from '@mui/material';
import { 
  ErrorOutline as ErrorIcon, 
  Home as HomeIcon, 
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon 
} from '@mui/icons-material';

interface RouteErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Name of the route/feature for error messaging */
  routeName?: string;
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * RouteErrorBoundary
 * 
 * Catches JavaScript errors anywhere in child component tree and displays
 * a fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Granular per-route error isolation
 * - User-friendly error message
 * - Navigation options to escape the error state
 * - Expandable technical details for debugging
 * - Retry functionality
 * 
 * @example
 * ```tsx
 * <RouteErrorBoundary routeName="Products">
 *   <ProductsPage />
 * </RouteErrorBoundary>
 * ```
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for debugging
    console.error(`[RouteErrorBoundary] Error in ${this.props.routeName || 'route'}:`, error);
    console.error('[RouteErrorBoundary] Component stack:', errorInfo.componentStack);
    
    this.setState({ errorInfo });
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleGoHome = (): void => {
    // Navigate to dashboard - works because router is above this boundary
    window.location.href = '/dashboard';
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { routeName = 'This page' } = this.props;
      const { error, errorInfo, showDetails } = this.state;

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'error.light',
              borderRadius: 2,
              bgcolor: 'error.50',
            }}
          >
            {/* Error Icon */}
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />

            {/* Error Title */}
            <Typography variant="h5" gutterBottom fontWeight={600} color="error.dark">
              {routeName} failed to load
            </Typography>

            {/* Error Description */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Something went wrong while loading this section. The rest of the app is still working—you can navigate to another page using the sidebar.
            </Typography>

            {/* Error Message Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, textAlign: 'left' }}
              >
                <Typography variant="body2" fontFamily="monospace">
                  {error.message || 'An unexpected error occurred'}
                </Typography>
              </Alert>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Go to Dashboard
              </Button>
            </Stack>

            {/* Expandable Technical Details */}
            {errorInfo && (
              <>
                <Button
                  size="small"
                  onClick={this.toggleDetails}
                  endIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  }
                  sx={{ mt: 1, color: 'text.secondary' }}
                >
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>
                <Collapse in={showDetails}>
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                      textAlign: 'left',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        m: 0,
                      }}
                    >
                      {error?.stack || 'No stack trace available'}
                      {'\n\nComponent Stack:'}
                      {errorInfo.componentStack}
                    </Typography>
                  </Paper>
                </Collapse>
              </>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for RouteErrorBoundary with easier integration
 */
export const withRouteErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  routeName: string
): React.FC<P> => {
  const WithRouteErrorBoundary: React.FC<P> = (props) => (
    <RouteErrorBoundary routeName={routeName}>
      <WrappedComponent {...props} />
    </RouteErrorBoundary>
  );
  
  WithRouteErrorBoundary.displayName = `WithRouteErrorBoundary(${routeName})`;
  return WithRouteErrorBoundary;
};

export default RouteErrorBoundary;

