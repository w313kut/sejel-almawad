const express = require("express");
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");
const { now } = require("../utils/helpers");

const router = express.Router();

// GET /api/notifications — every notification, annotated with is_read and filtered by user cleared_at timestamp.
router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT n.*,
              CASE WHEN r.user_id IS NULL THEN 0 ELSE 1 END AS is_read
       FROM notifications n
       LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = ?
       LEFT JOIN notification_clears c ON c.user_id = ?
       WHERE c.cleared_at IS NULL OR n.created_at > c.cleared_at
       ORDER BY n.created_at DESC`
    )
    .all(req.user.id, req.user.id);
  res.json({ notifications: rows });
});

router.put("/:id/read", requireAuth, (req, res) => {
  const notif = db.prepare("SELECT id FROM notifications WHERE id = ?").get(req.params.id);
  if (!notif) return res.status(404).json({ error: "الإشعار غير موجود" });
  db.prepare(
    `INSERT OR IGNORE INTO notification_reads (notification_id, user_id, read_at) VALUES (?, ?, ?)`
  ).run(notif.id, req.user.id, now());
  res.json({ ok: true });
});

router.put("/read-all", requireAuth, (req, res) => {
  const all = db.prepare("SELECT id FROM notifications").all();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO notification_reads (notification_id, user_id, read_at) VALUES (?, ?, ?)`
  );
  const ts = now();
  const tx = db.transaction((rows) => rows.forEach((r) => insert.run(r.id, req.user.id, ts)));
  tx(all);
  res.json({ ok: true });
});

// DELETE /api/notifications — clears notifications ONLY for the requesting user independently.
router.delete("/", requireAuth, (req, res) => {
  const ts = now();
  db.prepare(
    `INSERT INTO notification_clears (user_id, cleared_at) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET cleared_at = excluded.cleared_at`
  ).run(req.user.id, ts);
  res.json({ ok: true });
});

const { VAPID_PUBLIC_KEY, saveSubscription } = require("../utils/push");

router.get("/vapid-key", requireAuth, (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post("/subscribe", requireAuth, (req, res) => {
  const { subscription } = req.body || {};
  if (subscription) {
    saveSubscription(req.user.id, subscription);
  }
  res.json({ ok: true });
});

module.exports = router;
