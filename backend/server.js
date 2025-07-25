const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
});
