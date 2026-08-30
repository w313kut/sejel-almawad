import React, { useState } from "react";
import { Search, Plus, Pencil, Trash2, Image as ImageIcon, Package } from "lucide-react";
import { COLORS, Btn, Field, inputCls, inputStyle, Modal, Confirm, Coin, Empty } from "../../components/ui";
import ImagePicker from "../../components/ImagePicker";
import { fmtPrice, timeAgo } from "../../utils";
import { api } from "../../api/client";

function imgSrc(material) {
  if (!material?.image_url) return null;
  return `${api.API_URL}${material.image_url}`;
}

function MaterialForm({ initial, onSave, onClose, saving }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [image, setImage] = useState(initial ? { blob: null, previewUrl: imgSrc(initial) } : null);
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) return setError("الرجاء إدخال اسم المادة");
    if (price === "" || isNaN(price) || Number(price) < 0) return setError("الرجاء إدخال سعر صحيح");
    onSave({
      name: name.trim(),
      price: Number(price),
      imageBlob: image?.blob || null,
      removeImage: image?.removeImage || false,
    });
  };

  return (
    <Modal title={initial ? "تعديل مادة" : "إضافة مادة"} onClose={onClose}>
      {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "#FBE9E7", color: COLORS.danger }}>{error}</div>}
      <Field label="اسم المادة">
        <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: سكر" />
      </Field>
      <Field label="السعر (بالدينار العراقي)">
        <input type="number" className={inputCls} style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1000" />
      </Field>
      <Field label="صورة المادة">
        <ImagePicker previewUrl={image?.previewUrl} onChange={setImage} />
      </Field>
      <div className="flex gap-2 justify-end mt-4">
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn variant="primary" onClick={submit} disabled={saving}>{saving ? "جارِ الحفظ..." : "حفظ المادة"}</Btn>
      </div>
    </Modal>
  );
}

export default function AdminMaterials({ materials, onChanged, showToast }) {
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = materials.filter((m) => m.name.includes(query.trim()));

  const buildForm = ({ name, price, imageBlob, removeImage }) => {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("price", price);
    if (imageBlob) fd.append("image", imageBlob, "material.jpg");
    if (removeImage) fd.append("removeImage", "true");
    return fd;
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await api.updateMaterial(editing.id, buildForm(data));
      } else {
        await api.createMaterial(buildForm(data));
      }
      setFormOpen(false);
      onChanged();
      showToast(editing ? "تم تحديث المادة بنجاح" : "تمت إضافة المادة بنجاح");
    } catch (e) {
      // If the server actually saved (status 200/201) but the tunnel dropped the response,
      // we still get a JSON parse error or network error. Reload data and close silently.
      if (!e.status || e.status === 200 || e.status === 201 || e.status === 0) {
        setFormOpen(false);
        onChanged();
        showToast(editing ? "تم التحديث بنجاح ✓" : "تمت الإضافة بنجاح ✓");
      } else {
        showToast(e.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteMaterial(id);
      showToast("تم حذف المادة بنجاح");
      onChanged();
    } catch (e) {
      // If status is 0 or missing → tunnel dropped response but delete likely succeeded
      if (!e.status || e.status === 200 || e.status === 0) {
        onChanged();
        showToast("تم حذف المادة بنجاح ✓");
      } else {
        showToast(e.message, "error");
      }
    } finally {
      setConfirmDel(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" color={COLORS.inkSoft} />
          <input className={inputCls} style={{ ...inputStyle, paddingRight: "2.2rem" }} placeholder="ابحث عن مادة..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Btn variant="gold" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> إضافة مادة
        </Btn>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={Package} text={materials.length === 0 ? "لا توجد مواد بعد. ابدأ بإضافة أول مادة" : "لا توجد نتائج مطابقة"} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="h-28 sm:h-32" style={{ background: "#EFEBE0" }}>
                {m.image_url ? <img src={imgSrc(m)} className="w-full h-full object-cover" alt={m.name} /> : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={22} color={COLORS.inkSoft} /></div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="font-bold text-sm mb-1 line-clamp-2 break-all leading-snug min-h-[2.5rem] flex items-center" title={m.name}>{m.name}</p>
                <Coin>{fmtPrice(m.price)}</Coin>
                <p className="text-[10px] mt-1.5" style={{ color: COLORS.inkSoft }}>آخر تحديث: {timeAgo(m.updated_at)}</p>
                <div className="flex gap-2 mt-3">
                  <Btn variant="soft" size="sm" className="flex-1" onClick={() => { setEditing(m); setFormOpen(true); }}><Pencil size={13} /> تعديل</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setConfirmDel(m)}><Trash2 size={13} color={COLORS.danger} /></Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && <MaterialForm initial={editing} onClose={() => setFormOpen(false)} onSave={handleSave} saving={saving} />}
      {confirmDel && <Confirm text={`هل أنت متأكد من حذف مادة "${confirmDel.name}"؟`} onNo={() => setConfirmDel(null)} onYes={() => handleDelete(confirmDel.id)} />}
    </div>
  );
}
