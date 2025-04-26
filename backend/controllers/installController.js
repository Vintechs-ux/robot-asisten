const App = require("../models/appModel");
const { sendCommandToClients } = require("../websocketServer");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const installApp = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new AppError("Nama aplikasi diperlukan", 400));

  const app = await App.findOne({ name: name.toLowerCase() });

  if (app) {
    sendCommandToClients({
      type: "install_app",
      method: "direct",
      name: app.name,
      download_url: app.download_url,
    });

    return res.json({
      status: "success",
      method: "direct",
      message: `Mengirim perintah instalasi ${app.displayName}`,
    });
  }

  sendCommandToClients({
    type: "install_app",
    method: "winget",
    name: name,
  });

  return res.json({
    status: "warning",
    method: "winget",
    message: `Aplikasi tidak ditemukan di database, mencoba install dengan winget: ${name}`,
  });
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
