const mongoose = require("mongoose");

const appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Nama aplikasi harus diisi"],
    unique: true,
    lowercase: true,
  },
  displayName: {
    type: String,
    required: [true, "Nama tampilan harus diisi"],
  },
  download_url: {
    type: String,
    required: [true, "URL installer harus diisi"],
  },
});

const App = mongoose.model("App", appSchema);
module.exports = App;
