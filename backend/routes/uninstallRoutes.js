const express = require("express");
const { uninstallApp } = require("../controllers/uninstallController");
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post("/", protect, uninstallApp);

module.exports = router; 