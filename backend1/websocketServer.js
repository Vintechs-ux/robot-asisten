  const WebSocket = require('ws');
  const { analyzeIntent } = require('./utils/aiHandler');
  const commandMap = require('./config/shellCommandMap');
  const gTTS = require('gtts');
  const path = require('path');
  const fs = require('fs');

  const wss = new WebSocket.Server({ port: 7071 });
  let connectedClients = new Map();

  wss.on('connection', function connection(ws) {
    console.log('✓ Client connected');
    
    ws.on('message', async function incoming(message, isBinary) {
      if (isBinary) {
        return;
      }

      try {
        const data = JSON.parse(message);
        
        if (data.type === "ESP32_CONNECT" || data.type === "IDENTIFY") {
          connectedClients.set(ws, { type: 'ESP32', token: data.token });
          console.log('🤖 ESP32 registered');
          return;
        }
        
        if (data.type === "WEB_CONNECT") {
          connectedClients.set(ws, { type: 'WEB' });
          console.log('🌐 Web client registered');
          return;
        }

        if (data.type === "PYTHON_CLIENT_CONNECT") {
          connectedClients.set(ws, { type: 'PYTHON', token: data.token });
          console.log('🐍 Python client registered');
          return;
        }

        if (data.type === "VOICE_COMMAND") {
          const text = data.text;
          const token = data.token;
          const startTime = Date.now();
          
          console.log(`⚡ Processing via WS: "${text}"`);
          
          processVoiceCommandFast(text, token, ws, startTime);
          return;
        }

      } catch (err) {
        console.error("❌ Parse error:", err.message);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('✗ Client disconnected');
    });
  });

  async function processVoiceCommandFast(text, token, senderWs, startTime) {
    try {
      const aiResponse = await analyzeIntent(text, token);
      const shellCommand = commandMap[aiResponse];
      
      const aiTime = Date.now() - startTime;
      console.log(`🤖 AI Response (${aiTime}ms): "${aiResponse}"`);
      
      if (shellCommand) {
        broadcastToType('PYTHON', {
          type: 'COMMAND',
          command: shellCommand
        });
        console.log(`📤 Command sent (${Date.now() - startTime}ms): ${shellCommand}`);
      }
      
      const dirPath = path.join(__dirname, 'generated');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const fileName = `astra-${Date.now()}.mp3`;
      const filePath = path.join(dirPath, fileName);
      const audioUrl = `http://192.168.1.6:5000/download/${fileName}`;
      
      if (senderWs && senderWs.readyState === WebSocket.OPEN) {
        senderWs.send(JSON.stringify({
          type: 'AI_RESPONSE',
          text: aiResponse,
          audioUrl: audioUrl,
          responseTime: `${Date.now() - startTime}ms`,
          command: shellCommand
        }));
      }
      
      console.log(`✅ Response sent via WS (${Date.now() - startTime}ms)`);
      
      const gtts = new gTTS(aiResponse, 'id');
      gtts.save(filePath, function (err) {
        if (err) {
          console.error("❌ TTS failed:", err);
          return;
        }
        
        const ttsTime = Date.now() - startTime;
        console.log(`🔊 Audio ready (${ttsTime}ms): ${fileName}`);
        
        broadcastToType('ESP32', {
          type: 'PLAY_AUDIO',
          url: audioUrl,
          text: aiResponse
        });
        
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch(e) {}
          }
        }, 60000);
      });
      
    } catch (error) {
      console.error('❌ Process error:', error.message);
    }
  }

  function broadcastToType(clientType, payload) {
    connectedClients.forEach((info, ws) => {
      if (info.type === clientType && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    });
  }

  function sendCommandToClients(command) {
    broadcastToType('PYTHON', { type: 'COMMAND', command });
  }

  function sendStatusToClients(status) {
    broadcastToType('ESP32', { type: 'STATUS', status });
  }

  function broadcastToWS(payload) {
    connectedClients.forEach((info, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
        ws.send(msg);
      }
    });
  }

  console.log('🚀 WebSocket Server running on port 7071');

  module.exports = { sendCommandToClients, sendStatusToClients, broadcastToWS };