const express = require('express');
const router = express.Router();
const { receiveCommand } = require('../controllers/commandController');
const { sendCommandToClients } = require('../websocketServer');


router.post('/open-word', async (req, res) => {
  sendCommandToClients('open_word');
  res.json({ status: 'Sent to laptop' });
});

router.post('/open-steam', async (req, res) => {
  sendCommandToClients('open_steam');
  res.json({ status: 'Sent to laptop' });
});

router.post('/open-browser', async (req, res) => {
  sendCommandToClients('open_browser');
  res.json({ status: 'Sent to laptop' });
});

router.post('/open-notepad', async (req, res) => {
  sendCommandToClients('open_notepad');
  res.json({ status: 'Sent to laptop' });
});


router.post('/', receiveCommand);

module.exports = router;
