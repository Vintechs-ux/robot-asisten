const axios = require('axios');

const commandMap = require('../config/shellCommandMap');
const chatMemory = {};

exports.analyzeIntent = async (userInput, robotToken = "default", signal) => {
    const apiKey = process.env.GROQ_API_KEY; 
    const listAvailableCommands = Object.keys(commandMap).join(', ');

    if(!chatMemory[robotToken]) {
        chatMemory[robotToken] = [];
    }

    if(chatMemory[robotToken].length > 10) {
        chatMemory[robotToken].shift();
    }


    const message = [
        {
            role: "system",
            content: `Kamu adalah otak dari robot asisten "Astra" pembuatmu adalah Raditya Ernanda Ramadhani Barumalang
             , panggilanya "Radit" Kelas 12 SMA Negeri 15 surabaya , dan kamu adalah projek uprak informatika. Jangan sebutkan nama pembuatmu jika tidak ditanyakan.

            Daftar perintah yang bisa kamu lakukan: [${listAvailableCommands}].
    
             Tugasmu:
             1. Jika user ingin melakukan aksi yang ada di daftar, balas dengan singkat sertakan nama command-nya juga.
             2. Jika user hanya ingin ngobrol biasa (General Chat), balas dengan jawaban ramah.
             3. ingat konteks percakapan sebelumnya
             Mode Khusus:
             1. Jika user minta dibuatkan "Laporan", "Makalah", "Skripsi", atau "Tugas", balas dengan format:
                TYPE_WRITER|Judul Laporan|Isi konten laporan yang lengkap dan formal.
             2. Gunakan bahasa Indonesia yang baku, akademis, dan terstruktur untuk mode ini.

            Jawabanmu:`
        }, 
        ...chatMemory[robotToken],
        {role: "user", content: userInput}
    ];

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: message
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            signal: signal
        });

        const aiReply = response.data.choices[0].message.content.trim();

        chatMemory[robotToken].push({role: "user", content: userInput});
        chatMemory[robotToken].push({role: "assistant", content: aiReply});

        return aiReply

    } catch (error) {
        console.error("AI Error Detail:", error.response ? error.response.data : error.message); 
        return "Maaf bro, otak gue lagi nge-lag.";
    }
};