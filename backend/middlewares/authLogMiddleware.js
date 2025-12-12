const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const userModel = require("../models/userSchema");

async function authLogMiddleware(req, res, next) {
  const token =
    req.cookies?.jwt ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Temporary store the response body
  res.send = function (body) {
    res.locals.body = body;
    return originalSend.call(this, body);
  };
  res.json = function (body) {
    res.locals.body = body;
    return originalJson.call(this, body);
  };

  // Global error tracker
  let capturedError = null;

  // 👂 Intercept "error" events (in Express error-handling)
  res.on("error", (err) => {
    capturedError = err;
  });

  // Capture unhandled async errors too
  process.on("uncaughtException", (err) => {
    capturedError = err;
  });

  res.on("finish", async () => {
    let user = null;
    let jwtError = null;

    // Try decode token
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await userModel.findById(decoded.id).select("nom prenom email role _id");
      } catch (err) {
        jwtError = err.message;
      }
    }

    // Hide sensitive info
    const safeBody = { ...req.body };
    ["password", "newPassword", "oldPassword"].forEach((key) => {
      if (safeBody[key]) safeBody[key] = "****";
    });

    // Prepare directories and paths
    const executionTime = Date.now() - startTime;
    const logsDir = path.join(__dirname, "..", "logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const logPath = path.join(logsDir, "auth.log");

    // Build log entry
    const logLines = [
      `📅 ${new Date().toISOString()}`,
      `➡️  ${req.method} ${req.originalUrl}`,
      `🌐 IP: ${req.ip}`,
      `⏱️  ${executionTime}ms`,
      `📊 Status: ${res.statusCode}`,
      user
        ? `👤 ${user.prenom} ${user.nom} <${user.email}> [${user.role}] (ID: ${user._id})`
        : "👤 Anonymous",
      jwtError ? `⚠️ JWT Error: ${jwtError}` : "",
      `🧾 Body: ${Object.keys(safeBody).length ? JSON.stringify(safeBody) : "N/A"}`,
      capturedError
        ? `❌ ERROR: ${capturedError.message || capturedError}`
        : res.statusCode >= 400
        ? `⚠️  Response Error: ${JSON.stringify(res.locals.body) || "N/A"}`
        : "✅ Success",
      "------------------------------------------------------------",
    ];

    try {
      fs.appendFileSync(logPath, logLines.join(" | ") + "\n");
    } catch (err) {
      console.error("❌ Erreur écriture log :", err.message);
    }
  });

  // Catch errors in async routes
  try {
    await next();
  } catch (err) {
    capturedError = err;
    next(err); // pass to default error handler
  }
}

module.exports = authLogMiddleware;
