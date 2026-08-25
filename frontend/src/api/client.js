// В деплое (Render) задаётся VITE_API_URL с полным адресом backend.
// Локально используется прокси /api из vite.config.js.
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Не авторизован");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Ошибка запроса");
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const data = await request("/auth/login", { method: "POST", body: form, isForm: true });
  localStorage.setItem("token", data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export const me = () => request("/auth/me");

export const listBanks = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return request(`/banks${query ? `?${query}` : ""}`);
};

export const getBank = (id) => request(`/banks/${id}`);
export const createBank = (payload) => request(`/banks`, { method: "POST", body: payload });
export const updateBank = (id, payload) => request(`/banks/${id}`, { method: "PATCH", body: payload });
export const deleteBank = (id) => request(`/banks/${id}`, { method: "DELETE" });

export const upsertOffer = (bankId, payload) =>
  request(`/banks/${bankId}/offer`, { method: "PUT", body: payload });

export const getHistory = (bankId) => request(`/banks/${bankId}/history`);

export const listParsingLogs = (bankId) => request(`/banks/${bankId}/parsing-logs`);
export const addParsingLog = (bankId, status, message) =>
  request(
    `/banks/${bankId}/parsing-logs?status=${encodeURIComponent(status)}&message=${encodeURIComponent(
      message || ""
    )}`,
    { method: "POST" }
  );
