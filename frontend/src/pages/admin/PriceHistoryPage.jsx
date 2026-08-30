import React, { useState } from "react";
import { Search, History } from "lucide-react";
import { COLORS, inputCls, inputStyle, Empty } from "../../components/ui";
import { fmtPrice, fmtDateTime } from "../../utils";

export default function PriceHistoryPage({ priceHistory, materials, users }) {
  const [q, setQ] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const admins = users.filter((u) => u.role !== "worker");

  const rows = priceHistory
    .filter((r) => r.material_name.includes(q.trim()))
    .filter((r) => !materialFilter || r.material_id === materialFilter)
    .filter((r) => !adminFilter || r.changed_by === adminFilter)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" color={COLORS.inkSoft} />
          <input className={inputCls} style={{ ...inputStyle, paddingRight: "2.2rem" }} placeholder="ابحث بالاسم..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={inputCls} style={{ ...inputStyle, width: "auto" }} value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)}>
          <option value="">كل المواد</option>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className={inputCls} style={{ ...inputStyle, width: "auto" }} value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)}>
          <option value="">كل الأدمن</option>
          {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {rows.length === 0 ? <Empty icon={History} text="لا توجد سجلات مطابقة" /> : (
        <div className="rounded-2xl overflow-x-auto" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-right" style={{ background: "#F1EFE8" }}>
                {["المادة", "السعر القديم", "السعر الجديد", "الأدمن", "التاريخ", "الوقت"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-black" style={{ color: COLORS.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const { date, time } = fmtDateTime(r.changed_at);
                return (
                  <tr key={r.id} style={{ borderTop: i ? `1px solid ${COLORS.border}` : "none" }}>
                    <td className="px-4 py-3 font-bold">{r.material_name}</td>
                    <td className="px-4 py-3" style={{ color: COLORS.inkSoft }}>{fmtPrice(r.old_price)}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: COLORS.primary }}>{fmtPrice(r.new_price)}</td>
                    <td className="px-4 py-3">{r.changed_by_name}</td>
                    <td className="px-4 py-3">{date}</td>
                    <td className="px-4 py-3">{time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
