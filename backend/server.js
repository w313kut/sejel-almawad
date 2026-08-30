require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const notificationsRoutes = require("./routes/notifications");
const priceHistoryRoutes = require("./routes/priceHistory");
const auditLogsRoutes = require("./routes/auditLogs");
const resetRoutes = require("./routes/reset");
const materialsRoutesFactory = require("./routes/materials");
const attachRealtime = require("./sockets/index");
const { requireAuth } = require("./middleware/auth");

const app = express();
app.set("trust proxy", true);
const server = http.createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Uploaded material images are static files served directly to img tags
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "sejel-almawad-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/materials", materialsRoutesFactory(io));
app.use("/api/notifications", notificationsRoutes);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/reset", resetRoutes);

// Serve frontend production build
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
    return res.sendFile(path.join(frontendDist, "index.html"));
  }
  next();
});

// Centralized error handler — never leaks stack traces or internals to the client.
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("نوع الملف") ) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "حجم الصورة أكبر من الحد المسموح (8 ميجابايت)" });
  }
  console.error(err);
  res.status(500).json({ error: "حدث خطأ غير متوقع في الخادم" });
});

attachRealtime(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ سجل المواد API يعمل على المنفذ ${PORT}`);
});
