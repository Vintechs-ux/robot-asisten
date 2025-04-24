const express = require("express");
const connectDB = require("./config/db");
const app = express();
const cors = require('cors');
const commandRoutes = require('./routes/commandRoutes');
const userRoutes = require('./routes/userRoutes');
require('./websocketServer'); 


connectDB();


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use(cors());

app.use("/api/v1/command", commandRoutes);
app.use("/api/v1/user", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server jalan di port ${PORT}`));
