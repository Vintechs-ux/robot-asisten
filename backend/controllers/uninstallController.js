const InstalledApp = require('../models/installedAppModel');
const { sendCommandToClients } = require("../websocketServer");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { getOrGenerateCommand } = require('../config/dynamicShellCommands');

exports.uninstallApp = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  const token = req.body.token;

  if (!name) {
    return next(new AppError("Nama aplikasi diperlukan", 400));
  }

  const installedApps = await InstalledApp.findOne({ robotToken: token });
  const installedApp = installedApps?.installedApps.find(
    app => app.name.toLowerCase() === name.toLowerCase()
  );

  if (!installedApp) {
    return res.json({
      status: "error",
      message: `Aplikasi ${name} tidak terinstall di laptop kamu`
    });
  }

  try {
  
    const shellCommand = await getOrGenerateCommand(installedApp.name);

    const response = await sendCommandToClients({
      command: {
        type: "uninstall_app",
        name: installedApp.name,
        shellCommand: shellCommand.uninstall 
      },
      token: token
    });

    if (response.status === "success") {
      await InstalledApp.findOneAndUpdate(
        { robotToken: token },
        {
          $pull: {
            installedApps: { name: installedApp.name }
          }
        }
      );
    }

    return res.json({
      status: response.status,
      message: response.result
    });

  } catch (error) {
    return res.status(500).json({
      status: "error", 
      message: error.message
    });
  }
}); 