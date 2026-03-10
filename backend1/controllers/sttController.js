const axios = require('axios');
const path = require("path");
const fs = require('fs');
const FormData = require('form-data');
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const { analyzeIntent } = require('../utils/aiHandler');
const { activeRequests, sendCommandToClients, broadcastToWS } = require('../websocketServer');
const commandMap = require("../config/shellCommandMap"); 

const upload = multer({ 
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${file.fieldname}-${Date.now()}${ext}`);
        }
    })
});
exports.uploadAudio = upload.single('audio');
exports.uploadAudio = upload.single('audio'); 

exports.transcriptAndProcess = catchAsync(async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: "Mana suaranya bro?" });

  
    const controller = new AbortController();
    const token = req.body.token || "default-robot";
    
    activeRequests.set(token, controller);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'id');

    try {
        const sttResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            }
        });

        const transcriptText = sttResponse.data.text;
        fs.unlinkSync(req.file.path); 

        
        const aiReply = await analyzeIntent(transcriptText, token, controller.signal);

        const shellCommand = commandMap[aiReply]; 

        if (aiReply.startsWith("TYPE_WRITER|")) {
            const parts = aiReply.split("|");
            const judul = parts[1];
            const konten = parts[2];

            
            sendCommandToClients(commandMap["OPEN_WORD"]); 

            
            setTimeout(() => {
                const { sendStatusToClients } = require('../websocketServer'); 
                
                const payload = JSON.stringify({
                    type: "LIVE_TYPE",
                    title: judul,
                    content: konten
                });
                
                
                const { activeRequests, ...wssUtils } = require('../websocketServer');
                
                require('../websocketServer').activeRequests.forEach((v, k) => {
                    
                });
                
                broadcastToWS(payload);
            }, 3000);

        } else {
            
            const shellCommand = commandMap[aiReply]; 
            if (shellCommand) {
                sendCommandToClients(shellCommand);
            }
        }

        res.status(200).json({ status: 'success', astraReply: aiReply });

        if (shellCommand) {
            
            sendCommandToClients(shellCommand);
            console.log(`[Voice] Melaksanakan perintah: ${shellCommand}`);
        }
        
        activeRequests.delete(token);

        res.status(200).json({
            status: 'success',
            userText: transcriptText,
            astraReply: aiReply
        });

    } catch (error) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        activeRequests.delete(token);
        
        console.log("--- ERROR LOG ---");
        console.error(error.response ? error.response.data : error.message);

        if (error.name === 'CanceledError') return; 
        res.status(500).json({ message: "Gagal proses suara" });
    }
});