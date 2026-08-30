import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { COLORS, Btn } from "./ui";
import { resizeImage } from "../utils";

export default function ImagePicker({ previewUrl, onChange }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    try {
      const blob = await resizeImage(file);
      onChange({ blob, previewUrl: URL.createObjectURL(blob), removeImage: false });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRemove = () => {
    setError("");
    onChange({ blob: null, previewUrl: null, removeImage: true });
  };

  return (
    <div>
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden mb-2.5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
          <img src={previewUrl} alt="معاينة" className="w-full h-44 object-cover" />
        </div>
      ) : (
        <div className="rounded-xl h-32 flex items-center justify-center mb-2.5" style={{ background: "#F1EFE8", border: `1px dashed ${COLORS.border}` }}>
          <ImageIcon size={26} color={COLORS.inkSoft} />
        </div>
      )}

      <div className={`grid gap-2 ${previewUrl ? "grid-cols-3" : "grid-cols-2"}`}>
        <Btn variant="soft" size="sm" onClick={() => cameraRef.current.click()}>
          <Camera size={14} /> الكاميرا
        </Btn>
        <Btn variant="soft" size="sm" onClick={() => galleryRef.current.click()}>
          <ImageIcon size={14} /> المعرض
        </Btn>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:bg-red-100"
            style={{ background: "#FBE9E7", color: COLORS.danger, border: "1px solid #F87171" }}
          >
            <Trash2 size={13} />
            <span>حذف</span>
          </button>
        )}
      </div>
      {error && <p className="text-[11px] font-bold mt-2" style={{ color: COLORS.danger }}>{error}</p>}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
}
