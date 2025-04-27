const express = require('express');
const router = express.Router();
const { register, addLog } = require('../controllers/userController');

router.post('/register', register);
router.post('/log', addLog);

module.exports = router;
