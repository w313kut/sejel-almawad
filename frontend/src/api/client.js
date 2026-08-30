const API_URL = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("sejel_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("sejel_token", token);
  else localStorage.removeItem("sejel_token");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const err = new Error(data?.error || "حدث خطأ في الاتصال بالخادم");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  API_URL,
  login: (username, password) => request("/api/auth/login", { method: "POST", body: { username, password } }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),

  getMaterials: () => request("/api/materials"),
  createMaterial: (form) => request("/api/materials", { method: "POST", body: form, isForm: true }),
  updateMaterial: (id, form) => request(`/api/materials/${id}`, { method: "PUT", body: form, isForm: true }),
  deleteMaterial: (id) => request(`/api/materials/${id}`, { method: "DELETE" }),

  getUsers: (role) => request(`/api/users${role ? `?role=${role}` : ""}`),
  createUser: (data) => request("/api/users", { method: "POST", body: data }),
  updateUser: (id, data) => request(`/api/users/${id}`, { method: "PUT", body: data }),
  toggleUserStatus: (id) => request(`/api/users/${id}/status`, { method: "PATCH" }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),

  getNotifications: () => request("/api/notifications"),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request("/api/notifications/read-all", { method: "PUT" }),
  clearAllNotifications: () => request("/api/notifications", { method: "DELETE" }),

  getPriceHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/price-history${qs ? `?${qs}` : ""}`);
  },
  getVapidKey: () => request("/api/notifications/vapid-key"),
  subscribePush: (subscription) => request("/api/notifications/subscribe", { method: "POST", body: { subscription } }),
  factoryReset: (confirmText, newPassword) => request("/api/reset/factory", { method: "POST", body: { confirmText, newPassword } }),
};
