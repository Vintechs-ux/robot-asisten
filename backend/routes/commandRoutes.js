const express = require('express');
const router = express.Router();
const { receiveCommand } = require('../controllers/commandController');

router.post("/", receiveCommand);

module.exports = router;
