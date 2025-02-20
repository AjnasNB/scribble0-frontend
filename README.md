# Scribble0 - Real-time Drawing Game

A real-time collaborative drawing application with timer controls, admin features, and multi-player support. Players can join a room and draw together in real-time, with one user having admin controls for managing the game session.

Backend repository: [scribble0-game-backend](https://github.com/AjnasNB/scribble0-game-backend)

## Features

### Room Management
* Create and join drawing rooms with unique room IDs
* Admin controls for room management
* Support for up to 12 players per room
* Real-time player count tracking
* Automatic room cleanup when empty

### Drawing Features
* Real-time drawing synchronization between all players
* Adjustable brush size (1-20px)
* Smooth drawing experience with touch support
* Cross-device compatibility

### Admin Controls
* Start/Stop game sessions
* Adjustable timer (0-300 seconds)
* Canvas clearing capability
* Player management

### User Interface
* Modern, responsive Material-UI design
* Dark theme with green accent colors
* Mobile and tablet optimized layout
* Real-time status indicators
* Intuitive drawing controls

### Technical Features
* WebSocket-based real-time communication
* Secure WSS connection support
* Automatic reconnection handling
* Cross-origin resource sharing (CORS)
* Touch and mouse event handling

## Prerequisites

* Node.js (v14 or higher)
* npm (Node Package Manager)
* Modern web browser with WebSocket support

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Set up environment variables:
   - Create `.env` file in the client directory
   - Add backend URL:
```
REACT_APP_BACKEND_URL=https://backendscribble.ajnasnb.com
```

## Running the Application

1. Start the development server:
```bash
cd client
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

### Joining a Room
1. Enter a room ID or generate a new one
2. Choose whether to join as an admin (requires password)
3. Share the room ID with other players

### Admin Features
* Set timer duration (up to 5 minutes)
* Start/Stop the game session
* Clear canvas
* Monitor player count

### Player Features
* Draw when the game is active
* Adjust brush size
* See real-time updates from other players
* View remaining time

## Technologies Used

### Frontend
* React.js
* Material-UI
* Socket.IO Client
* CSS-in-JS styling

### Backend ([Repository](https://github.com/AjnasNB/scribble0-game-backend))
* Node.js
* Express.js
* Socket.IO
* CORS

## Security Features
* Admin password protection
* Secure WebSocket connections (WSS)
* CORS configuration
* Input validation
* Error handling

## Error Handling
* Connection error recovery
* Room full notifications
* Admin disconnection handling
* Invalid room/password alerts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

* Socket.IO team for the real-time engine
* Material-UI team for the component library
* All contributors and testers 