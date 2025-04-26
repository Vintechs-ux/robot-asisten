const express = require("express");
const { installApp, getAllApps, createApp } = require("../controllers/installController");

const router = express.Router();

router.post("/", installApp);
router.get("/", getAllApps);
router.post("/create", createApp);

module.exports = router;
