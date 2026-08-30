export const fmtPrice = (n) => `${Number(n || 0).toLocaleString("en-US")} د.ع`;

export const fmtDateTime = (iso) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB");
  const time = d.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { date, time };
};

export const timeAgo = (iso) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
};

export function resizeImage(file, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const isImage = file.type ? file.type.startsWith("image/") : true;
    if (!isImage) {
      resolve(file);
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else resolve(file);
            },
            "image/jpeg",
            quality
          );
        } catch {
          URL.revokeObjectURL(url);
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    } catch {
      resolve(file);
    }
  });
}

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

export async function requestNotificationPermission() {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      try {
        const perm = await Notification.requestPermission();
        return perm;
      } catch (e) {
        return Notification.permission;
      }
    }
    return Notification.permission;
  }
  return "unsupported";
}

export async function triggerSystemNotification(title, body) {
  if ("navigator" in window && "vibrate" in navigator) {
    try { navigator.vibrate([300, 100, 300, 100, 300]); } catch (e) {}
  }
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notifTitle = title || "سجل المواد";
    const notifOptions = {
      body: body || "تحديث جديد في الأسعار والمواد",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      dir: "rtl",
      vibrate: [300, 100, 300, 100, 300],
      tag: Date.now().toString(),
      renotify: true,
      requireInteraction: true,
      silent: false,
    };

    // 1. Service Worker Notification (Mobile OS Android/iOS)
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(notifTitle, notifOptions);
        }
      }
    } catch (e) {
      /* ignore */
    }

    // 2. Native Web Notification (Desktop/Windows OS)
    try {
      new Notification(notifTitle, notifOptions);
    } catch (e) {
      /* ignore */
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function setupWebPushSubscription(api) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    if (!reg) return;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { publicKey } = await api.getVapidKey();
      if (!publicKey) return;
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    if (sub) {
      await api.subscribePush(sub.toJSON());
    }
  } catch {
    /* push unsupported or blocked */
  }
}
