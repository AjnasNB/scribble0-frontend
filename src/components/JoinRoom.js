import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ADMIN_PASSWORD = 'test123';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.875rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
    },
  },
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: 'rgba(76, 175, 80, 0.08)',
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const JoinRoom = ({ onJoinRoom }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [roomId, setRoomId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    if (isAdmin && adminPassword !== ADMIN_PASSWORD) {
      setError('Incorrect admin password');
      return;
    }

    setError('');
    onJoinRoom({ roomId: roomId.trim(), isAdmin });
  };

  const generateRoomId = () => {
    if (isAdmin && adminPassword !== ADMIN_PASSWORD) {
      setError('Please enter correct admin password first');
      return;
    }
    const randomId = Math.random().toString(36).substring(2, 8);
    setRoomId(randomId);
  };

  const handleAdminToggle = (e) => {
    setIsAdmin(e.target.checked);
    if (!e.target.checked) {
      setAdminPassword('');
      setError('');
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        width: '100%',
        maxWidth: { xs: '100%', sm: 500 },
        mx: 'auto',
        px: { xs: 2, sm: 0 }
      }}
    >
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        align="center" 
        sx={{ 
          mb: { xs: 3, sm: 4 }, 
          color: 'primary.main',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
        }}
      >
        Join Drawing Room
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            borderRadius: 2,
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {error}
        </Alert>
      )}

      <Stack spacing={{ xs: 2, sm: 3 }}>
        <StyledTextField
          fullWidth
          label="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
          variant="outlined"
          placeholder="Enter room code or generate new"
        />

        <Paper 
          sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 3,
          }}
        >
          <FormControlLabel
            control={
              <StyledSwitch
                checked={isAdmin}
                onChange={handleAdminToggle}
              />
            }
            label={
              <Typography 
                sx={{ 
                  color: isAdmin ? 'primary.main' : 'text.secondary',
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Join as Admin
              </Typography>
            }
          />

          {isAdmin && (
            <StyledTextField
              fullWidth
              label="Admin Password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              variant="outlined"
              error={!!error}
              sx={{ mt: 2 }}
              placeholder="Enter admin password"
            />
          )}
        </Paper>

        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={generateRoomId}
          disabled={isAdmin && !adminPassword}
          sx={{
            py: { xs: 1.25, sm: 1.5 },
            fontSize: { xs: '1rem', sm: '1.1rem' },
            boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)',
          }}
        >
          Generate New Room
        </Button>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={!roomId.trim() || (isAdmin && !adminPassword)}
          sx={{
            py: { xs: 1.25, sm: 1.5 },
            fontSize: { xs: '1rem', sm: '1.1rem' },
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
          }}
        >
          Join Room
        </Button>
      </Stack>
    </Box>
  );
};

export default JoinRoom; 