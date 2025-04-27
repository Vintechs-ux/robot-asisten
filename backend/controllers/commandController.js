const { sendCommandToClients } = require("../websocketServer");
const commandMap = require("../config/shellCommandMap");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");


const responseTemplates = {
  SYSTEM_INFO: [
    "Baik, saya bukakan informasi sistem laptop kamu",
    "Oke, ini properties laptop kamu",
    "Silahkan cek spesifikasi laptop di jendela properties",
    "Saya tampilkan informasi sistem laptop"
  ]
};

const getRandomResponse = (templates) => {
  return templates[Math.floor(Math.random() * templates.length)];
};

const receiveCommand = catchAsync(async (req, res, next) => {
  const { command } = req.body;
  const token = req.body.token;
  const user = req.user;

  const shellCommand = commandMap[command];

  if (!shellCommand) {
    return next(new AppError("Unknown command", 400));
  }

  try {

    if (command === "system_info") {
      await sendCommandToClients({
        command: "start ms-settings:system",
        token: token
      });

      return res.json({
        status: "success",
        message: getRandomResponse(responseTemplates.SYSTEM_INFO)
      });
    }

  
    const response = await sendCommandToClients({
      command: shellCommand,
      token: token
    });

    res.json({
      status: response.status,
      message: response.result
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = { receiveCommand };
