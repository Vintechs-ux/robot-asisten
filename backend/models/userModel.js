const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    commands: [{
        timestamp: { type: Date, default: Date.now },
        command: String,
        result: String
    }]
});

module.exports = mongoose.model('User-robots', userSchema);
