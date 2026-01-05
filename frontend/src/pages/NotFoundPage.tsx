/**
 * 404 Not Found Page
 * 
 * Professional error page for unknown routes.
 * Uses React Router navigation to respect the basename configuration.
 * 
 * @module pages/NotFoundPage
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { Home, ArrowBack, Search } from '@mui/icons-material';

/**
 * NotFoundPage Component
 * 
 * Displays a user-friendly 404 error page with:
 * - Clear visual indication of the error
 * - The requested path (helpful for debugging)
 * - Multiple navigation options (home, back, search suggestions)
 * 
 * @example
 * ```tsx
 * <Route path="*" element={<NotFoundPage />} />
 * ```
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const suggestedLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Products', path: '/products' },
    { label: 'Solutions', path: '/solutions' },
    { label: 'Customers', path: '/customers' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        p: 4,
        textAlign: 'center',
      }}
    >
      {/* Large 404 Display */}
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '6rem', md: '10rem' },
          fontWeight: 800,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          mb: 2,
        }}
      >
        404
      </Typography>

      {/* Error Message */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 600, color: 'text.primary' }}
      >
        Page Not Found
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 2, maxWidth: 500 }}
      >
        The page you're looking for doesn't exist, has been moved, or you don't have permission to access it.
      </Typography>

      {/* Requested Path Display */}
      <Paper
        variant="outlined"
        sx={{
          px: 3,
          py: 1.5,
          mb: 4,
          bgcolor: 'action.hover',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: 'monospace' }}
        >
          Requested: <strong>{location.pathname}</strong>
        </Typography>
      </Paper>

      {/* Action Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Home />}
          onClick={() => navigate('/dashboard')}
          sx={{ minWidth: 160 }}
        >
          Go to Dashboard
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ minWidth: 160 }}
        >
          Go Back
        </Button>
      </Stack>

      {/* Suggested Links */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
        >
          <Search fontSize="small" />
          Or try one of these pages:
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}
        >
          {suggestedLinks.map((link) => (
            <Button
              key={link.path}
              variant="text"
              size="small"
              onClick={() => navigate(link.path)}
              sx={{ textTransform: 'none' }}
            >
              {link.label}
            </Button>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default NotFoundPage;

