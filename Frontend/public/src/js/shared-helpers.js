/* ============================================================
   KLARITY — Shared panel helpers
   Loaded by dashboard.html, admin.html, advisor.html
   ============================================================ */

// ── API base URL ─────────────────────────────────────────────
// Relies on /runtime-config.js (sets window.WISEPOCKET_API_BASE_URL).
// Falls back to the production Railway URL if config is absent.
/* exported API */
const API = window.WISEPOCKET_API_BASE_URL || 'https://proyectoingweb2-production.up.railway.app/api';

// ── i18n helper ──────────────────────────────────────────────
/* exported T */
function T(key) {
  const lang = window.getLang ? window.getLang() : (localStorage.getItem('klarity-lang') || 'es');
  const dict = window.__klarityI18n && window.__klarityI18n[lang];
  return (dict && dict[key] !== undefined) ? dict[key] : key;
}

// ── Auth helpers ─────────────────────────────────────────────
/* exported getToken */
function getToken() {
  return localStorage.getItem('klarity_token') || sessionStorage.getItem('klarity_token');
}

/* exported getUserData */
function getUserData() {
  try {
    const raw = localStorage.getItem('klarity_user') || sessionStorage.getItem('klarity_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* exported authHeaders */
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}

// ── HTML escaping ────────────────────────────────────────────
/* exported escHtml */
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ── Date / money formatting ──────────────────────────────────
/* exported fmtDate */
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const locale = (window.getLang && window.getLang() === 'en') ? 'en-GB' : 'es-ES';
  return dt.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

/* exported fmtMoney */
function fmtMoney(n) {
  return isNaN(+n) ? '—' : (+n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Logout ───────────────────────────────────────────────────
/* exported logout */
function logout() {
  localStorage.removeItem('klarity_token');
  localStorage.removeItem('klarity_user');
  sessionStorage.removeItem('klarity_token');
  sessionStorage.removeItem('klarity_user');
  window.location.href = '/login';
}

// ── Sidebar (mobile) ─────────────────────────────────────────
/* exported toggleSidebar */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('open');
  ov.style.display = sb.classList.contains('open') ? 'block' : 'none';
}

/* exported closeSidebar */
function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.style.display = 'none';
}
