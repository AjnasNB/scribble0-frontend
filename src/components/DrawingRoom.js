import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Slider, Typography, Paper, Stack, Alert, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  '& .MuiSlider-thumb': {
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}20`,
    },
  },
}));

const DrawingRoom = ({ roomId, isAdmin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const canvasWidth = isMobile ? window.innerWidth - 32 : (isTablet ? Math.min(600, window.innerWidth - 64) : 800);
  const canvasHeight = isMobile ? window.innerHeight * 0.5 : (isTablet ? window.innerHeight * 0.6 : 600);

  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [error, setError] = useState(null);
  const [brushSize, setBrushSize] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io(BACKEND_URL);
    
    // Join room
    socketRef.current.emit('joinRoom', { roomId, isAdmin });

    // Handle joined event
    socketRef.current.on('joined', ({ playerCount: count, maxPlayers: max, gameStarted }) => {
      setPlayerCount(count);
      setMaxPlayers(max);
      setTimerRunning(gameStarted);
    });

    // Handle player count updates
    socketRef.current.on('playerCountUpdate', ({ playerCount: count, maxPlayers: max }) => {
      setPlayerCount(count);
      setMaxPlayers(max);
    });

    // Handle drawing from other user
    socketRef.current.on('draw', (data) => {
      draw(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
    });

    // Handle timer events
    socketRef.current.on('timerStart', ({ duration }) => {
      setTimer(duration);
      setTimerRunning(true);
    });

    socketRef.current.on('timerEnd', () => {
      setTimerRunning(false);
      setTimer(0);
    });

    socketRef.current.on('gameStopped', () => {
      setTimerRunning(false);
      setTimer(0);
      clearCanvas();
    });

    socketRef.current.on('error', ({ message }) => {
      setError(message);
    });

    socketRef.current.on('adminLeft', () => {
      setError('Admin has left the room');
    });

    socketRef.current.on('canvasCleared', () => {
      const context = canvasRef.current.getContext('2d');
      context.clearRect(0, 0, canvasWidth, canvasHeight);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, isAdmin, canvasWidth, canvasHeight]);

  useEffect(() => {
    let interval;
    if (timerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timer]);

  const draw = (x0, y0, x1, y1, color, size) => {
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = size;
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
    context.closePath();
  };

  const startDrawing = (e) => {
    if (isAdmin || !timerRunning) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    draw(x, y, x, y, 'black', brushSize);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleDrawing = (e) => {
    if (!isDrawing || isAdmin || !timerRunning) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draw(x - 1, y - 1, x, y, 'black', brushSize);
    socketRef.current.emit('draw', {
      x0: x - 1,
      y0: y - 1,
      x1: x,
      y1: y,
      color: 'black',
      size: brushSize
    });
  };

  const clearCanvas = () => {
    const context = canvasRef.current.getContext('2d');
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    if (isAdmin) {
      socketRef.current.emit('clearCanvas', { roomId });
    }
  };

  const startTimer = (duration) => {
    socketRef.current.emit('setTimer', { roomId, duration });
  };

  const stopGame = () => {
    socketRef.current.emit('stopGame', { roomId });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: { xs: 2, sm: 3 },
      width: '100%',
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 }, width: '100%' }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          sx={{ 
            color: 'primary.main', 
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
          }}
        >
          Scribble0 Room: {roomId}
        </Typography>
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          sx={{ 
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <Box component="span" sx={{ 
            color: playerCount === maxPlayers ? 'error.main' : 'success.main',
            fontWeight: 'bold'
          }}>
            {playerCount}
          </Box>
          / {maxPlayers} players connected
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {error}
        </Alert>
      )}
      
      {isAdmin && (
        <Paper 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            width: '100%', 
            maxWidth: canvasWidth,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 3,
          }}
        >
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom 
            sx={{ color: 'primary.main' }}
          >
            Admin Controls
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography 
                gutterBottom 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Timer Duration: {timer} seconds
              </Typography>
              <StyledSlider
                value={timer}
                onChange={(e, value) => setTimer(value)}
                min={0}
                max={300}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}s`}
              />
            </Box>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
            >
              <Button
                variant="contained"
                onClick={() => startTimer(timer)}
                disabled={timerRunning || playerCount < 1}
                sx={{
                  py: { xs: 1, sm: 1.5 },
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                }}
              >
                Start Game
              </Button>
              {timerRunning && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={stopGame}
                  sx={{
                    py: { xs: 1, sm: 1.5 },
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                  }}
                >
                  Stop Game
                </Button>
              )}
            </Stack>
          </Stack>
          {playerCount === 0 && (
            <Typography 
              sx={{ 
                mt: 2, 
                color: 'warning.main',
                textAlign: 'center',
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Waiting for players to join...
            </Typography>
          )}
        </Paper>
      )}

      {!isAdmin && !timerRunning && (
        <Alert 
          severity="info" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Waiting for admin to start the game...
        </Alert>
      )}

      {timerRunning && (
        <Typography 
          variant={isMobile ? "h5" : "h4"}
          sx={{ 
            color: 'primary.main',
            fontWeight: 600,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
          }}
        >
          Time Remaining: {timer}s
        </Typography>
      )}

      {!isAdmin && (
        <Paper 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            width: '100%', 
            maxWidth: canvasWidth,
            mb: { xs: 1, sm: 2 },
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 3,
          }}
        >
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom 
            sx={{ color: 'primary.main' }}
          >
            Brush Size
          </Typography>
          <StyledSlider
            value={brushSize}
            onChange={(e, value) => setBrushSize(value)}
            min={1}
            max={20}
            valueLabelDisplay="auto"
            disabled={!timerRunning}
          />
        </Paper>
      )}

      <Paper
        elevation={8}
        sx={{
          p: { xs: 1, sm: 2 },
          backgroundColor: '#fff',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden',
          width: 'fit-content',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4CAF50, #81C784)',
          },
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={handleDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={handleDrawing}
          style={{
            border: '1px solid #eee',
            borderRadius: '12px',
            cursor: isAdmin ? 'default' : (timerRunning ? 'crosshair' : 'not-allowed'),
            width: '100%',
            height: '100%',
            touchAction: 'none'
          }}
        />
      </Paper>

      {isAdmin && (
        <Button
          variant="outlined"
          onClick={clearCanvas}
          sx={{ 
            mt: { xs: 1, sm: 2 },
            borderRadius: 2,
            borderWidth: 2,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '&:hover': {
              borderWidth: 2,
            },
          }}
        >
          Clear Canvas
        </Button>
      )}
    </Box>
  );
};

export default DrawingRoom; 