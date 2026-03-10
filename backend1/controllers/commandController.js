const { analyzeIntent } = require("../utils/aiHandler");
const { sendCommandToClients, broadcastToWS } = require("../websocketServer");
const commandMap = require("../config/shellCommandMap");
const catchAsync = require("../utils/catchAsync");
const gTTS = require('gtts'); 
const path = require('path');
const fs = require("fs");

const receiveCommand = catchAsync(async (req, res, next) => {
  const text = req.body.text || req.body.command; 
  const startTime = Date.now();

  
  const dirPath = path.join(__dirname, '../generated');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Cleanup di background - JANGAN BLOCKING!
  setImmediate(() => {
    if (fs.existsSync(dirPath)) {
      fs.readdir(dirPath, (err, files) => {
        if (err) return;
        files.forEach(file => {
          if (file.startsWith('astra-')) {
            const oldFilePath = path.join(dirPath, file);
            fs.unlink(oldFilePath, () => {}); 
          }
        });
      });
    }
  });

  
  console.log(`⚡ Processing: "${text}"`);
  const aiResponse = await analyzeIntent(text);
  const shellCommand = commandMap[aiResponse];
  
  console.log(`🤖 AI Response (${Date.now() - startTime}ms): "${aiResponse}"`);

  
  if (shellCommand) {
    console.log(`📤 Sending command to PYTHON clients: ${shellCommand}`);
    broadcastToType('PYTHON', {
      type: 'COMMAND',
      command: shellCommand
    });
    sendCommandToClients(shellCommand);
  }

  
  const fileName = `astra-${Date.now()}.mp3`;
  const filePath = path.join(dirPath, fileName);
  const audioUrl = `http://10.241.242.41:5000/download/${fileName}`;

  
  res.json({ 
    status: "success", 
    action: shellCommand || aiResponse,
    reply: aiResponse, 
    audioUrl: audioUrl,
    responseTime: `${Date.now() - startTime}ms`
  });

  console.log(`✅ Response sent (${Date.now() - startTime}ms)`);

  
  const gtts = new gTTS(aiResponse, 'id');
  gtts.save(filePath, function (err) {
    if (err) {
      console.error("❌ TTS failed:", err);
      return;
    }

    console.log(`🔊 Audio ready (${Date.now() - startTime}ms): ${fileName}`);

    
    broadcastToWS({
      type: "PLAY_AUDIO",
      url: audioUrl,
      text: aiResponse
    });

    
    setTimeout(() => { 
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch(e) {}
      } 
    }, 60000);
  });
});



// const receiveCommand = catchAsync(async (req, res, next) => {
//   const text = req.body.text || req.body.command; 
//   const aiResponse = await analyzeIntent(text);
//   const shellCommand = commandMap[aiResponse];

//   // Folder generated - kita pakai path.join biar aman
//   const dirPath = path.join(__dirname, '../generated');
//   if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

//   const fileName = `astra-${Date.now()}.mp3`;
//   const filePath = path.join(dirPath, fileName);

//   // Path ke venv lo (sesuaikan lagi kalau salah)
//   const venvPath = "/home/vintech/Work/Projects/robot-asisten/venv/bin/edge-tts";
  
//   const cleanText = aiResponse.replace(/"/g, '').replace(/\n/g, ' ');

//   // Menggunakan spawn agar aman dari karakter spesial seperti ( ) atau spasi
//   const ttsProcess = spawn(venvPath, [
//     '--voice', 'id-ID-ArdiNeural',
//     '--text', cleanText,
//     '--write-media', filePath,
    
//   ]);

//   ttsProcess.on('close', (code) => {
//     if (code !== 0) {
//       console.error(`TTS Process gagal dengan code ${code}`);
//       return res.json({ status: "success", reply: aiResponse, note: "TTS Process Error" });
//     }

//     const audioUrl = `/download/${fileName}`;

//     if (shellCommand) {
//       sendCommandToClients(shellCommand);
//       res.json({ status: "success", action: aiResponse, audioUrl: audioUrl });
//     } else {
//       res.json({ status: "success", reply: aiResponse, audioUrl: audioUrl });
//     }

//     // Hapus file sampah
//     setTimeout(() => { 
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
//     }, 60000);
//   });

//   ttsProcess.on('error', (err) => {
//     console.error("Gagal menjalankan spawn:", err);
//     res.json({ status: "success", reply: aiResponse, note: "Spawn Error" });
//   });
// });

module.exports = { receiveCommand };
