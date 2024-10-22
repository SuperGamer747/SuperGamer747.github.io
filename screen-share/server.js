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
            if (activeSessions[data.id]) {
                ws.send(JSON.stringify({ error: 'ID already in use' }));
            } else {
                activeSessions[data.id] = ws;
                ws.sessionId = data.id;
                console.log(`Session created with ID: ${data.id}`);
            }
        }

        // Relay offers, answers, and ICE candidates
        if (data.offer || data.answer || data.candidate) {
            if (activeSessions[data.id]) {
                activeSessions[data.id].send(JSON.stringify(data));
            }
        }
    });

    ws.on('close', () => {
        if (ws.sessionId) {
            delete activeSessions[ws.sessionId];
            console.log(`Session with ID ${ws.sessionId} closed`);
        }
    });
});

console.log('Signaling server running on port 8080');
