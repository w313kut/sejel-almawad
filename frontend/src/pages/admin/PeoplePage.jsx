import React, { useState } from "react";
import { Plus, Pencil, Trash2, Users, ShieldCheck, CircleUserRound } from "lucide-react";
import { COLORS, Btn, Field, inputCls, inputStyle, Modal, Confirm, Empty } from "../../components/ui";
import { api } from "../../api/client";

function PersonForm({ role, initial, onSave, onClose, saving }) {
  const [name, setName] = useState(initial?.name || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) return setError("الرجاء إدخال الاسم");
    if (!initial && !password) return setError("الرجاء إدخال كلمة المرور");
    if (password && password !== confirm) return setError("كلمتا المرور غير متطابقتين");
    const finalUsername = username.trim() ? username.trim() : name.trim();
    const payload = { name: name.trim(), username: finalUsername, role: role === "worker" ? "worker" : "admin" };
    if (password) payload.password = password;
    onSave(payload);
  };

  return (
    <Modal title={initial ? `تعديل ${role === "worker" ? "عامل" : "أدمن"}` : `إضافة ${role === "worker" ? "عامل" : "أدمن"}`} onClose={onClose}>
      {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "#FBE9E7", color: COLORS.danger }}>{error}</div>}
      <Field label={role === "worker" ? "اسم العامل" : "اسم الأدمن"}>
        <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: علي، أحمد، عامل الفرع..." />
      </Field>
      <Field label="اسم المستخدم للدخول (اختياري - إذا تركته فارغاً سيتحدد نفس الاسم)">
        <input className={inputCls} style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" placeholder="اختياري..." />
      </Field>
      <Field label={initial ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}>
        <input type="password" className={inputCls} style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="تأكيد كلمة المرور">
        <input type="password" className={inputCls} style={inputStyle} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <div className="flex gap-2 justify-end mt-4">
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn variant="primary" onClick={submit} disabled={saving}>{saving ? "جارِ الحفظ..." : "حفظ"}</Btn>
      </div>
    </Modal>
  );
}

export default function PeoplePage({ role, users, onChanged, showToast, currentUserId }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const list = users.filter((u) => (role === "worker" ? u.role === "worker" : u.role !== "worker"));

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await api.updateUser(editing.id, data);
        showToast("تم التحديث بنجاح");
      } else {
        await api.createUser(data);
        showToast("تمت الإضافة بنجاح");
      }
      setFormOpen(false);
      onChanged();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try { await api.toggleUserStatus(id); onChanged(); } catch (e) { showToast(e.message, "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id);
      showToast("تم الحذف بنجاح");
      onChanged();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setConfirmDel(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-black text-sm" style={{ color: COLORS.inkSoft }}>{list.length} {role === "worker" ? "عامل" : "أدمن"}</h3>
        <Btn variant="gold" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> إضافة {role === "worker" ? "عامل" : "أدمن"}
        </Btn>
      </div>

      {list.length === 0 ? (
        <Empty icon={role === "worker" ? Users : ShieldCheck} text="لا يوجد أحد بعد" />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          {list.map((u, i) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-4" style={{ background: COLORS.surface, borderTop: i ? `1px solid ${COLORS.border}` : "none" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#EEF3F1" }}>
                <CircleUserRound size={20} color={COLORS.primary} />
              </div>
              <div className="flex-1 min-w-[140px]">
                <p className="font-bold text-sm">{u.name} {u.role === "super_admin" && <span className="text-[10px] font-black rounded px-1.5 py-0.5 ml-1" style={{ background: COLORS.goldSoft, color: "#7A5A16" }}>Super Admin</span>}</p>
                <p className="text-[11px]" style={{ color: COLORS.inkSoft }}>@{u.username} · انضم {new Date(u.created_at).toLocaleDateString("en-GB")}</p>
              </div>
              <span className="text-[11px] font-bold rounded-full px-2.5 py-1" style={{ background: u.status === "active" ? "#E4F3EC" : "#FBE9E7", color: u.status === "active" ? "#276E4E" : COLORS.danger }}>
                {u.status === "active" ? "مفعّل" : "معطل"}
              </span>
              <div className="flex gap-1.5">
                <Btn variant="ghost" size="sm" onClick={() => { setEditing(u); setFormOpen(true); }}><Pencil size={13} /></Btn>
                {role === "worker" && (
                  <Btn variant="soft" size="sm" onClick={() => handleToggle(u.id)}>{u.status === "active" ? "تعطيل" : "تفعيل"}</Btn>
                )}
                {u.id !== currentUserId && (
                  <Btn variant="ghost" size="sm" onClick={() => setConfirmDel(u)}><Trash2 size={13} color={COLORS.danger} /></Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && <PersonForm role={role} initial={editing} onClose={() => setFormOpen(false)} onSave={handleSave} saving={saving} />}
      {confirmDel && <Confirm text={`هل أنت متأكد من حذف "${confirmDel.name}"؟`} onNo={() => setConfirmDel(null)} onYes={() => handleDelete(confirmDel.id)} />}
    </div>
  );
}
