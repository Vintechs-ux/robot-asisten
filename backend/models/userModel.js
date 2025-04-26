const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true
    },
    robotToken: {
        type: String,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    commands: [{
        timestamp: { type: Date, default: Date.now },
        command: String,
        result: String,
        status: String 
    }]
});

userSchema.pre('save', function(next) {
    if (!this.robotToken) {
       
        const secret = process.env.ROBOT_SECRET || 'robot-secret-key';
        this.robotToken = crypto
            .createHash('sha256')
            .update(this.name + secret)
            .digest('hex');
    }
    next();
});

module.exports = mongoose.model('User-robots', userSchema);
