import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminApp from "./pages/AdminApp";
import WorkerApp from "./pages/WorkerApp";
import { COLORS } from "./components/ui";
import { RefreshCcw } from "lucide-react";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.primaryDark }}>
        <RefreshCcw size={26} color={COLORS.gold} className="animate-spin" />
      </div>
    );
  }

  if (!user) return <Login />;
  if (user.role === "worker") return <WorkerApp />;
  return <AdminApp />;
}

export default function App() {
  return (
    <div dir="rtl">
      <AuthProvider>
        <Root />
      </AuthProvider>
    </div>
  );
}
