import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Fade,
  CircularProgress,
  InputAdornment,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  ArrowForward
} from '@shared/components/FAIcon';
import { useAuth } from '../context/AuthContext';

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

export const LoginPage: React.FC = () => {
  const theme = useTheme();
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
            id: payload.userId || payload.uid, // Support both old and new JWT field names
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
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 50%, ${theme.palette.primary.main} 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)'
      }} />

      {/* Left side - Branding */}
      <Box sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        px: 8,
        position: 'relative',
        zIndex: 1
      }}>
        <Fade in timeout={800}>
          <Box>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
              }}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                  DAP
                </Typography>
              </Box>
            </Box>

            <Typography sx={{
              fontSize: '3.5rem',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              mb: 3,
              letterSpacing: '-0.02em'
            }}>
              Dynamic<br />Adoption<br />Platform
            </Typography>

            <Typography sx={{
              fontSize: '1.25rem',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '400px',
              lineHeight: 1.7,
              mb: 4
            }}>
              Centralized logic for product and solution adoption.
            </Typography>

            {/* Feature highlights */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {['Product & Task Management', 'Solution Bundling', 'Customer Management', 'Adoption Tracking'].map((feature, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main'
                  }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* Right side - Login form */}
      <Box sx={{
        flex: { xs: 1, md: 0.6 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        position: 'relative',
        zIndex: 1
      }}>
        <Fade in={showLogin} timeout={600}>
          <Container maxWidth="xs">
            {/* Mobile logo */}
            <Box sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 2,
              mb: 4,
              justifyContent: 'center'
            }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                  DAP
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                Dynamic Adoption Platform
              </Typography>
            </Box>

            {/* Login Card */}
            <Box sx={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              p: 4,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography sx={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 1
                }}>
                  Welcome back
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                  Sign in to your account
                </Typography>
              </Box>

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
                <TextField
                  fullWidth
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'divider' },
                      '&:hover fieldset': { borderColor: 'action.hover' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                    },
                    '& .MuiInputBase-input': {
                      color: '#1e293b',
                      fontSize: '1rem',
                      py: 1.5,
                      '&::placeholder': { color: '#94a3b8', opacity: 1 }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'divider' },
                      '&:hover fieldset': { borderColor: 'action.hover' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                    },
                    '& .MuiInputBase-input': {
                      color: '#1e293b',
                      fontSize: '1rem',
                      py: 1.5,
                      '&::placeholder': { color: '#94a3b8', opacity: 1 }
                    }
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  size="large"
                  endIcon={!loading && <ArrowForward />}
                  sx={{
                    py: 1.75,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                      transform: 'translateY(-1px)'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled'
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
            </Box>

            {/* Footer */}
            <Typography sx={{
              textAlign: 'center',
              mt: 4,
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.85rem'
            }}>
              © {new Date().getFullYear()} Cisco Systems. All rights reserved.
            </Typography>
          </Container>
        </Fade>
      </Box>
    </Box>
  );
};
