const App = require("../models/appModel");
const InstalledApp = require("../models/installedAppModel");
const { sendCommandToClients } = require("../websocketServer");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const installApp = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  const token = req.body.token;

  if (!name) {
    return next(new AppError("Nama aplikasi diperlukan", 400));
  }


  const installedApps = await InstalledApp.findOne({ robotToken: token });
  if (installedApps) {
    const isInstalled = installedApps.installedApps.some(
      app => app.name.toLowerCase() === name.toLowerCase()
    );

    if (isInstalled) {
      return res.json({
        status: "info",
        message: `Aplikasi ${name} sudah terinstall di laptop kamu`
      });
    }
  }


  const app = await App.findOne({ name: name.toLowerCase() });

  try {
    if (app) {
     
      const response = await sendCommandToClients({
        command: {
          type: "install_app",
          method: "direct",
          name: app.name,
          download_url: app.download_url
        },
        token: token
      });

      return res.json({
        status: response.status,
        message: response.result
      });

    } else {
   
      const response = await sendCommandToClients({
        command: {
          type: "install_app",
          method: "winget", 
          name: name
        },
        token: token
      });

      return res.json({
        status: response.status,
        message: response.result
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

const getAllApps = catchAsync(async (req, res, next) => {
  const apps = await App.find();
  res.json({ status: "success", data: apps });
});

const createApp = catchAsync(async (req, res, next) => {
  const { name, displayName, download_url } = req.body;

  if (!name || !displayName || !download_url) {
    return next(new AppError("Nama, displayName, dan download_url wajib diisi", 400));
  }

  const newApp = await App.create({
    name: name.toLowerCase(),
    displayName,
    download_url,
  });

  res.status(201).json({
    status: "success",
    data: newApp,
  });
});

module.exports = {
  installApp,
  getAllApps,
  createApp,
};
