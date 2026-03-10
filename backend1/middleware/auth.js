const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return next(new AppError('Token diperlukan', 401));
    }

   
    const user = await User.findOne({ 
        robotToken: token,
        isActive: true 
    });

    if (!user) {
        return next(new AppError('Token tidak valid atau robot tidak aktif', 401));
    }

   
    req.user = user;
    next();
}); 