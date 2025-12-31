import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Fade,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
} from '@shared/components/FAIcon';
import { useAuth } from '../context/AuthContext';

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

// Geometric dot pattern SVG for background texture
const DotPattern = () => (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0.08,
      pointerEvents: 'none',
    }}
  >
    <defs>
      <pattern id="dotPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dotPattern)" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { setToken, setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [login, { loading }] = useMutation(LOGIN);

  useEffect(() => {
    const hasToken = localStorage.getItem('token');
    const hasUser = localStorage.getItem('user');

    if (hasToken || hasUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }

    setTimeout(() => setShowLogin(true), 200);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password');
      return;
    }

    try {
      const res = await login({ variables: { username: username.trim(), password } });

      if (res.data?.login) {
        setToken(res.data.login);

        try {
          const payload = JSON.parse(atob(res.data.login.split('.')[1]));
          setUser({
            id: payload.userId || payload.uid,
            username: payload.username || username,
            email: payload.email,
            fullName: payload.fullName,
            isAdmin: payload.isAdmin || payload.role === 'ADMIN',
            role: payload.role,
            roles: payload.roles || [],
            permissions: payload.permissions || { products: [], solutions: [], customers: [], system: false }
          });
        } catch (err) {
          setUser({ username });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid username or password');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
    }}>
      {/* Left Panel - Branding */}
      <Box sx={{
        flex: { xs: 'none', md: 1 },
        minHeight: { xs: '200px', md: '100vh' },
        background: 'linear-gradient(160deg, #003653 0%, #005073 50%, #004666 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: { xs: 'center', md: 'flex-start' },
        px: { xs: 4, md: 8 },
        py: { xs: 6, md: 0 },
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Geometric dot pattern overlay */}
        <DotPattern />

        {/* Subtle gradient orbs for depth */}
        <Box sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Fade in={showLogin} timeout={800}>
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            {/* DAP Logo */}
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              mb: 4,
            }}>
              <Typography sx={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.02em',
              }}>
                DAP
              </Typography>
            </Box>

            {/* Main Heading */}
            <Typography sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              mb: 2,
              letterSpacing: '-0.01em',
            }}>
              Digital Adoption Platform
            </Typography>

            {/* Subtitle */}
            <Typography sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '380px',
              lineHeight: 1.6,
              fontWeight: 400,
            }}>
              Centralized logic for product and solution adoption.
            </Typography>
          </Box>
        </Fade>
      </Box>

      {/* Right Panel - Login Form */}
      <Box sx={{
        flex: { xs: 1, md: 1 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f7fa',
        p: { xs: 3, md: 6 },
        minHeight: { xs: 'calc(100vh - 200px)', md: '100vh' },
      }}>
        <Fade in={showLogin} timeout={600}>
          <Box sx={{
            width: '100%',
            maxWidth: 420,
          }}>
            {/* Login Card */}
            <Box sx={{
              bgcolor: 'white',
              borderRadius: 3,
              p: { xs: 4, md: 5 },
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            }}>
              {/* Welcome Header */}
              <Typography sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5,
              }}>
                Welcome Back
              </Typography>
              <Typography sx={{
                color: '#64748b',
                fontSize: '0.95rem',
                mb: 4,
              }}>
                Sign in to continue
              </Typography>

              {errorMsg && (
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => setErrorMsg('')}
                >
                  {errorMsg}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                {/* Username Field */}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', mb: 1 }}>
                  Username
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                      '&.Mui-focused fieldset': { borderColor: '#005073', borderWidth: 2 },
                    },
                    '& .MuiInputBase-input': {
                      color: '#1e293b',
                      fontSize: '0.95rem',
                      py: 1.5,
                      '&::placeholder': { color: '#94a3b8', opacity: 1 }
                    }
                  }}
                />

                {/* Password Field */}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', mb: 1 }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                      '&.Mui-focused fieldset': { borderColor: '#005073', borderWidth: 2 },
                    },
                    '& .MuiInputBase-input': {
                      color: '#1e293b',
                      fontSize: '0.95rem',
                      py: 1.5,
                      '&::placeholder': { color: '#94a3b8', opacity: 1 }
                    }
                  }}
                />

                {/* Sign In Button */}
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  size="large"
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    bgcolor: '#005073',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(0,80,115,0.25)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#003653',
                      boxShadow: '0 6px 16px rgba(0,80,115,0.35)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#cbd5e1',
                      color: '#94a3b8',
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Copyright Footer - inside card */}
              <Typography sx={{
                textAlign: 'center',
                mt: 4,
                pt: 3,
                borderTop: '1px solid #f1f5f9',
                color: '#94a3b8',
                fontSize: '0.8rem',
              }}>
                © {new Date().getFullYear()} Cisco Systems
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};
