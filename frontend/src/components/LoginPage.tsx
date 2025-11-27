import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Container,
  Fade,
  CircularProgress,
  Link,
  Stack
} from '@mui/material';
import { 
  Dashboard, 
  TrendingUp, 
  Group, 
  CheckCircle,
  Lock
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

export const LoginPage: React.FC = () => {
  const { setToken, setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [login, { loading }] = useMutation(LOGIN);
  
  useEffect(() => {
    // Gently clear auth data on mount (to avoid aborting in-flight requests)
    // Only clear if not already cleared
    const hasToken = localStorage.getItem('token');
    const hasUser = localStorage.getItem('user');
    
    if (hasToken || hasUser) {
      // Clear auth-related items only
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
    
    // Show login form after a brief animation
    setTimeout(() => setShowLogin(true), 300);
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
        // Set the token
        setToken(res.data.login);
        
        // Decode and set user info from JWT
        try {
          const payload = JSON.parse(atob(res.data.login.split('.')[1]));
          setUser({
            id: payload.uid,
            username: payload.username || username,
            email: payload.email,
            fullName: payload.fullName,
            isAdmin: payload.isAdmin || payload.role === 'ADMIN'
          });
        } catch (err) {
          // Fallback if JWT decode fails
          setUser({ username });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid username or password. Please try again.');
    }
  };
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#0D274D',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        filter: 'blur(60px)'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '-30%',
        left: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        filter: 'blur(60px)'
      }} />
      
      <Container maxWidth="lg" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 4, md: 8 },
          width: '100%'
        }}>
          {/* Left Side - Marketing Content */}
          <Fade in timeout={800}>
            <Box sx={{ flex: 1, color: 'white' }}>
              {/* Logo/Icon */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 4
              }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Dashboard sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  letterSpacing: '-0.5px'
                }}>
                  Dynamic Adoption Plans
                </Typography>
              </Box>
              
              <Typography variant="h3" sx={{ 
                fontWeight: 800,
                mb: 2,
                lineHeight: 1.2,
                fontSize: { xs: '2rem', md: '3rem' }
              }}>
                Accelerate Customer Success
              </Typography>
              
              <Typography variant="h6" sx={{ 
                mb: 4,
                opacity: 0.95,
                lineHeight: 1.6,
                fontWeight: 400
              }}>
                Streamline product adoption with intelligent planning, tracking, and analytics.
              </Typography>
              
              {/* Feature List */}
              <Stack spacing={2.5} sx={{ mb: 4 }}>
                {[
                  { icon: <TrendingUp />, text: 'Track adoption progress in real-time' },
                  { icon: <Group />, text: 'Manage customers and solutions effortlessly' },
                  { icon: <CheckCircle />, text: 'Data-driven insights and reporting' }
                ].map((feature, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {React.cloneElement(feature.icon, { sx: { fontSize: 20 } })}
                    </Box>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      {feature.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Fade>
          
          {/* Right Side - Login Form */}
          <Fade in={showLogin} timeout={1000}>
            <Box sx={{ 
              flex: { xs: 1, md: 0.5 },
              width: { xs: '100%', sm: '450px' }
            }}>
              <Paper elevation={24} sx={{ 
                p: 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}>
                    <Lock sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700,
                    mb: 1,
                    color: 'text.primary'
                  }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sign in to access your dashboard
                  </Typography>
                </Box>
                
                {errorMsg && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
                    {errorMsg}
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit}>
                  <TextField 
                    fullWidth 
                    label="Username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    margin="normal"
                    required
                    autoFocus
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />
                  <TextField 
                    fullWidth 
                    label="Password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    margin="normal"
                    required
                    disabled={loading}
                    sx={{ mb: 3 }}
                  />
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
                      textTransform: 'none',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
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
              </Paper>
            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
};
