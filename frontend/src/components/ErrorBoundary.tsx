import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { captureException } from '../lib/sentry';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches React errors and reports them to Sentry
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);

        // Report to Sentry
        captureException(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true
        });

        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });

        // Optionally reload the page
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <Container maxWidth="md" sx={{ mt: 8 }}>
                    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                        <Box sx={{ mb: 3 }}>
                            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
                        </Box>

                        <Typography variant="h4" gutterBottom>
                            Oops! Something went wrong
                        </Typography>

                        <Typography variant="body1" color="text.secondary" paragraph>
                            We're sorry for the inconvenience. The error has been reported and we'll look into it.
                        </Typography>

                        {import.meta.env.DEV && this.state.error && (
                            <Box sx={{ my: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
                                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {this.state.error.toString()}
                                </Typography>
                                {this.state.errorInfo && (
                                    <Typography variant="caption" component="pre" sx={{ mt: 2, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                                        {this.state.errorInfo.componentStack}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Box sx={{ mt: 4 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<RefreshIcon />}
                                onClick={this.handleReset}
                            >
                                Reload Application
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
