import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Paper, Box, Typography } from '@mui/material';
import DrawingRoom from './components/DrawingRoom';
import JoinRoom from './components/JoinRoom';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CAF50', // Green color for primary
    },
    secondary: {
      main: '#FF4081', // Pink color for secondary
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          padding: '10px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

function App() {
  const [roomId, setRoomId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleJoinRoom = (roomData) => {
    setRoomId(roomData.roomId);
    setIsAdmin(roomData.isAdmin);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 800,
                background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Scribble0
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 400,
              }}
            >
              Real-time collaborative drawing game
            </Typography>
          </Box>

          <Paper
            elevation={8}
            sx={{
              p: { xs: 2, md: 4 },
              background: 'rgba(45, 45, 45, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {!roomId ? (
              <JoinRoom onJoinRoom={handleJoinRoom} />
            ) : (
              <DrawingRoom roomId={roomId} isAdmin={isAdmin} />
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
