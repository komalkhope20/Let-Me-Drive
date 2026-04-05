// ============================================
// utils.js — Shared Utilities
// ============================================

// Always point to the backend server.
// Open the site via http://localhost:5000 (not file://) after running start.bat
const API_BASE = 'http://localhost:5000/api';

// ---- Token Management ----
const getToken = () => localStorage.getItem('lmd_token');
const getUser  = () => {
  const u = localStorage.getItem('lmd_user');
  return u ? JSON.parse(u) : null;
};
const saveAuth = (token, user) => {
  localStorage.setItem('lmd_token', token);
  localStorage.setItem('lmd_user', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('lmd_token');
  localStorage.removeItem('lmd_user');
};

// ---- Authenticated Fetch Wrapper ----
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
};

// ---- Toast Notifications ----
const showToast = (message, type = 'info', duration = 3500) => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

// ---- Redirect if not authenticated ----
const requireAuth = (expectedRole) => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = 'login.html';
    return false;
  }
  if (expectedRole && user.role !== expectedRole) {
    // Redirect to correct dashboard
    window.location.href = user.role === 'driver'
      ? 'driver-dashboard.html'
      : 'passenger-dashboard.html';
    return false;
  }
  return true;
};

// ---- Redirect if already logged in ----
const redirectIfLoggedIn = () => {
  const token = getToken();
  const user  = getUser();
  if (token && user) {
    window.location.href = user.role === 'driver'
      ? 'driver-dashboard.html'
      : 'passenger-dashboard.html';
  }
};

// ---- Logout ----
const logout = () => {
  clearAuth();
  showToast('Logged out successfully.', 'info', 1200);
  setTimeout(() => window.location.href = 'index.html', 800);
};

// ---- Format Currency ----
const formatCurrency = (amount) => `₹${Number(amount).toFixed(0)}`;

// ---- Format Date ----
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ---- Render Star Rating ----
const renderStars = (rating, totalRatings) => {
  if (!totalRatings || totalRatings === 0) return '<span style="color:var(--text-muted);font-size:0.8rem;">No ratings yet</span>';
  const avg = rating / totalRatings;
  const full  = Math.floor(avg);
  const half  = avg - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  let stars = '';
  for (let i = 0; i < full;  i++) stars += '<span style="color:#f5a623;">★</span>';
  if (half)                        stars += '<span style="color:#f5a623;">☆</span>';
  for (let i = 0; i < empty; i++) stars += '<span style="color:var(--text-muted);">★</span>';
  return `<span style="display:flex;align-items:center;gap:4px;">${stars} <span style="font-size:0.8rem;color:var(--text-muted);margin-left:4px;">${avg.toFixed(1)} (${totalRatings})</span></span>`;
};

// ---- Status Badge HTML ----
const statusBadge = (status) => {
  const map = {
    pending:     'badge-pending',
    accepted:    'badge-accent',
    'in-progress':'badge-accent',
    completed:   'badge-completed',
    cancelled:   'badge-cancelled',
  };
  return `<span class="badge ${map[status] || 'badge-pending'}">${status}</span>`;
};

// ---- Profile Info Row ----
const infoRow = (icon, label, value) => `
  <div style="display:flex;flex-direction:column;gap:4px;padding:14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);">
    <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${icon} ${label}</div>
    <div style="font-weight:600;font-size:0.95rem;">${value || '—'}</div>
  </div>`;

// ---- Fare Calculator ----
const calcFare = (km) => Math.round(50 + 12 * Number(km));
