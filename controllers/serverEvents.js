const router = require('express').Router();
let connectedClients = new Map();

router.get('/', (req, res) => {
  // Set proper SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Transfer-Encoding': 'chunked'
  });

  // Send initial connection message
  res.write(':\n\n'); // Comment to keep connection alive

  const userId = req.refId;

  // Generate unique client ID
  const clientId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Store client
  connectedClients.set(userId, res);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    connectedClients.delete(clientId);
    res.end();
  });

  // Optional: Send initial data
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);
});

// Send to specific user only
const sendToClient = (userId, data) => {
  console.log("CLIENTID::", userId);
  const clientRes = connectedClients.get(userId);

  if (clientRes) {
    try {
      clientRes.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`Error sending to client ${userId}:`, error);
      connectedClients.delete(userId);
    }
  }
};

module.exports = {eventRouter: router, sendToClient};
