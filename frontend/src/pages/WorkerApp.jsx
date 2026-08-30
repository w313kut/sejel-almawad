import React, { useState, useEffect, useCallback } from "react";
import { Bell, LogOut, Search, Package, Image as ImageIcon, WifiOff, CheckCheck, RefreshCcw, Trash2 } from "lucide-react";
import { COLORS, Coin, Modal, Empty, Confirm } from "../components/ui";
import { fmtPrice, timeAgo, requestNotificationPermission, triggerSystemNotification, setupWebPushSubscription } from "../utils";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { getSocket } from "../api/socket";

function imgSrc(material) {
  if (!material?.image_url) return null;
  return `${api.API_URL}${material.image_url}`;
}

export default function WorkerApp() {
  const { user, logout } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState(true);
  const [activePopNotif, setActivePopNotif] = useState(null);
  const [notifPerm, setNotifPerm] = useState("granted");
  const [confirmClear, setConfirmClear] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [m, n] = await Promise.all([api.getMaterials(), api.getNotifications()]);
      setMaterials(m.materials);
      setNotifications(n.notifications);
      setConnection(true);
    } catch {
      setConnection(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPerm(Notification.permission);
      if (Notification.permission === "granted") {
        setupWebPushSubscription(api);
      }
    }
    requestNotificationPermission().then((perm) => {
      if (perm === "granted") setupWebPushSubscription(api);
    });
    loadAll();
    const interval = setInterval(loadAll, 2000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const enableNotifs = async () => {
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
    if (perm === "granted") setupWebPushSubscription(api);
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = () => loadAll();
    const onNotif = (notif) => {
      loadAll();
      if (notif?.title && notif?.message) {
        triggerSystemNotification(notif.title, notif.message);
        setActivePopNotif(notif);
        setTimeout(() => setActivePopNotif(null), 6000);
      }
    };
    socket.on("PRICE_UPDATED", onNotif);
    socket.on("NOTIFICATION_ADDED", onNotif);
    socket.on("MATERIAL_DELETED", onUpdate);
    socket.on("DATA_CHANGED", onUpdate);
    socket.on("connect", () => setConnection(true));
    socket.on("disconnect", () => setConnection(false));
    return () => {
      socket.off("PRICE_UPDATED", onNotif);
      socket.off("NOTIFICATION_ADDED", onNotif);
      socket.off("MATERIAL_DELETED", onUpdate);
      socket.off("DATA_CHANGED", onUpdate);
    };
  }, [loadAll]);

  const unread = notifications.filter((n) => !n.is_read).length;
  const filtered = materials.filter((m) => m.name.includes(query.trim()));
  const sortedNotifs = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.primaryDark }}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCcw size={26} color={COLORS.gold} className="animate-spin" />
          <p className="text-white text-sm font-bold">جارِ تحميل المواد...</p>
        </div>
      </div>
    );
  }

  const clearAllNotifs = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg }}>
      <div className="sticky top-0 z-20 px-4 py-4" style={{ background: COLORS.primaryDark }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-black text-lg">سجل المواد</p>
            <p className="text-[11px]" style={{ color: "#8FBCB2" }}>أهلاً، {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifs(true)} className="relative p-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Bell size={18} color="#fff" />
              {unread > 0 && (
                <span className="absolute -top-1 -left-1 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center text-white" style={{ background: COLORS.gold }}>{unread}</span>
              )}
            </button>
            <button onClick={logout} className="p-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
              <LogOut size={18} color="#fff" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" color="#8FBCB2" />
          <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", paddingRight: "2.2rem" }} placeholder="ابحث عن مادة..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {activePopNotif && (
        <div className="fixed top-4 left-4 right-4 z-50 shadow-2xl rounded-2xl p-4 flex items-center justify-between transition-all" style={{ background: COLORS.gold, color: "#fff", border: "2px solid #fff" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bell size={22} color="#fff" />
            </div>
            <div>
              <p className="font-black text-sm">{activePopNotif.title || "تحديث جديد"}</p>
              <p className="text-xs text-white/90 font-bold">{activePopNotif.message}</p>
            </div>
          </div>
          <button onClick={() => setActivePopNotif(null)} className="text-xs font-black bg-white/20 px-3 py-1.5 rounded-lg shrink-0 mr-2">إغلاق</button>
        </div>
      )}

      {notifPerm === "default" && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2.5 flex items-center justify-between text-xs font-bold" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <span>🔔 اضغط هنا لتفعيل إشعارات الجوال المنبثقة:</span>
          <button onClick={enableNotifs} className="bg-amber-600 text-white px-3 py-1 rounded-lg font-black text-xs">
            تفعيل الإشعارات الآن
          </button>
        </div>
      )}

      {!connection && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold" style={{ background: "#FBE9E7", color: COLORS.danger }}>
          <WifiOff size={13} /> انقطع الاتصال — يتم عرض آخر بيانات محفوظة، سيتم التحديث تلقائياً عند عودة الاتصال
        </div>
      )}

      <div className="p-4">
        {filtered.length === 0 ? (
          <Empty icon={Package} text={materials.length === 0 ? "لا توجد مواد متاحة حالياً" : "لا توجد نتائج مطابقة"} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-2xl overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <div className="h-28 sm:h-32" style={{ background: "#EFEBE0" }}>
                  {m.image_url ? <img src={imgSrc(m)} className="w-full h-full object-cover" alt={m.name} /> : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={22} color={COLORS.inkSoft} /></div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm mb-1.5 line-clamp-2 break-all leading-snug min-h-[2.5rem] flex items-center" title={m.name}>{m.name}</p>
                  <Coin>{fmtPrice(m.price)}</Coin>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNotifs && (
        <Modal
          title="الإشعارات"
          onClose={() => setShowNotifs(false)}
          headerAction={
            sortedNotifs.length > 0 ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
                title="مسح الإشعارات"
              >
                <Trash2 size={13} />
                <span>مسح الكل</span>
              </button>
            ) : null
          }
        >
          {sortedNotifs.length > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-bold mb-3" style={{ color: COLORS.primary }}>
              <CheckCheck size={14} /> تحديد الكل كمقروء
            </button>
          )}
          {sortedNotifs.length === 0 ? <Empty icon={Bell} text="لا توجد إشعارات" /> : (
            <div className="space-y-2">
              {sortedNotifs.map((n) => (
                <button key={n.id} onClick={() => markRead(n.id)} className="w-full text-right rounded-xl p-3.5 flex items-start gap-3" style={{ background: n.is_read ? "#FAFAF8" : "#EEF6F2", border: `1px solid ${COLORS.border}` }}>
                  <div className="p-1.5 rounded-full shrink-0" style={{ background: n.is_read ? "#EDEAE0" : COLORS.goldSoft }}>
                    <Bell size={13} color={n.is_read ? COLORS.inkSoft : "#7A5A16"} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-xs">{n.title || `إشعار ${n.material_name}`}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: COLORS.inkSoft }}>
                      {n.message || (n.old_price !== n.new_price ? `السابق ${fmtPrice(n.old_price)} → الجديد ${fmtPrice(n.new_price)}` : "")}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: COLORS.inkSoft }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: COLORS.gold }} />}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {confirmClear && (
        <Confirm
          text="هل أنت متأكد من مسح وحذف جميع الإشعارات؟"
          onNo={() => setConfirmClear(false)}
          onYes={() => {
            setConfirmClear(false);
            clearAllNotifs();
          }}
        />
      )}
    </div>
  );
}
