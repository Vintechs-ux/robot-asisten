const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    updateSystemInfo, 
    getSystemInfo, 
    getInstalledApps,
    updateInstalledApps,
    generateCommandsManual
} = require('../controllers/systemController');

router.post('/update', updateSystemInfo);
router.post('/info', protect, getSystemInfo);
router.post('/apps', protect, getInstalledApps);
router.post('/update-apps', updateInstalledApps);
router.post('/generate-commands', protect, generateCommandsManual);

module.exports = router; 