const express = require("express");
const { reportApps } = require("../controllers/appController");
const router = express.Router();



router.post("/report", reportApps);

module.exports = router;
