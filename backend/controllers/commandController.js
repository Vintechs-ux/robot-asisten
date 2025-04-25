const { sendCommandToClients } = require("../websocketServer");
const commandMap = require("../config/shellCommandMap");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const receiveCommand = catchAsync(async (req, res, next) => {
  const { command } = req.body;

    const shellCommand = commandMap[command];

    if (!shellCommand) {
      return next(new AppError("Unknown command", 400));
    }

    sendCommandToClients(shellCommand);
    res.json({ status: "success", message: "Command sent to laptop" });
  
});

module.exports = { receiveCommand };
