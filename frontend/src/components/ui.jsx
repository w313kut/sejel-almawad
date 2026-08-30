import React from "react";
import { X, Check, AlertTriangle, Coins } from "lucide-react";

export const COLORS = {
  bg: "#F6F4EF",
  surface: "#FFFFFF",
  ink: "#16231F",
  inkSoft: "#5B6B65",
  primary: "#0B5D52",
  primaryDark: "#083F38",
  gold: "#C08A28",
  goldSoft: "#F1E2C0",
  danger: "#B3413A",
  border: "#E4DFD3",
};

export function Coin({ children }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-bold rounded-full px-3 py-1 text-sm"
      style={{ background: COLORS.goldSoft, color: "#7A5A16", border: `1px solid ${COLORS.gold}55` }}
    >
      <Coins size={14} />
      {children}
    </span>
  );
}

export function Btn({ children, variant = "primary", onClick, type = "button", className = "", disabled, size = "md" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { md: "px-4 py-2.5 text-sm", sm: "px-3 py-1.5 text-xs", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: { background: COLORS.primary, color: "#fff" },
    gold: { background: COLORS.gold, color: "#fff" },
    danger: { background: COLORS.danger, color: "#fff" },
    ghost: { background: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}` },
    soft: { background: "#EEF3F1", color: COLORS.primaryDark },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${className}`} style={variants[variant]}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-bold mb-1.5" style={{ color: COLORS.inkSoft }}>{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
export const inputStyle = { background: "#FBFAF7", border: `1px solid ${COLORS.border}`, color: COLORS.ink };

export function Modal({ title, onClose, children, wide, headerAction }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(22,35,31,0.55)" }}>
      <div className={`w-full ${wide ? "sm:max-w-lg" : "sm:max-w-md"} bg-white rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto`} style={{ background: COLORS.surface, animation: "slideUp .2s ease" }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 className="font-black text-base" style={{ color: COLORS.primaryDark }}>{title}</h3>
          <div className="flex items-center gap-2">
            {headerAction}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5"><X size={18} /></button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ text, onYes, onNo }) {
  return (
    <Modal title="تأكيد العملية" onClose={onNo}>
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-full shrink-0" style={{ background: "#FBE9E7" }}>
          <AlertTriangle size={20} color={COLORS.danger} />
        </div>
        <p className="text-sm" style={{ color: COLORS.ink }}>{text}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <Btn variant="ghost" onClick={onNo}>إلغاء</Btn>
        <Btn variant="danger" onClick={onYes}>حذف</Btn>
      </div>
    </Modal>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white flex items-center gap-2"
      style={{ background: toast.type === "error" ? COLORS.danger : COLORS.primary, animation: "slideDown .2s ease" }}>
      {toast.type === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
      {toast.msg}
    </div>
  );
}

export function Empty({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full mb-3" style={{ background: "#EEF3F1" }}>
        <Icon size={28} color={COLORS.primary} />
      </div>
      <p className="text-sm font-bold" style={{ color: COLORS.inkSoft }}>{text}</p>
    </div>
  );
}
