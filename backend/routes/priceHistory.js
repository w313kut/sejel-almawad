const express = require("express");
const db = require("../db/database");
const { requireAuth, isAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/price-history — admin only. Supports ?material=&admin=&q=&from=&to=
router.get("/", requireAuth, isAdmin, (req, res) => {
  const { material, admin, q, from, to } = req.query;
  let sql = "SELECT * FROM price_history WHERE 1=1";
  const params = [];

  if (material) { sql += " AND material_id = ?"; params.push(material); }
  if (admin) { sql += " AND changed_by = ?"; params.push(admin); }
  if (q) { sql += " AND material_name LIKE ?"; params.push(`%${q}%`); }
  if (from) { sql += " AND changed_at >= ?"; params.push(from); }
  if (to) { sql += " AND changed_at <= ?"; params.push(to); }

  sql += " ORDER BY changed_at DESC";
  const rows = db.prepare(sql).all(...params);
  res.json({ priceHistory: rows });
});

module.exports = router;
