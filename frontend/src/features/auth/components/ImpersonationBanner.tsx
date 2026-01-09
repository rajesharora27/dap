import * as React from 'react';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import { SwapHoriz as SwapIcon } from '@mui/icons-material';
import { useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { END_IMPERSONATION } from '../graphql/impersonation';

/**
 * A sleek, aesthetic banner displayed when an admin is impersonating another user.
 * Designed to be subtle but visible, suitable for demos.
 */
export function ImpersonationBanner() {
    const theme = useTheme();
    const { isImpersonating, user, originalAdminUser, endImpersonation } = useAuth();
    const [endImpersonationMutation, { loading }] = useMutation(END_IMPERSONATION);

    // Check localStorage as fallback
    const lsIsImpersonating = typeof window !== 'undefined' && localStorage.getItem('isImpersonating') === 'true';

    if (!isImpersonating && !lsIsImpersonating) {
        return null;
    }

    const handleEndImpersonation = async () => {
        try {
            await endImpersonationMutation();
        } catch (error) {
            console.warn('Failed to end impersonation on server:', error);
        }
        endImpersonation();
    };

    const impersonatedUser = user?.fullName || user?.email || user?.username || 'User';
    const adminUser = originalAdminUser?.fullName || originalAdminUser?.email || originalAdminUser?.username || 'Admin';

    // Transparent background to blend with header color
    // Centered at the top
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999, // Above AppBar
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                py: 1,
                px: 3,
                mt: 0.5, // Slight top margin to center vertically in standard toolbar
                pointerEvents: 'auto', // Ensure button is clickable
                borderRadius: '20px',
                // Optional: very subtle background for legibility if needed, or completely transparent
                backgroundColor: alpha(theme.palette.common.black, 0.1),
                backdropFilter: 'blur(4px)',
                border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    color: theme.palette.common.white,
                    fontStyle: 'italic', // As requested
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
            >
                <SwapIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} />
                Viewing as {impersonatedUser}
            </Typography>

            <Button
                variant="outlined"
                size="small"
                onClick={handleEndImpersonation}
                disabled={loading}
                sx={{
                    color: theme.palette.common.white,
                    borderColor: alpha(theme.palette.common.white, 0.3),
                    borderWidth: '1px',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    py: 0.25,
                    px: 1.5,
                    minWidth: 'auto',
                    height: '24px',
                    fontStyle: 'normal', // Button text normal
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                        borderColor: alpha(theme.palette.common.white, 0.5),
                    },
                }}
            >
                {loading ? '...' : 'Return'}
            </Button>
        </Box>
    );
}
