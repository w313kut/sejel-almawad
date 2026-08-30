const express = require("express");
const db = require("../db/database");
const { requireAuth, isAdmin, isSuperAdmin } = require("../middleware/auth");
const { hashPassword, now, newId, audit, publicUser } = require("../utils/helpers");

const router = express.Router();

// GET /api/users — admin only (workers never get a roster of other accounts).
router.get("/", requireAuth, isAdmin, (req, res) => {
  const role = req.query.role; // optional filter: 'worker' | 'admin'
  let rows;
  if (role === "worker") {
    rows = db.prepare("SELECT * FROM users WHERE role = 'worker' ORDER BY created_at DESC").all();
  } else if (role === "admin") {
    rows = db.prepare("SELECT * FROM users WHERE role IN ('admin','super_admin') ORDER BY created_at DESC").all();
  } else {
    rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  }
  res.json({ users: rows.map(publicUser) });
});

// POST /api/users — admin only. Creating another admin requires super_admin.
router.post("/", requireAuth, isAdmin, async (req, res) => {
  const { name, username, password, role } = req.body || {};
  if (!name || !password || !role) {
    return res.status(400).json({ error: "الرجاء تعبئة جميع الحقول المطلوبة" });
  }
  const finalUsername = (username && username.trim()) ? username.trim() : name.trim();
  if (!["worker", "admin", "super_admin"].includes(role)) {
    return res.status(400).json({ error: "دور غير صالح" });
  }
  if (role !== "worker" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "إضافة أدمن تتطلب صلاحية Super Admin" });
  }
  const clash = db.prepare("SELECT id FROM users WHERE LOWER(TRIM(username)) = LOWER(?)").get(finalUsername);
  if (clash) return res.status(409).json({ error: "اسم المستخدم مكرر ومستخدم مسبقاً" });

  const id = newId();
  const ts = now();
  const hash = await hashPassword(password);
  db.prepare(
    `INSERT INTO users (id, name, username, password_hash, role, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`
  ).run(id, name.trim(), finalUsername, hash, role, "active", ts, ts);

  audit(req.user.id, req.user.name, "USER_CREATED", "user", id, { username, role });
  const created = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  res.status(201).json({ user: publicUser(created) });
});

// PUT /api/users/:id — admin only. Password only updates if provided.
router.put("/:id", requireAuth, isAdmin, async (req, res) => {
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "المستخدم غير موجود" });

  if (existing.role !== "worker" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "تعديل بيانات الأدمن يتطلب صلاحية Super Admin" });
  }

  const { name, username, password, status } = req.body || {};
  const newName = name?.trim() || existing.name;
  const newUsername = username?.trim() || existing.username;
  const newStatus = status || existing.status;
  const hash = password ? await hashPassword(password) : existing.password_hash;

  db.prepare(
    `UPDATE users SET name=?, username=?, password_hash=?, status=?, updated_at=? WHERE id=?`
  ).run(newName, newUsername, hash, newStatus, now(), existing.id);

  audit(req.user.id, req.user.name, "USER_UPDATED", "user", existing.id, { newName, newUsername, newStatus });
  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(existing.id);
  res.json({ user: publicUser(updated) });
});

// PATCH /api/users/:id/status — toggle enable/disable (workers primarily).
router.patch("/:id/status", requireAuth, isAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "المستخدم غير موجود" });
  const newStatus = existing.status === "active" ? "disabled" : "active";
  db.prepare("UPDATE users SET status=?, updated_at=? WHERE id=?").run(newStatus, now(), existing.id);
  audit(req.user.id, req.user.name, "USER_STATUS_TOGGLED", "user", existing.id, { newStatus });
  res.json({ status: newStatus });
});

// DELETE /api/users/:id — admin only; deleting an admin requires super_admin.
router.delete("/:id", requireAuth, isAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "المستخدم غير موجود" });
  if (existing.role !== "worker" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "حذف أدمن يتطلب صلاحية Super Admin" });
  }
  if (existing.id === req.user.id) {
    return res.status(400).json({ error: "لا يمكنك حذف حسابك الخاص" });
  }
  db.prepare("DELETE FROM users WHERE id = ?").run(existing.id);
  audit(req.user.id, req.user.name, "USER_DELETED", "user", existing.id, { username: existing.username });
  res.json({ ok: true });
});

module.exports = router;
