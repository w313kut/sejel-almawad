const express = require("express");
const db = require("../db/database");
const { requireAuth, isAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { now, newId, audit } = require("../utils/helpers");
const { sendWorkerPushNotification } = require("../utils/push");

module.exports = function (io) {
  const router = express.Router();

  // GET /api/materials — any authenticated user (admin or worker) can view.
  router.get("/", requireAuth, (req, res) => {
    const rows = db.prepare("SELECT * FROM materials ORDER BY updated_at DESC").all();
    res.json({ materials: rows });
  });

  router.get("/:id", requireAuth, (req, res) => {
    const row = db.prepare("SELECT * FROM materials WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "المادة غير موجودة" });
    res.json({ material: row });
  });

  // POST /api/materials — admin only. A worker hitting this gets a real 403.
  router.post("/", requireAuth, isAdmin, upload.single("image"), (req, res) => {
    try {
      const { name, price } = req.body;
      if (!name || price === undefined || isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ error: "الرجاء إدخال اسم وسعر صحيحين" });
      }
      const id = newId();
      const ts = now();
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      db.prepare(
        `INSERT INTO materials (id, name, image_url, price, created_at, updated_at) VALUES (?,?,?,?,?,?)`
      ).run(id, name.trim(), imageUrl, Number(price), ts, ts);

      audit(req.user.id, req.user.name, "MATERIAL_CREATED", "material", id, { name, price });

      // Notification for creation — isolated so any failure doesn't break the response
      try {
        const notifId = newId();
        const notifTitle = "إضافة مادة جديدة";
        const notifMsg = `تمت إضافة المادة "${name.trim()}" بسعر ${price} بواسطة ${req.user.name}`;
        db.prepare(
          `INSERT INTO notifications (id, material_id, material_name, title, message, old_price, new_price, changed_by_name, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`
        ).run(notifId, id, name.trim(), notifTitle, notifMsg, Number(price), Number(price), req.user.name, ts);

        const notifPayload = { id: notifId, title: notifTitle, message: notifMsg, materialName: name.trim(), changedByName: req.user.name, createdAt: ts };
        io.emit("NOTIFICATION_ADDED", notifPayload);
        sendWorkerPushNotification(notifPayload);
        io.emit("DATA_CHANGED");
      } catch (_) { /* ignore notification errors */ }

      const material = db.prepare("SELECT * FROM materials WHERE id = ?").get(id);
      res.status(201).json({ material });
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ error: "حدث خطأ أثناء إضافة المادة" });
      }
    }
  });

  // PUT /api/materials/:id — admin only. Handles name/image/price changes and
  // triggers notification + realtime chain for any modification.
  router.put("/:id", requireAuth, isAdmin, upload.single("image"), (req, res) => {
    try {
      const existing = db.prepare("SELECT * FROM materials WHERE id = ?").get(req.params.id);
      if (!existing) return res.status(404).json({ error: "المادة غير موجودة" });

      const { name, price, removeImage } = req.body;
      const newName = name !== undefined && name.trim() ? name.trim() : existing.name;
      const newPrice = price !== undefined && !isNaN(Number(price)) ? Number(price) : existing.price;
      const isRemoveImg = removeImage === "true";
      const newImage = req.file ? `/uploads/${req.file.filename}` : isRemoveImg ? null : existing.image_url;
      const ts = now();

      db.prepare(
        `UPDATE materials SET name = ?, image_url = ?, price = ?, updated_at = ? WHERE id = ?`
      ).run(newName, newImage, newPrice, ts, existing.id);

      audit(req.user.id, req.user.name, "MATERIAL_UPDATED", "material", existing.id, { before: existing, after: { newName, newPrice } });

      const priceChanged = Number(existing.price) !== Number(newPrice);
      const nameChanged = existing.name !== newName;
      const imageChanged = existing.image_url !== newImage;

      let notifTitle = "";
      let notifMsg = "";

      if (priceChanged) {
        const histId = newId();
        db.prepare(
          `INSERT INTO price_history (id, material_id, material_name, old_price, new_price, changed_by, changed_by_name, changed_at)
           VALUES (?,?,?,?,?,?,?,?)`
        ).run(histId, existing.id, newName, existing.price, newPrice, req.user.id, req.user.name, ts);

        notifTitle = "تغيير سعر مادة";
        notifMsg = `تم تغيير سعر ${newName} من ${existing.price} إلى ${newPrice} بواسطة ${req.user.name}`;
      } else if (nameChanged) {
        notifTitle = "تعديل اسم مادة";
        notifMsg = `تم تعديل اسم المادة من "${existing.name}" إلى "${newName}" بواسطة ${req.user.name}`;
      } else if (imageChanged) {
        notifTitle = "تحديث صورة مادة";
        notifMsg = `تم تحديث صورة المادة "${newName}" بواسطة ${req.user.name}`;
      }

      if (notifTitle) {
        const notifId = newId();
        try {
          db.prepare(
            `INSERT INTO notifications (id, material_id, material_name, title, message, old_price, new_price, changed_by_name, created_at)
             VALUES (?,?,?,?,?,?,?,?,?)`
          ).run(notifId, existing.id, newName, notifTitle, notifMsg, existing.price, newPrice, req.user.name, ts);

          const payload = {
            id: notifId,
            materialId: existing.id,
            materialName: newName,
            title: notifTitle,
            message: notifMsg,
            oldPrice: existing.price,
            newPrice,
            changedByName: req.user.name,
            createdAt: ts,
          };

          io.emit("NOTIFICATION_ADDED", payload);
          sendWorkerPushNotification(payload);
          if (priceChanged) {
            io.to("workers").emit("PRICE_UPDATED", payload);
            io.to("admins").emit("PRICE_UPDATED", payload);
          }
        } catch (notifErr) {
          /* ignore notification errors — main operation succeeded */
        }
      }

      const material = db.prepare("SELECT * FROM materials WHERE id = ?").get(existing.id);
      try { io.emit("DATA_CHANGED"); } catch (_) {}
      res.json({ material, priceChanged });
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ error: "حدث خطأ أثناء تحديث المادة" });
      }
    }
  });

  // DELETE /api/materials/:id — admin only.
  router.delete("/:id", requireAuth, isAdmin, (req, res) => {
    try {
      const existing = db.prepare("SELECT * FROM materials WHERE id = ?").get(req.params.id);
      if (!existing) return res.status(404).json({ error: "المادة غير موجودة" });

      db.prepare("DELETE FROM materials WHERE id = ?").run(existing.id);
      audit(req.user.id, req.user.name, "MATERIAL_DELETED", "material", existing.id, { name: existing.name });

      // Notification + realtime — isolated so failures don't affect the response
      try {
        const ts = now();
        const notifId = newId();
        const notifTitle = "حذف مادة";
        const notifMsg = `تم حذف المادة "${existing.name}" بواسطة ${req.user.name}`;
        db.prepare(
          `INSERT INTO notifications (id, material_id, material_name, title, message, old_price, new_price, changed_by_name, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`
        ).run(notifId, existing.id, existing.name, notifTitle, notifMsg, existing.price, existing.price, req.user.name, ts);

        const payload = { id: notifId, title: notifTitle, message: notifMsg, materialName: existing.name, changedByName: req.user.name, createdAt: ts };
        io.to("workers").emit("MATERIAL_DELETED", { id: existing.id });
        io.emit("NOTIFICATION_ADDED", payload);
        sendWorkerPushNotification(payload);
        io.emit("DATA_CHANGED");
      } catch (_) { /* ignore notification errors */ }

      res.json({ ok: true });
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ error: "حدث خطأ أثناء حذف المادة" });
      }
    }
  });

  return router;
};
