import React, { useState } from "react";
import { RotateCcw, ShieldAlert } from "lucide-react";
import { COLORS, Btn, Field, inputCls, inputStyle, Confirm } from "../../components/ui";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function AdminSettings({ user, showToast }) {
  const { logout } = useAuth();

  // --- Change Password ---
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const savePw = async () => {
    if (pw.length < 4) return showToast("كلمة المرور قصيرة جداً", "error");
    if (pw !== confirmPw) return showToast("كلمتا المرور غير متطابقتين", "error");
    setSaving(true);
    try {
      await api.updateUser(user.id, { password: pw });
      showToast("تم تغيير كلمة المرور بنجاح");
      setPw(""); setConfirmPw("");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // --- Factory Reset ---
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = confirm dialog, 2 = password form
  const [resetPw, setResetPw] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleResetClick = () => {
    setResetStep(1);
    setResetPw("");
    setShowResetConfirm(true);
  };

  const handleResetConfirmed = () => {
    setResetStep(2);
  };

  const handleResetFinal = async () => {
    setResetting(true);
    try {
      await api.factoryReset("تصفير النظام", resetPw || undefined);
      showToast("✅ تم تصفير النظام بنجاح — جارِ تسجيل الخروج...");
      setShowResetConfirm(false);
      setTimeout(() => logout(), 1500);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg">

      {/* Account Info */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <h3 className="font-black text-sm mb-2" style={{ color: COLORS.primaryDark }}>معلومات الحساب</h3>
        <p className="text-xs" style={{ color: COLORS.inkSoft }}>{user.name} — @{user.username} ({user.role === "super_admin" ? "Super Admin" : "Admin"})</p>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <h3 className="font-black text-sm mb-4" style={{ color: COLORS.primaryDark }}>تغيير كلمة المرور</h3>
        <Field label="كلمة المرور الجديدة">
          <input type="password" className={inputCls} style={inputStyle} value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="تأكيد كلمة المرور">
          <input type="password" className={inputCls} style={inputStyle} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
        </Field>
        <Btn variant="primary" onClick={savePw} disabled={saving}>{saving ? "جارِ الحفظ..." : "حفظ كلمة المرور"}</Btn>
      </div>

      {/* Factory Reset */}
      <div className="rounded-2xl p-5" style={{ background: "#FFF5F5", border: "1.5px solid #FECACA" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FEE2E2" }}>
            <ShieldAlert size={18} color="#DC2626" />
          </div>
          <div>
            <h3 className="font-black text-sm" style={{ color: "#DC2626" }}>تصفير النظام (ضبط المصنع)</h3>
            <p className="text-xs mt-1" style={{ color: "#991B1B" }}>
              سيتم حذف جميع المواد والأسعار والإشعارات وسجل التعديلات وجميع حسابات العمال بشكل نهائي وغير قابل للاسترجاع.
            </p>
          </div>
        </div>
        <button
          onClick={handleResetClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90"
          style={{ background: "#DC2626", color: "#fff" }}
        >
          <RotateCcw size={16} />
          تصفير النظام
        </button>
      </div>

      {/* Reset confirmation — step 1 */}
      {showResetConfirm && resetStep === 1 && (
        <Confirm
          text="⚠️ تحذير شديد: سيتم مسح جميع المواد والأسعار والإشعارات وحسابات العمال بشكل نهائي لا رجعة فيه. هل أنت متأكد تماماً؟"
          onNo={() => setShowResetConfirm(false)}
          onYes={handleResetConfirmed}
        />
      )}

      {/* Reset — step 2: optional new password */}
      {showResetConfirm && resetStep === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: COLORS.surface }}>
            <h3 className="font-black text-base mb-1" style={{ color: "#DC2626" }}>تأكيد التصفير النهائي</h3>
            <p className="text-xs mb-4" style={{ color: COLORS.inkSoft }}>
              يمكنك تغيير كلمة مرور حساب الأدمن الآن (اختياري). إذا تركت الحقل فارغاً ستبقى كلمة المرور الحالية.
            </p>
            <Field label="كلمة مرور الأدمن الجديدة (اختياري)">
              <input
                type="password"
                className={inputCls}
                style={inputStyle}
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                placeholder="اتركه فارغاً للإبقاء على نفس الكلمة"
              />
            </Field>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                style={{ borderColor: COLORS.border, color: COLORS.inkSoft }}
              >
                إلغاء
              </button>
              <button
                onClick={handleResetFinal}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90"
                style={{ background: "#DC2626", color: "#fff" }}
              >
                {resetting ? "جارِ التصفير..." : "تأكيد التصفير النهائي 🗑️"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
