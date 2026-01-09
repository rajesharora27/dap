import * as React from 'react';
import { Box, Typography, Button, Chip, useTheme, alpha } from '@mui/material';
import { SwapHoriz as SwapIcon, ExitToApp as ExitIcon } from '@mui/icons-material';
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

    // Use a consistent accent color that works with both light and dark themes
    const bannerBg = theme.palette.mode === 'dark'
        ? `linear-gradient(90deg, ${alpha(theme.palette.info.dark, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`
        : `linear-gradient(90deg, ${alpha(theme.palette.info.main, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 9999,
                background: bannerBg,
                backdropFilter: 'blur(8px)',
                color: theme.palette.common.white,
                py: 1,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.15)}`,
                minHeight: '44px',
            }}
        >
            <SwapIcon sx={{ fontSize: '1.1rem', opacity: 0.9 }} />

            <Typography
                variant="body2"
                sx={{
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                Viewing as
                <Chip
                    label={impersonatedUser}
                    size="small"
                    sx={{
                        backgroundColor: alpha(theme.palette.common.white, 0.2),
                        color: 'inherit',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        height: '24px',
                        '& .MuiChip-label': { px: 1.5 },
                    }}
                />
            </Typography>

            <Button
                variant="text"
                size="small"
                onClick={handleEndImpersonation}
                disabled={loading}
                endIcon={<ExitIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                    ml: 1,
                    color: 'inherit',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                    borderRadius: '20px',
                    px: 2,
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.2),
                    },
                }}
            >
                {loading ? 'Returning...' : 'Return to Admin'}
            </Button>
        </Box>
    );
}

