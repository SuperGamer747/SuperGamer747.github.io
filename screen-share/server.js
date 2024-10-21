const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Use the port from the environment variable or default to 8080
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Store active sessions in memory
let sessions = {};

// Log when the server starts
console.log(`WebSocket signaling server running on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log('A client connected');

    let userId;

    ws.on('message', (message) => {
        console.log('Received message:', message);
        const data = JSON.parse(message);

        // Handle the 'join' event to register the user ID
        if (data.action === 'join') {
            userId = data.id;
            sessions[userId] = ws; // Store WebSocket connection by user ID
            console.log(`User ${userId} has joined the session.`);
            saveSession(userId); // Save session to file
        }

        // Broadcast messages to all connected clients except the sender
        for (const id in sessions) {
            if (id !== userId && sessions[id].readyState === WebSocket.OPEN) {
                sessions[id].send(JSON.stringify(data));
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error observed:', error);
    });

    ws.on('close', () => {
        console.log('A client disconnected');
        if (userId) {
            delete sessions[userId]; // Remove session when client disconnects
            console.log(`User ${userId} has left the session.`);
            saveSessions(); // Save updated sessions to file
        }
    });
});

// Handle server errors
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// Function to save sessions to a text file
function saveSession(userId) {
    fs.appendFileSync(path.join(__dirname, 'text.txt'), `${userId}\n`, 'utf8');
}

function saveSessions() {
    fs.writeFileSync(path.join(__dirname, 'text.txt'), Object.keys(sessions).join('\n'), 'utf8');
}

// Log when the server is stopped
process.on('SIGINT', () => {
    console.log('Stopping the server...');
    wss.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});

// Additional logging for connections and disconnections
wss.on('listening', () => {
    console.log(`WebSocket server is listening on port ${PORT}`);
});
