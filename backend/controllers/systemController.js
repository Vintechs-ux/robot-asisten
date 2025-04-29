const SystemInfo = require('../models/systemInfoModel');
const { sendCommandToClients } = require("../websocketServer");
const catchAsync = require("../utils/catchAsync");
const InstalledApp = require('../models/installedAppModel');
const { getOrGenerateCommand } = require('../config/dynamicShellCommands');


const intents = {
    SYSTEM_INFO: [
        "bagaimana spesifikasi laptop",
        "cek spesifikasi",
        "info sistem",
        "spek laptop",
        "sistem info"
    ],
    INSTALLED_APPS: [
        "aplikasi apa saja yang terinstall",
        "cek aplikasi",
        "list aplikasi",
        "daftar aplikasi",
        "aplikasi terinstall"
    ]
};


const responseTemplates = {
    SYSTEM_INFO: {
        success: [
            "Berikut spesifikasi laptop saat ini:",
            "Ini detail sistem laptop:",
            "Saya temukan informasi berikut tentang laptop:"
        ],
        error: [
            "Maaf, saya tidak bisa mendapatkan informasi sistem saat ini",
            "Terjadi kesalahan saat membaca spesifikasi laptop",
            "Gagal mengakses informasi sistem"
        ]
    },
    INSTALLED_APPS: {
        success: [
            "Berikut daftar aplikasi yang terinstall:",
            "Saya temukan aplikasi-aplikasi berikut:",
            "Ini daftar aplikasi di laptop:"
        ],
        error: [
            "Maaf, saya tidak bisa mendapatkan daftar aplikasi saat ini",
            "Terjadi kesalahan saat membaca daftar aplikasi",
            "Gagal mengakses daftar aplikasi"
        ]
    }
};


const getRandomResponse = (templates) => {
    return templates[Math.floor(Math.random() * templates.length)];
};


exports.updateSystemInfo = catchAsync(async (req, res) => {
    const { token, systemInfo, installedApps } = req.body;

    await SystemInfo.findOneAndUpdate(
        { robotToken: token },
        {
            systemInfo,
            installedApps,
            lastUpdate: new Date()
        },
        { upsert: true, new: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Informasi sistem berhasil diperbarui'
    });
});


exports.getSystemInfo = catchAsync(async (req, res) => {
    const { token, command } = req.body;

  
    const shouldRefresh = command.toLowerCase().includes("refresh") || 
                         command.toLowerCase().includes("perbarui");

    if (shouldRefresh) {
    
        const response = await sendCommandToClients({
            command: "get_system_info",
            token
        });

        return res.json({
            status: 'success',
            message: getRandomResponse(responseTemplates.SYSTEM_INFO.success),
            data: response.result
        });
    }


    const systemInfo = await SystemInfo.findOne({ robotToken: token });
    
    if (!systemInfo) {
        return res.status(404).json({
            status: 'error',
            message: getRandomResponse(responseTemplates.SYSTEM_INFO.error)
        });
    }

    res.json({
        status: 'success',
        message: getRandomResponse(responseTemplates.SYSTEM_INFO.success),
        data: systemInfo.systemInfo
    });
});


exports.getInstalledApps = catchAsync(async (req, res) => {
    const { token, command } = req.body;

    const shouldRefresh = command.toLowerCase().includes("refresh") || 
                         command.toLowerCase().includes("perbarui");

    if (shouldRefresh) {
        const response = await sendCommandToClients({
            command: "get_installed_apps",
            token
        });

        return res.json({
            status: 'success',
            message: getRandomResponse(responseTemplates.INSTALLED_APPS.success),
            data: response.result
        });
    }

    const systemInfo = await SystemInfo.findOne({ robotToken: token });
    
    if (!systemInfo) {
        return res.status(404).json({
            status: 'error',
            message: getRandomResponse(responseTemplates.INSTALLED_APPS.error)
        });
    }

    res.json({
        status: 'success',
        message: getRandomResponse(responseTemplates.INSTALLED_APPS.success),
        data: systemInfo.installedApps
    });
});


const generateCommandsForApps = async (apps) => {
    console.log("[INFO] Memulai generate commands untuk aplikasi terinstall");
    for (const app of apps) {
        try {
            await getOrGenerateCommand(app.name);
            console.log(`[SUCCESS] Generated command untuk ${app.name}`);
        } catch (error) {
            console.error(`[ERROR] Gagal generate command untuk ${app.name}:`, error);
        }
    }
    console.log("[INFO] Selesai generate commands");
};


exports.updateInstalledApps = catchAsync(async (req, res) => {
    const { token, installedApps, shouldGenerateCommands } = req.body;

    if (!token || !installedApps) {
        return res.status(400).json({
            status: 'error',
            message: 'Token dan daftar aplikasi diperlukan'
        });
    }

    await InstalledApp.findOneAndUpdate(
        { robotToken: token },
        {
            robotToken: token,
            installedApps: installedApps,
            lastUpdate: new Date()
        },
        { upsert: true }
    );

    if (shouldGenerateCommands === true) {
        generateCommandsForApps(installedApps).catch(console.error);
    }

    res.status(200).json({
        status: 'success',
        message: 'Daftar aplikasi berhasil diperbarui'
    });
});

exports.generateCommandsManual = catchAsync(async (req, res) => {
    const { token } = req.body;

    const installedApps = await InstalledApp.findOne({ robotToken: token });
    if (!installedApps) {
        return res.status(404).json({
            status: 'error',
            message: 'Daftar aplikasi tidak ditemukan'
        });
    }


    generateCommandsForApps(installedApps.installedApps).catch(console.error);

    res.status(200).json({
        status: 'success',
        message: 'Proses generate commands dimulai',
        totalApps: installedApps.installedApps.length
    });
}); 