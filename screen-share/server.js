const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8080 });
const activeSessions = {}; // Store active sessions by ID

wss.on('connection', function connection(ws) {
    console.log('A client connected');

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);

        // Handle join actions and prevent duplicate IDs
        if (data.action === 'join') {
            if (!activeSessions[data.id]) {
                activeSessions[data.id] = ws; // Register new session
                ws.sessionId = data.id;
                console.log(`New session created for ID: ${data.id}`);
                saveSessionsToFile(); // Save to file when a new session starts
            } else if (activeSessions[data.id] === ws) {
                console.log(`Rejoining session for ID: ${data.id}`);
            } else {
                // If the session ID already exists, send an error
                ws.send(JSON.stringify({ error: 'Session already in use. Please choose a different ID.' }));
                console.log(`Session ID ${data.id} is already in use.`);
                return; // Exit if the ID is already in use
            }
        }

        // Relay offers, answers, and ICE candidates
        if (data.offer || data.answer || data.candidate) {
            if (activeSessions[data.id]) {
                activeSessions[data.id].send(JSON.stringify(data));
                console.log(`Relaying message for ID: ${data.id}`);
            }
        }
    });

    ws.on('close', () => {
        // Remove session on disconnect
        const sessionId = ws.sessionId;
        if (sessionId) {
            delete activeSessions[sessionId];
            console.log(`Session ID ${sessionId} has been closed.`);
            saveSessionsToFile(); // Save to file when a session ends
        }
    });
});

// Save active sessions to a file
function saveSessionsToFile() {
    fs.writeFile('text.txt', JSON.stringify(activeSessions), (err) => {
        if (err) {
            console.error('Error saving sessions:', err);
        } else {
            console.log('Sessions saved successfully.');
        }
    });
}

console.log('WebSocket signaling server running on ws://localhost:8080');
