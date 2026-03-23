/**
 * Thin fetch wrapper for `/api/*`.
 * Dev: Vite proxy → local Express. Prod same-origin: Express serves `client/dist`.
 * Prod split (e.g. Vercel + API host): set `VITE_API_BASE_URL` (no trailing slash), e.g. `https://api.example.com/api`.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")
  : "/api";

export function getToken() {
  return localStorage.getItem("beancraft_token");
}

export function setAuth(token, user) {
  if (token) localStorage.setItem("beancraft_token", token);
  else localStorage.removeItem("beancraft_token");
  if (user) localStorage.setItem("beancraft_user", JSON.stringify(user));
  else localStorage.removeItem("beancraft_user");
}

/**
 * @param {string} path - e.g. "/products?category=coffee"
 * @param {RequestInit & { body?: object }} options - plain objects are JSON-encoded
 */
export async function api(path, options = {}) {
  const { body, headers: optHeaders, ...rest } = options;
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    Accept: "application/json",
    ...optHeaders,
  };

  // Public GET/HEAD catalog endpoints do not need a token; avoids edge cases with proxies.
  const token = getToken();
  if (token && method !== "GET" && method !== "HEAD") {
    headers.Authorization = `Bearer ${token}`;
  }
  if (token && (method === "GET" || method === "HEAD") && options.auth === true) {
    headers.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;
  if (body !== undefined && body !== null) {
    if (typeof body === "object" && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      finalBody = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: finalBody,
  });

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
