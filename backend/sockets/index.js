const jwt = require("jsonwebtoken");
const db = require("../db/database");

/**
 * Every socket connection must present the same JWT used for API calls.
 * This is what makes the "instant price update, no refresh needed" flow
 * real: the server pushes one event and every connected worker's client
 * updates itself — the admin never has to fan requests out manually.
 */
function attachRealtime(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub);
      if (!user || user.status === "disabled") return next(new Error("unauthorized"));
      socket.user = user;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const room = socket.user.role === "worker" ? "workers" : "admins";
    socket.join(room);

    socket.on("disconnect", () => {
      // no-op — room membership is cleaned up automatically by socket.io
    });
  });
}

module.exports = attachRealtime;
