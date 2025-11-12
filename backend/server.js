const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Load environment variables
// Try .env.local first (for development), then fall back to .env
const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const { connectQueue } = require("./config/rabbitmq");
const { connectRedis, client: redisClient } = require("./config/redis");

const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const formRoutes = require("./routes/formRoutes");

const app = express();

connectDB();
connectQueue();

// Connect Redis (best-effort)
connectRedis()
  .then(async () => {
    try {
      const pong = await redisClient.ping();
      console.log("Redis connected:", pong);
    } catch (e) {
      console.error("Redis ping failed:", e.message);
    }
  })
  .catch((e) => console.error("Redis connect failed:", e.message));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/forms", formRoutes);

const PORT = process.env.PORT || 5000;

// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
});
