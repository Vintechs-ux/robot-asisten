const express = require('express');
const router = express.Router();
const { register, addLog } = require('../controllers/userController');
const { protect } = require("./../middleware/auth");

router.post('/register', register);
router.post('/log', protect, addLog);

module.exports = router;
