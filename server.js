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

// Prediction & safety constants
const SAMPLE_INTERVAL_SEC = 10;   // data comes every 10 sec
const PELTIER_DELAY_MIN = 3;      // peltier response time
const SAFE_MIN = 2.0;
const SAFE_MAX = 6.0;
const CRITICAL_TEMP = 5.5;        // act early
// =========================================

// Store previous temp for rate calculation
let lastTemperature = null;

// Full system state (this is the brain)
let systemState = {
  temperature: null,
  humidity: null,
  temp_rate: 0,          // °C/min
  predicted_temp: null,
  peltier_decision: "OFF",
  reason: "init",
  time: null
};

// =================================================
// ESP32 / test-client uploads data here
// =================================================
app.post("/upload", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { temperature, humidity } = req.body;
  if (temperature == null || humidity == null) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // ---------- Rate of temperature change ----------
  let tempRate = 0; // °C/min
  if (lastTemperature !== null) {
    const delta = temperature - lastTemperature;
    tempRate = (delta / SAMPLE_INTERVAL_SEC) * 60;
  }

  // ---------- Predict future temperature ----------
  const predictedTemp =
    temperature + tempRate * PELTIER_DELAY_MIN;

  // ---------- Decision logic ----------
  let decision = "OFF";
  let reason = "safe";

  if (predictedTemp >= CRITICAL_TEMP) {
    decision = "ON";
    reason = "predicted_overheat";
  }

  // ---------- Update state ----------
  systemState = {
    temperature,
    humidity,
    temp_rate: Number(tempRate.toFixed(3)),
    predicted_temp: Number(predictedTemp.toFixed(2)),
    peltier_decision: decision,
    reason,
    time: new Date().toISOString()
  };

  lastTemperature = temperature;

  console.log("SYSTEM STATE:", systemState);

  res.json({ status: "success" });
});

// =================================================
// ESP32 pulls decision from here
// =================================================
app.get("/command", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    peltier: systemState.peltier_decision,
    reason: systemState.reason,
    valid_for_sec: 180
  });
});

// =================================================
// View full prediction state (for YOU)
// =================================================
app.get("/status", (req, res) => {
  res.json(systemState);
});

// =================================================
// Raw data view (optional)
// =================================================
app.get("/read", (req, res) => {
  res.json({
    temperature: systemState.temperature,
    humidity: systemState.humidity,
    time: systemState.time
  });
});

// =================================================
app.listen(PORT, () => {
  console.log(`Prediction server running on port ${PORT}`);
});
