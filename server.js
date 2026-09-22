const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const monitors = new Map();

function serializeMonitor(monitor) {
  return {
    id: monitor.id,
    url: monitor.url,
    interval: monitor.interval,
    status: monitor.status,
    statusCode: monitor.statusCode,
    responseTime: monitor.responseTime,
    lastChecked: monitor.lastChecked,
    error: monitor.error
  };
}

async function checkMonitor(monitor) {
  const start = Date.now();

  try {
    const response = await fetch(monitor.url, {
      method: "GET",
      signal: AbortSignal.timeout(10000)
    });

    monitor.statusCode = response.status;
    monitor.responseTime = Date.now() - start;
    monitor.lastChecked = new Date().toISOString();
    monitor.error = null;
    monitor.status = response.ok ? "up" : "down";
  } catch (error) {
    monitor.status = "down";
    monitor.statusCode = null;
    monitor.responseTime = Date.now() - start;
    monitor.lastChecked = new Date().toISOString();
    monitor.error = error.message;
  }
}

function startMonitor(monitor) {
  checkMonitor(monitor);

  monitor.timer = setInterval(() => {
    checkMonitor(monitor);
  }, monitor.interval * 1000);
}

app.get("/api/monitors", (req, res) => {
  res.json([...monitors.values()].map(serializeMonitor));
});

app.post("/api/monitors", (req, res) => {
  const { url, interval } = req.body;

  if (!url) {
    return res.status(400).json({
      error: "Health endpoint URL is required."
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({
      error: "Please enter a valid URL."
    });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({
      error: "Only HTTP and HTTPS URLs are supported."
    });
  }

  const intervalSeconds = Number(interval);

  if (!Number.isInteger(intervalSeconds) || intervalSeconds < 10) {
    return res.status(400).json({
      error: "Interval must be at least 10 seconds."
    });
  }

  const duplicate = [...monitors.values()].some(
    monitor => monitor.url === parsedUrl.toString()
  );

  if (duplicate) {
    return res.status(409).json({
      error: "This endpoint is already being monitored."
    });
  }

  const monitor = {
    id: crypto.randomUUID(),
    url: parsedUrl.toString(),
    interval: intervalSeconds,
    status: "checking",
    statusCode: null,
    responseTime: null,
    lastChecked: null,
    error: null,
    timer: null
  };

  monitors.set(monitor.id, monitor);
  startMonitor(monitor);

  res.status(201).json(serializeMonitor(monitor));
});

app.delete("/api/monitors/:id", (req, res) => {
  const monitor = monitors.get(req.params.id);

  if (!monitor) {
    return res.status(404).json({
      error: "Monitor not found."
    });
  }

  clearInterval(monitor.timer);
  monitors.delete(req.params.id);

  res.json({
    success: true
  });
});

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "health-monitor" }),
);

app.listen(PORT, () => {
  console.log(`Health Monitor running on port ${PORT}`);
});