const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const db = require("../db/database");

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function now() {
  return new Date().toISOString();
}

function newId() {
  return uuid();
}

function audit(userId, userName, action, entityType, entityId, details) {
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(newId(), userId || null, userName || null, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, now());
}

// Never leak the password hash to any API response.
function publicUser(u) {
  if (!u) return u;
  const { password_hash, ...rest } = u;
  return rest;
}

module.exports = { hashPassword, verifyPassword, now, newId, audit, publicUser };
