const express = require('express');
const router = express.Router();
const { receiveCommand } = require('../controllers/commandController');
const sttController = require("../controllers/sttController");
const { protect } = require('../middleware/auth');

router.post("/", protect, receiveCommand);
router.post("/voice", sttController.uploadAudio, sttController.transcriptAndProcess);

module.exports = router;
