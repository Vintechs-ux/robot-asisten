const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 7071 });
let connectedClients = [];
let commandCallbacks = new Map();

wss.on('connection', function connection(ws) {
  console.log('Laptop terhubung melalui WebSocket');
  connectedClients.push(ws);

  ws.on('message', function incoming(message) {
    try {
      const response = JSON.parse(message);
      console.log('Dari Laptop:', response);

   
      const callback = commandCallbacks.get(response.token);
      if (callback) {
        callback(response);
        commandCallbacks.delete(response.token);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    connectedClients = connectedClients.filter(client => client !== ws);
    console.log('Laptop terputus');
  });
});

function sendCommandToClients(data) {
  return new Promise((resolve, reject) => {
    if (connectedClients.length === 0) {
      reject(new Error('Tidak ada laptop yang terhubung'));
      return;
    }

    const token = data.token;
    if (!token) {
      reject(new Error('Token tidak ditemukan'));
      return;
    }

  
    if (typeof data.command === 'string') {
      data = {
        token: data.token,
        command: {
          type: "shell_command",
          command: data.command
        }
      };
    }

    const timeoutId = setTimeout(() => {
      commandCallbacks.delete(token);
      reject(new Error('Command timeout'));
    }, 60000);

    commandCallbacks.set(token, (response) => {
      clearTimeout(timeoutId);
      resolve(response);
    });

    connectedClients.forEach(client => {
      client.send(JSON.stringify(data));
    });
  });
}

module.exports = { sendCommandToClients };
