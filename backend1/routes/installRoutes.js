const express = require("express");
const { installApp, getAllApps, createApp } = require("../controllers/installController");
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post("/", protect, installApp);
router.get("/", protect, getAllApps);
router.post("/create", protect, createApp);

module.exports = router;
