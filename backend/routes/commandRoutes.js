const express = require('express');
const router = express.Router();
const { receiveCommand } = require('../controllers/commandController');
const { protect } = require('../middleware/auth');

router.post("/", protect, receiveCommand);

module.exports = router;
