const express = require("express");
const connectDB = require("./config/db");
const app = express();
const cors = require('cors');
const commandRoutes = require('./routes/commandRoutes');
const installRoutes = require("./routes/installRoutes");
const userRoutes = require('./routes/userRoutes');
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const morgan = require("morgan");
require('./websocketServer'); 


connectDB();


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use(cors());

if(process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/command", commandRoutes);
app.use("/api/v1/install", installRoutes);

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server jalan di port ${PORT}`));
