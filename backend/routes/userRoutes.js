const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
router.post('/register', catchAsync(async (req, res, next) => {
    const { name } = req.body;
   
        const user = new User({ name });
        await user.save();
        
        res.status(201).json({
            status: 'success',
            user
        });
}));

module.exports = router;
