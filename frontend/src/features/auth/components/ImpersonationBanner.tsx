import * as React from 'react';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import { SwapHoriz as SwapIcon, Close as CloseIcon } from '@mui/icons-material';
import { useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { END_IMPERSONATION } from '../graphql/impersonation';

/**
 * A persistent banner displayed at the top of the app when an admin is impersonating another user.
 * Shows the impersonated user's email and provides a button to end impersonation.
 */
export function ImpersonationBanner() {
    const theme = useTheme();
    const { isImpersonating, user, originalAdminUser, endImpersonation } = useAuth();
    const [endImpersonationMutation, { loading }] = useMutation(END_IMPERSONATION);

    // Debug logging
    console.log('🔍 ImpersonationBanner render:', { isImpersonating, user: user?.email, originalAdminUser: originalAdminUser?.email });

    if (!isImpersonating) {
        return null;
    }

    const handleEndImpersonation = async () => {
        try {
            // Call the backend to invalidate the impersonation session
            await endImpersonationMutation();
        } catch (error) {
            // Even if the backend call fails, still restore admin credentials
            console.warn('Failed to end impersonation on server:', error);
        }

        // Restore admin credentials locally
        endImpersonation();
    };

    const impersonatedUser = user?.email || user?.username || 'Unknown User';
    const adminUser = originalAdminUser?.email || originalAdminUser?.username || 'Admin';

    return (
        <Box
            sx={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                zIndex: theme.zIndex.appBar + 1,
                backgroundColor: alpha(theme.palette.warning.main, 0.95),
                color: theme.palette.warning.contrastText,
                py: 1,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                boxShadow: theme.shadows[2],
            }}
        >
            <SwapIcon fontSize="small" />

            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                <strong>{adminUser}</strong> is impersonating <strong>{impersonatedUser}</strong>
            </Typography>

            <Button
                variant="contained"
                size="small"
                color="inherit"
                onClick={handleEndImpersonation}
                disabled={loading}
                startIcon={<CloseIcon fontSize="small" />}
                sx={{
                    ml: 1,
                    backgroundColor: alpha(theme.palette.common.black, 0.2),
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.common.black, 0.3),
                    },
                    color: 'inherit',
                    fontWeight: 600,
                }}
            >
                {loading ? 'Ending...' : 'Return to Admin'}
            </Button>
        </Box>
    );
}
