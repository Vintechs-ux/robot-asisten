const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    commands: [{
        timestamp: { type: Date, default: Date.now },
        command: String,
        result: String
    }]
});

module.exports = mongoose.model('User-robots', userSchema);
