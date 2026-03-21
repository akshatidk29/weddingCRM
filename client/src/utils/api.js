import axios from 'axios';
import useToastStore from '../stores/toastStore';

/* ─────────────────────────────────────────
   Axios instance with production-grade config
───────────────────────────────────────── */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000, // 20s timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─────────────────────────────────────────
   Deduplication — suppress identical toasts
   within a short window
───────────────────────────────────────── */
const recentErrors = new Map();
const DEDUP_WINDOW_MS = 3000;

function showErrorOnce(message) {
  const now = Date.now();
  const lastShown = recentErrors.get(message);
  if (lastShown && now - lastShown < DEDUP_WINDOW_MS) return;
  recentErrors.set(message, now);
  useToastStore.getState().error(message);
  // Cleanup old entries periodically
  if (recentErrors.size > 20) {
    for (const [key, ts] of recentErrors) {
      if (now - ts > DEDUP_WINDOW_MS * 2) recentErrors.delete(key);
    }
  }
}

/* ─────────────────────────────────────────
   Request interceptor — attach JWT
───────────────────────────────────────── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ─────────────────────────────────────────
   Response interceptor — centralised error handling
───────────────────────────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/login' || currentPath === '/register';

    // ── Network / timeout errors (no response from server) ──
    if (!error.response) {
      const msg = error.code === 'ECONNABORTED'
        ? 'Request timed out. Please check your connection and try again.'
        : 'Unable to connect to the server. Please check your internet connection.';
      if (!isAuthPage) showErrorOnce(msg);
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    // ── 401 — session expired ──
    if (status === 401 && !isAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      import('../stores/authStore').then(({ default: useAuthStore }) => {
        useAuthStore.setState({ user: null });
      });
      showErrorOnce('Session expired. Please login again.');
      return Promise.reject(error);
    }

    // ── 429 — rate limited ──
    if (status === 429) {
      showErrorOnce('Too many requests. Please wait a moment and try again.');
      return Promise.reject(error);
    }

    // ── 502 / 503 / 504 — server temporarily down ──
    if (status === 502 || status === 503 || status === 504) {
      showErrorOnce('Server is temporarily unavailable. Please try again in a moment.');
      return Promise.reject(error);
    }

    // ── 500 — internal server error ──
    if (status === 500) {
      const msg = serverMessage || 'Something went wrong on the server. Please try again.';
      if (!isAuthPage) showErrorOnce(msg);
      return Promise.reject(error);
    }

    // ── All other errors (400, 403, 404, etc.) ──
    const message = serverMessage || error.message || 'Something went wrong';
    if (!isAuthPage) {
      showErrorOnce(message);
    }

    return Promise.reject(error);
  }
);

export default api;
