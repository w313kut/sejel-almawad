require("dotenv").config();
const db = require("./db/database");
const { hashPassword, now, newId } = require("./utils/helpers");

async function seed() {
  const existing = db.prepare("SELECT COUNT(*) AS c FROM users").get();
  if (existing.c > 0) {
    console.log("قاعدة البيانات تحتوي بيانات مسبقاً — تم تخطي seed.");
    return;
  }

  const ts = now();
  const adminHash = await hashPassword("admin123");
  const workerHash = await hashPassword("12345");

  db.prepare(
    `INSERT INTO users (id, name, username, password_hash, role, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`
  ).run(newId(), "المدير العام", "admin", adminHash, "super_admin", "active", ts, ts);

  db.prepare(
    `INSERT INTO users (id, name, username, password_hash, role, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`
  ).run(newId(), "محمد أحمد", "worker01", workerHash, "worker", "active", ts, ts);

  const m1 = newId(), m2 = newId();
  db.prepare(`INSERT INTO materials (id, name, image_url, price, created_at, updated_at) VALUES (?,?,?,?,?,?)`).run(m1, "سكر", null, 1250, ts, ts);
  db.prepare(`INSERT INTO materials (id, name, image_url, price, created_at, updated_at) VALUES (?,?,?,?,?,?)`).run(m2, "رز", null, 2250, ts, ts);

  console.log("تم إنشاء الحسابات التجريبية:");
  console.log("  Admin  -> username: admin     password: admin123");
  console.log("  Worker -> username: worker01  password: 12345");
  console.log("⚠️  غيّر كلمات المرور هذه فوراً في بيئة الإنتاج.");
}

seed().then(() => process.exit(0));
