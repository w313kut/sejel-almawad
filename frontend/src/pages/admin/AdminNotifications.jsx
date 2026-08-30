import React, { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { COLORS, Empty, Confirm } from "../../components/ui";
import { fmtPrice, timeAgo } from "../../utils";

export default function AdminNotifications({ notifications, onClearAll }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const sorted = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="p-4 md:p-6">
      {sorted.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold" style={{ color: COLORS.inkSoft }}>سجل الإشعارات ({sorted.length})</p>
        </div>
      )}

      {sorted.length === 0 ? <Empty icon={Bell} text="لا توجد إشعارات بعد" /> : (
        <div className="space-y-2">
          {sorted.map((n) => (
            <div key={n.id} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="p-2 rounded-full shrink-0" style={{ background: COLORS.goldSoft }}><Bell size={15} color="#7A5A16" /></div>
              <div className="flex-1">
                <p className="font-bold text-sm">{n.title || `تنبيه مادة ${n.material_name}`}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.inkSoft }}>
                  {n.message || (n.old_price !== n.new_price ? `من ${fmtPrice(n.old_price)} إلى ${fmtPrice(n.new_price)}` : "")}
                </p>
                <p className="text-[11px] mt-1" style={{ color: COLORS.inkSoft }}>بواسطة {n.changed_by_name} · {timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmClear && (
        <Confirm
          text="هل أنت متأكد من مسح وحذف جميع الإشعارات دفعة واحدة؟"
          onNo={() => setConfirmClear(false)}
          onYes={() => {
            setConfirmClear(false);
            if (onClearAll) onClearAll();
          }}
        />
      )}
    </div>
  );
}
