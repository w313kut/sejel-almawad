const webpush = require("web-push");
const db = require("../db/database");
const { newId, now } = require("./helpers");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BBz0asfF-cutem4Ij5CvyQiswjpECG6cHXmRg_LEPUHrov70fiuVsCkK6MqNz6IDwUaEjTDTcJJmM1BYJH13j_w";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "F7IldmkfCdiI5BMt5_IjF7kT6jXZuxpkj5X2GVGQ0tY";

webpush.setVapidDetails(
  "mailto:support@sejel-almawad.local",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

function saveSubscription(userId, subscription) {
  if (!subscription || !subscription.endpoint) return;
  const endpoint = subscription.endpoint;
  const keysStr = JSON.stringify(subscription.keys || {});
  const ts = now();
  const existing = db.prepare("SELECT id FROM push_subscriptions WHERE endpoint = ?").get(endpoint);
  if (existing) {
    db.prepare("UPDATE push_subscriptions SET user_id = ?, keys = ?, created_at = ? WHERE id = ?")
      .run(userId, keysStr, ts, existing.id);
  } else {
    db.prepare("INSERT INTO push_subscriptions (id, user_id, endpoint, keys, created_at) VALUES (?,?,?,?,?)")
      .run(newId(), userId, endpoint, keysStr, ts);
  }
}

function sendWorkerPushNotification(payload) {
  setImmediate(() => {
    try {
      const subs = db.prepare(`
        SELECT ps.* FROM push_subscriptions ps
        JOIN users u ON ps.user_id = u.id
        WHERE u.status = 'active'
      `).all();

      if (!subs || subs.length === 0) return;
      const dataString = JSON.stringify(payload);

      Promise.allSettled(
        subs.map(async (sub) => {
          try {
            const subscriptionObj = {
              endpoint: sub.endpoint,
              keys: JSON.parse(sub.keys),
            };
            await webpush.sendNotification(subscriptionObj, dataString);
          } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
            }
          }
        })
      );
    } catch {
      /* ignore */
    }
  });
}

module.exports = {
  VAPID_PUBLIC_KEY,
  saveSubscription,
  sendWorkerPushNotification,
};
