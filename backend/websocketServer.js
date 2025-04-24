const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 7071 });
let connectedClients = [];

wss.on('connection', function connection(ws) {
  console.log('Laptop terhubung melalui WebSocket');
  connectedClients.push(ws);

  ws.on('message', function incoming(message) {
    console.log('Dari Laptop:', message);
  });

  ws.on('close', () => {
    connectedClients = connectedClients.filter(client => client !== ws);
    console.log('Laptop terputus');
  });
});

function sendCommandToClients(command) {
  connectedClients.forEach(client => {
    client.send(JSON.stringify({ command }));
  });
}

module.exports = { sendCommandToClients };
