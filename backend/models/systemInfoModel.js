const mongoose = require('mongoose');

const systemInfoSchema = new mongoose.Schema({
    robotToken: {
        type: String,
        required: true,
        unique: true
    },
    systemInfo: {
        type: Object,
        required: true
    },
    installedApps: [{
        name: String,
        version: String,
        publisher: String,
        install_date: String
    }],
    lastUpdate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SystemInfo', systemInfoSchema); 