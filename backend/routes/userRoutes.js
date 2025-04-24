const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

router.post('/register', async (req, res) => {
    const { name } = req.body;
    try {
        const user = new User({ name });
        await user.save();
        res.json({ status: "user registered", name });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;
