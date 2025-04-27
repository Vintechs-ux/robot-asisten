const mongoose = require('mongoose');

const installedAppSchema = new mongoose.Schema({
    robotToken: {
        type: String,
        required: true
    },
    installedApps: [{
        name: String,
        version: String
    }],
    lastUpdate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('InstalledApp', installedAppSchema); 