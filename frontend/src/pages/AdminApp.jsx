import React, { useState, useEffect, useCallback } from "react";
import {
  Package, Users, ShieldCheck, Bell, History, Settings, LogOut,
  Menu, ChevronLeft, CircleUserRound, Wifi, WifiOff, RefreshCcw, Trash2
} from "lucide-react";
import { COLORS, Btn, Empty, Toast } from "../components/ui";
import { fmtPrice, timeAgo, requestNotificationPermission, triggerSystemNotification, setupWebPushSubscription } from "../utils";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { getSocket } from "../api/socket";

import AdminMaterials from "./admin/AdminMaterials";
import PeoplePage from "./admin/PeoplePage";
import PriceHistoryPage from "./admin/PriceHistoryPage";
import AdminNotifications from "./admin/AdminNotifications";
import AdminSettings from "./admin/AdminSettings";

const NAV_ITEMS = [
  { key: "materials", label: "المواد", icon: Package },
  { key: "workers", label: "العمال", icon: Users },
  { key: "admins", label: "الأدمن", icon: ShieldCheck },
  { key: "notifications", label: "الإشعارات", icon: Bell },
  { key: "settings", label: "الإعدادات", icon: Settings },
];

const titles = {
  materials: "إدارة المواد", workers: "إدارة العمال", admins: "إدارة الأدمن",
  notifications: "الإشعارات", settings: "الإعدادات",
};

function Sidebar({ page, setPage, onLogout, mobileOpen, setMobileOpen, unread }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed md:sticky top-0 z-40 md:z-0 h-screen w-64 shrink-0 flex flex-col transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`} style={{ background: COLORS.primaryDark, right: 0 }}>
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: COLORS.gold }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <p className="text-white font-black text-sm">سجل المواد</p>
            <p className="text-[10px]" style={{ color: "#8FBCB2" }}>لوحة تحكم الأدمن</p>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => { setPage(item.key); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-1 text-sm font-bold transition-colors relative"
                style={{ background: active ? "rgba(192,138,40,0.18)" : "transparent", color: active ? COLORS.gold : "#CFE3DE" }}>
                <item.icon size={17} />
                {item.label}
                {item.key === "notifications" && unread > 0 && (
                  <span className="mr-auto text-[10px] font-black rounded-full px-1.5 py-0.5" style={{ background: COLORS.gold, color: "#fff" }}>{unread}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold" style={{ color: "#F3B4AC" }}>
            <LogOut size={17} /> تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ title, onMenu, user, connection, page, hasNotifs, onClearNotifs }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-4 sticky top-0 z-20" style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 rounded-lg" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }} onClick={onMenu}>
          <Menu size={18} />
        </button>
        <h2 className="font-black text-lg" style={{ color: COLORS.primaryDark }}>{title}</h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold" style={{ color: connection ? "#4B8F76" : COLORS.danger }}>
          {connection ? <Wifi size={13} /> : <WifiOff size={13} />} {connection ? "متصل" : "غير متصل"}
        </span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <CircleUserRound size={16} color={COLORS.primary} />
          <span className="text-xs font-bold">{user.name}</span>
        </div>
        {page === "notifications" && hasNotifs && (
          <button
            onClick={onClearNotifs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
            title="حذف جميع الإشعارات"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">مسح الإشعارات</span>
          </button>
        )}
      </div>
    </div>
  );
}

function AdminHome({ materials, users, priceHistory }) {
  const admins = users.filter((u) => u.role !== "worker").length;
  const workers = users.filter((u) => u.role === "worker").length;
  const recent = [...priceHistory].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at)).slice(0, 6);
  const stats = [
    { label: "المواد", value: materials.length, icon: Package },
    { label: "العمال", value: workers, icon: Users },
    { label: "الأدمن", value: admins, icon: ShieldCheck },
    { label: "تغييرات الأسعار", value: priceHistory.length, icon: History },
  ];
  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "#EEF3F1" }}>
              <s.icon size={17} color={COLORS.primary} />
            </div>
            <p className="text-2xl font-black" style={{ color: COLORS.primaryDark }}>{s.value}</p>
            <p className="text-xs font-bold" style={{ color: COLORS.inkSoft }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <h3 className="font-black text-sm mb-4" style={{ color: COLORS.primaryDark }}>آخر تحديثات الأسعار</h3>
        {recent.length === 0 ? <Empty icon={History} text="لا توجد تغييرات أسعار بعد" /> : (
          <div className="space-y-2">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <div>
                  <p className="font-bold text-sm">{r.material_name}</p>
                  <p className="text-[11px]" style={{ color: COLORS.inkSoft }}>{timeAgo(r.changed_at)} · بواسطة {r.changed_by_name}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="line-through" style={{ color: COLORS.inkSoft }}>{fmtPrice(r.old_price)}</span>
                  <ChevronLeft size={14} color={COLORS.gold} />
                  <span style={{ color: COLORS.primary }}>{fmtPrice(r.new_price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("materials");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [users, setUsers] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600); };

  const loadAll = useCallback(async () => {
    try {
      const [m, u, ph, n] = await Promise.all([
        api.getMaterials(), api.getUsers(), api.getPriceHistory(), api.getNotifications(),
      ]);
      setMaterials(m.materials); setUsers(u.users); setPriceHistory(ph.priceHistory); setNotifications(n.notifications);
      setConnection(true);
    } catch (e) {
      setConnection(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission().then((perm) => {
      if (perm === "granted") setupWebPushSubscription(api);
    });
    loadAll();
  }, [loadAll]);

  // Real-time: the socket pushes one event from the server the instant an
  // admin changes a price — every open dashboard reacts immediately.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = () => loadAll();
    socket.on("PRICE_UPDATED", onUpdate);
    socket.on("NOTIFICATION_ADDED", onUpdate);
    socket.on("MATERIAL_DELETED", onUpdate);
    socket.on("DATA_CHANGED", onUpdate);
    socket.on("connect", () => setConnection(true));
    socket.on("disconnect", () => setConnection(false));
    return () => {
      socket.off("PRICE_UPDATED", onUpdate);
      socket.off("NOTIFICATION_ADDED", onUpdate);
      socket.off("MATERIAL_DELETED", onUpdate);
      socket.off("DATA_CHANGED", onUpdate);
    };
  }, [loadAll]);

  const unread = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.primaryDark }}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCcw size={26} color={COLORS.gold} className="animate-spin" />
          <p className="text-white text-sm font-bold">جارِ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const handleClearAllNotifications = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      showToast("تم مسح جميع الإشعارات بنجاح");
    } catch {
      showToast("تعذر مسح الإشعارات", "error");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: COLORS.bg }}>
      <Sidebar page={page} setPage={setPage} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} unread={unread} />
      <div className="flex-1 min-w-0">
        <TopBar title={titles[page]} onMenu={() => setMobileOpen(true)} user={user} connection={connection} page={page} hasNotifs={notifications.length > 0} onClearNotifs={handleClearAllNotifications} />
        {page === "materials" && (
          <AdminMaterials materials={materials} onChanged={loadAll} showToast={showToast} />
        )}
        {page === "workers" && (
          <PeoplePage role="worker" users={users} onChanged={loadAll} showToast={showToast} currentUserId={user.id} />
        )}
        {page === "admins" && (
          <PeoplePage role="admin" users={users} onChanged={loadAll} showToast={showToast} currentUserId={user.id} currentUserRole={user.role} />
        )}
        {page === "notifications" && <AdminNotifications notifications={notifications} onClearAll={handleClearAllNotifications} />}
        {page === "settings" && <AdminSettings user={user} showToast={showToast} />}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
