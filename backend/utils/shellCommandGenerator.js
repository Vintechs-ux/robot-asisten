const { Groq } = require("groq-sdk");

const generateShellCommand = async (appName) => {
    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const prompt = `Buatkan shell command untuk aplikasi Windows "${appName}".
        Berikan response dalam format JSON seperti ini:
        {
            "open": "command untuk membuka aplikasi",
            "close": "command untuk menutup aplikasi",
            "uninstall": "command untuk uninstall aplikasi"
        }
        Pastikan command sesuai dengan Windows command line dan executable name yang umum digunakan.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Kamu adalah asisten yang ahli dalam Windows command line dan aplikasi Windows. Berikan response dalam format JSON yang valid."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "mixtral-8x7b-32768",
            temperature: 0.5,
            max_tokens: 1024,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error("Tidak ada response dari Groq");
        }

        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Format JSON tidak ditemukan dalam response");
        }

        const shellCommand = JSON.parse(jsonMatch[0]);
        return shellCommand;

    } catch (error) {
        console.error("Error generating shell command:", error);
      
        return {
            open: `start ${appName.toLowerCase()}`,
            close: `taskkill /IM ${appName.toLowerCase()}.exe /F`,
            uninstall: `winget uninstall --name "${appName}" --silent`
        };
    }
};

module.exports = { generateShellCommand }; 