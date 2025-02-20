import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Slider, Typography, Paper, Stack, Alert, useTheme, useMediaQuery, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { styled } from '@mui/material/styles';
import io from 'socket.io-client';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import RectangleOutlinedIcon from '@mui/icons-material/CropSquareOutlined';
import CreateIcon from '@mui/icons-material/Create';
import PanToolIcon from '@mui/icons-material/PanTool';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Socket.IO connection options
const socketOptions = {
  transports: ['websocket'],
  secure: true,
  rejectUnauthorized: false,
  path: '/socket.io',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  forceNew: true,
  timeout: 10000,
  autoConnect: false,
  withCredentials: true
};

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  '& .MuiSlider-thumb': {
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}20`,
    },
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderRadius: 8,
  '& .MuiToggleButton-root': {
    color: theme.palette.text.secondary,
    borderColor: 'rgba(255,255,255,0.1)',
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
  const [tool, setTool] = useState('pencil');
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    // Create Socket.IO instance with modified URL to ensure WSS
    const url = new URL(BACKEND_URL);
    url.protocol = url.protocol.replace('http', 'ws');
    
    // Connect to Socket.IO server with options
    socketRef.current = io(url.toString(), socketOptions);
    socketRef.current.connect();
    
    // Add connection error handler
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection error. Please try again.');
    });

    // Add reconnect handler
    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('Reconnected on attempt:', attemptNumber);
      setError(null);
    });

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
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
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

  const getCoordinates = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (event.type.includes('touch')) {
      // For touch events
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      // For mouse events
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  };

  const startDrawing = (e) => {
    if (isAdmin || !timerRunning) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    if (tool === 'pencil') {
      setIsDrawing(true);
      draw(x, y, x, y, 'black', brushSize);
    } else if (tool === 'move') {
      const clickedShape = findShapeAtPosition(x, y);
      if (clickedShape) {
        setSelectedShape(clickedShape);
        setIsMoving(true);
        setStartPos({ x, y });
      }
    } else {
      addShape(tool, x, y);
    }
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
    setIsMoving(false);
  };

  const handleDrawing = (e) => {
    if (!timerRunning) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (tool === 'pencil' && isDrawing) {
      draw(x - 1, y - 1, x, y, 'black', brushSize);
      socketRef.current.emit('draw', {
        x0: x - 1,
        y0: y - 1,
        x1: x,
        y1: y,
        color: 'black',
        size: brushSize
      });
    } else if (tool === 'move' && isMoving && selectedShape) {
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      moveShape(selectedShape.id, selectedShape.x + dx, selectedShape.y + dy);
      setStartPos({ x, y });
    }
  };

  // Use handleDrawing for both mouse and touch events
  const handleTouchMove = handleDrawing;

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

  const handleToolChange = (event, newTool) => {
    if (newTool !== null) {
      setTool(newTool);
      setSelectedShape(null);
    }
  };

  const addShape = (type, x, y) => {
    const newShape = {
      id: Date.now(),
      type,
      x,
      y,
      width: 50,
      height: 50,
    };
    setShapes([...shapes, newShape]);
    socketRef.current.emit('addShape', { roomId, shape: newShape });
  };

  const moveShape = (shapeId, newX, newY) => {
    setShapes(shapes.map(shape => 
      shape.id === shapeId 
        ? { ...shape, x: newX, y: newY }
        : shape
    ));
    socketRef.current.emit('moveShape', { roomId, shapeId, x: newX, y: newY });
  };

  const findShapeAtPosition = (x, y) => {
    return shapes.find(shape => {
      return x >= shape.x && 
             x <= shape.x + shape.width && 
             y >= shape.y && 
             y <= shape.y + shape.height;
    });
  };

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('shapeAdded', ({ shape }) => {
      setShapes(prevShapes => [...prevShapes, shape]);
    });

    socketRef.current.on('shapeMoved', ({ shapeId, x, y }) => {
      setShapes(prevShapes => prevShapes.map(shape =>
        shape.id === shapeId ? { ...shape, x, y } : shape
      ));
    });

    return () => {
      socketRef.current.off('shapeAdded');
      socketRef.current.off('shapeMoved');
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Clear canvas
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw all shapes
    shapes.forEach(shape => {
      context.beginPath();
      context.strokeStyle = 'black';
      context.lineWidth = 2;
      
      if (shape.type === 'circle') {
        context.arc(
          shape.x + shape.width/2,
          shape.y + shape.height/2,
          shape.width/2,
          0,
          2 * Math.PI
        );
      } else if (shape.type === 'square') {
        context.rect(shape.x, shape.y, shape.width, shape.height);
      }
      
      context.stroke();
      
      // Highlight selected shape
      if (selectedShape && selectedShape.id === shape.id) {
        context.strokeStyle = '#4CAF50';
        context.setLineDash([5, 5]);
        context.strokeRect(
          shape.x - 2,
          shape.y - 2,
          shape.width + 4,
          shape.height + 4
        );
        context.setLineDash([]);
      }
    });
  }, [shapes, selectedShape, canvasWidth, canvasHeight]);

  const renderToolbar = () => (
    <Paper 
      sx={{ 
        p: { xs: 1, sm: 2 }, 
        mb: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
      }}
    >
      <Typography 
        variant={isMobile ? "subtitle1" : "h6"} 
        gutterBottom 
        sx={{ color: 'primary.main' }}
      >
        Drawing Tools
      </Typography>
      <StyledToggleButtonGroup
        value={tool}
        exclusive
        onChange={handleToolChange}
        aria-label="drawing tools"
        size={isMobile ? "small" : "medium"}
      >
        <ToggleButton value="pencil" aria-label="pencil">
          <CreateIcon />
        </ToggleButton>
        <ToggleButton value="circle" aria-label="circle">
          <CircleOutlinedIcon />
        </ToggleButton>
        <ToggleButton value="square" aria-label="square">
          <RectangleOutlinedIcon />
        </ToggleButton>
        <ToggleButton value="move" aria-label="move">
          <PanToolIcon />
        </ToggleButton>
      </StyledToggleButtonGroup>
    </Paper>
  );

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
        <>
          {renderToolbar()}
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
              {tool === 'pencil' ? 'Brush Size' : 'Shape Size'}
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
        </>
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
          touchAction: 'none', // Prevent default touch actions
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
          onTouchCancel={stopDrawing}
          onTouchMove={handleTouchMove}
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