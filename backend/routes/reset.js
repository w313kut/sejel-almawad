const express = require("express");
const db = require("../db/database");
const { requireAuth, isSuperAdmin } = require("../middleware/auth");
const { hashPassword, now } = require("../utils/helpers");

const router = express.Router();

/**
 * POST /api/reset/factory
 * Super admin only — wipes all materials, notifications, price_history,
 * audit_logs, push_subscriptions, notification_reads, notification_clears
 * and resets the admin password to a new one supplied in the request body.
 */
router.post("/factory", requireAuth, isSuperAdmin, async (req, res) => {
  const { confirmText, newPassword } = req.body || {};

  // Require explicit confirmation phrase to prevent accidental resets.
  if (confirmText !== "تصفير النظام") {
    return res.status(400).json({ error: "نص التأكيد غير صحيح" });
  }

  try {
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM price_history").run();
      db.prepare("DELETE FROM notification_reads").run();
      db.prepare("DELETE FROM notification_clears").run();
      db.prepare("DELETE FROM notifications").run();
      db.prepare("DELETE FROM push_subscriptions").run();
      db.prepare("DELETE FROM audit_logs").run();
      db.prepare("DELETE FROM materials").run();
      // Remove all non-admin workers
      db.prepare("DELETE FROM users WHERE role = 'worker'").run();
    });
    tx();

    // Optionally reset admin password
    if (newPassword && newPassword.length >= 4) {
      const hash = await hashPassword(newPassword);
      db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
        .run(hash, now(), req.user.id);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Factory reset error:", err);
    res.status(500).json({ error: "فشل تصفير النظام، يرجى المحاولة مرة أخرى" });
  }
});

module.exports = router;
