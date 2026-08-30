import React, { useState } from "react";
import { Package, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { COLORS, Btn, Field, inputCls, inputStyle } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) return setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
    setBusy(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: `radial-gradient(circle at 50% 0%, #0F6E61 0%, ${COLORS.primaryDark} 60%)` }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ background: COLORS.gold }}>
            <Package size={30} color="#fff" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">سجل المواد</h1>
          <p className="text-sm" style={{ color: "#BFE0D8" }}>نظام إدارة المواد والأسعار</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl p-6 shadow-2xl" style={{ background: COLORS.surface }}>
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2" style={{ background: "#FBE9E7", color: COLORS.danger }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          <Field label="اسم المستخدم">
            <input className={inputCls} style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoCapitalize="none" />
          </Field>
          <Field label="كلمة المرور">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                className={inputCls}
                style={{ ...inputStyle, paddingLeft: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Btn type="submit" variant="primary" className="w-full mt-2" disabled={busy}>
            {busy ? "جارِ التحقق..." : "تسجيل الدخول"}
          </Btn>
        </form>
      </div>
    </div>
  );
}
