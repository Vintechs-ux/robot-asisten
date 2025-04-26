const { sendCommandToClients } = require("../websocketServer");
const commandMap = require("../config/shellCommandMap");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const receiveCommand = catchAsync(async (req, res, next) => {
  const { command } = req.body;
  const user = req.user; 

  const shellCommand = commandMap[command];

  if (!shellCommand) {
   
    user.commands.push({
      command,
      result: "Command tidak dikenali",
      status: "error"
    });
    await user.save();
    
    return next(new AppError("Unknown command", 400));
  }

  user.commands.push({
    command,
    result: "Command berhasil dieksekusi",
    status: "success"
  });
  await user.save();

  sendCommandToClients(shellCommand);
  res.json({ status: "success", message: "Command sent to laptop" });
});

module.exports = { receiveCommand };
