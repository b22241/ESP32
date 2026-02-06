const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIG =================
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
// =========================================

let latestData = {
  temperature: null,
  humidity: null,
  time: null
};

app.post("/upload", (req, res) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { temperature, humidity } = req.body;

  latestData.temperature = temperature;
  latestData.humidity = humidity;
  latestData.time = new Date().toISOString();

  console.log("Data received:", latestData);

  res.json({ status: "success" });
});

app.get("/read", (req, res) => {
  res.json(latestData);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
