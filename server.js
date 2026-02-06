const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIG =================
const PORT = 3000;
const API_KEY = "esp32_TEMP_9fA3kLxP_2026";

// =========================================

// Store latest sensor data
let latestData = {
  temperature: null,
  humidity: null,
  time: null
};

// ESP32 sends data here
app.post("/upload", (req, res) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { temperature, humidity } = req.body;

  latestData.temperature = temperature;
  latestData.humidity = humidity;
  latestData.time = new Date().toISOString();

  console.log("Data received:");
  console.log(latestData);

  res.json({ status: "success" });
});

// PC / Browser reads data here
app.get("/read", (req, res) => {
  res.json(latestData);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
