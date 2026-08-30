const jwt = require("jsonwebtoken");
const db = require("../db/database");

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the JWT on every protected request. This is the real
 * authorization boundary — the frontend hiding a button is not
 * security, this middleware is.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "غير مصرح. الرجاء تسجيل الدخول" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub);
    if (!user) return res.status(401).json({ error: "المستخدم غير موجود" });
    if (user.status === "disabled") return res.status(403).json({ error: "هذا الحساب معطل" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "الجلسة غير صالحة أو منتهية" });
  }
}

/**
 * Role gate. Usage: requireRole('worker','admin','super_admin')
 * Any role not listed is rejected with a real 403 from the server,
 * regardless of what the client sent or hid in its UI.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "ليست لديك صلاحية لتنفيذ هذه العملية" });
    }
    next();
  };
}

const isAdmin = requireRole("admin", "super_admin");
const isSuperAdmin = requireRole("super_admin");

module.exports = { requireAuth, requireRole, isAdmin, isSuperAdmin };
