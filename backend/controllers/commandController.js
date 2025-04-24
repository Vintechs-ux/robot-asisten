const User = require('../models/userModel');
const { exec } = require('child_process');

exports.receiveCommand = async (req, res) => {
    const { name, command } = req.body;

    let result;
    try {
        if (command.toLowerCase().includes("word")) {
            exec("start winword");
            result = "Microsoft Word opened";
        } else if (command.toLowerCase().includes("camera")) {
            exec("start microsoft.windows.camera:");
            result = "Camera opened";
        } else {
            result = "Unknown command";
        }

        await User.updateOne(
            { name },
            { $push: { commands: { command, result } } },
            { upsert: true }
        );

        res.json({ status: "success", result });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
