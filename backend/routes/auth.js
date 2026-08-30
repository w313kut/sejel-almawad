const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../db/database");
const { verifyPassword, now, audit, publicUser } = require("../utils/helpers");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Slows brute-force login attempts: 100 tries per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "محاولات دخول كثيرة جداً. الرجاء المحاولة لاحقاً" },
});

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "الرجاء إدخال اسم المستخدم وكلمة المرور" });
  }

  const cleanInput = (username || "").trim();
  const user = db.prepare(
    "SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER(?) OR LOWER(TRIM(name)) = LOWER(?)"
  ).get(cleanInput, cleanInput);

  // Deliberately generic error messages — never confirm whether the
  // username exists, and never leak hashing/internal details.
  if (!user) return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  if (user.status === "disabled") return res.status(403).json({ error: "هذا الحساب معطل. يرجى مراجعة الأدمن" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    audit(user.id, user.name, "LOGIN_FAILED", "user", user.id, null);
    return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  }

  db.prepare("UPDATE users SET last_login = ? WHERE id = ?").run(now(), user.id);

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });

  audit(user.id, user.name, "LOGIN_SUCCESS", "user", user.id, null);
  res.json({ token, user: publicUser(user) });
});

router.post("/logout", requireAuth, (req, res) => {
  audit(req.user.id, req.user.name, "LOGOUT", "user", req.user.id, null);
  // Stateless JWT: the client discards the token. Nothing to invalidate server-side
  // unless a token blacklist/refresh-token store is added.
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
