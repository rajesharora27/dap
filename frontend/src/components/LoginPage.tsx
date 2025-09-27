import * as React from 'react';
import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Box, Paper, TextField, Button, Typography } from '@mui/material';
import { useAuth } from './AuthContext';

const SIMPLE_LOGIN = gql`mutation SimpleLogin($username:String!,$password:String!){ simpleLogin(username:$username,password:$password) }`;

export const LoginPage: React.FC = () => {
  const { setToken } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [login, { loading, error }] = useMutation(SIMPLE_LOGIN);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login({ variables: { username, password } });
    if (res.data?.simpleLogin) setToken(res.data.simpleLogin);
  };
  return (
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', bgcolor:'#f5f5f5', p:2 }}>
      <Paper elevation={3} sx={{ p:4, width:360 }}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <Typography variant="body2" sx={{ mb:2 }}>Use admin / admin while fallback auth is enabled.</Typography>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Username" value={username} onChange={e=>setUsername(e.target.value)} margin="normal" autoFocus />
          <TextField fullWidth label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} margin="normal" />
          <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt:2 }}>Login</Button>
          {error && <Typography color="error" variant="body2" sx={{ mt:1 }}>{error.message}</Typography>}
        </form>
      </Paper>
    </Box>
  );
};
