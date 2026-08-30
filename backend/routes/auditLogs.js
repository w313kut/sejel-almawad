const express = require("express");
const db = require("../db/database");
const { requireAuth, isSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/audit-logs — super_admin only: full activity trail of the system.
router.get("/", requireAuth, isSuperAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500").all();
  res.json({ auditLogs: rows });
});

module.exports = router;
