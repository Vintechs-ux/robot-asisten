const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { generateClientPython } = require('../utils/generateClient');
const path = require('path');
exports.register = catchAsync(async (req, res, next) => {
    const { name, specialKey } = req.body;

  
    const existingRobot = await User.findOne({ isActive: true });
    if (existingRobot) {
       
        existingRobot.isActive = false;
        await existingRobot.save();
    }

 
    const user = await User.create({ 
        name,
        specialKey,
        isActive: true
    });

    try {
      
        const pythonFilePath = await generateClientPython(user.robotToken);

        res.status(201).json({
            status: 'success',
            data: {
                name: user.name,
                token: user.robotToken,
                pythonFile: pythonFilePath,
                specialKey: user.specialKey,
                downloadUrl: `http://10.34.241.92:5000/download/${fileName}`
            },
            message: 'Robot berhasil didaftarkan dan file Python telah dibuat'
        });
    } catch (error) {
        
        res.status(201).json({
            status: 'success',
            data: {
                name: user.name,
                token: user.robotToken
            },
            message: 'Robot berhasil didaftarkan tapi gagal membuat file Python'
        });
    }
});

exports.addLog = catchAsync(async (req, res, next) => {
    const { name, token } = req.headers;
    const { status, command, result } = req.body;

   
    const robot = await User.findOne({ 
        name, 
        robotToken: token,
        isActive: true 
    });

    if (!robot) {
        return next(new AppError('Robot tidak valid atau tidak aktif', 401));
    }

   
    robot.commands.push({
        command,
        result,
        status
    });

    await robot.save();

    res.status(200).json({
        status: 'success',
        message: 'Log berhasil disimpan'
    });
}); 