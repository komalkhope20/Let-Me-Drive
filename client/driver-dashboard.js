// ============================================
// driver-dashboard.js — Driver Dashboard Logic
// ============================================

let currentUser = null;
let allBookings  = [];

// ---- Initialise on page load ----
document.addEventListener('DOMContentLoaded', async () => {
  // Protect route — only drivers allowed
  if (!requireAuth('driver')) return;

  currentUser = getUser();

  // Populate static UI elements immediately from cached user data
  populateUserInfo(currentUser);

  // Fetch fresh data from API
  await refreshDashboard();
});

// ---- Populate sidebar & static info from user object ----
function populateUserInfo(user) {
  document.getElementById('sidebarName').textContent     = user.name;
  document.getElementById('overviewGreeting').textContent = `Welcome back, ${user.name}!`;
  document.getElementById('profileName').textContent     = user.name;
  document.getElementById('navGreeting').textContent     = `Hi, ${user.name}`;

  // Stats
  document.getElementById('statRides').textContent = user.totalRides || 0;
  document.getElementById('statExp').textContent   = `${user.experience || 0} yrs`;

  const avgRating = user.totalRatings > 0
    ? (user.rating / user.totalRatings).toFixed(1)
    : '—';
  document.getElementById('statRating').textContent = avgRating === '—' ? '—' : `${avgRating} ⭐`;

  // Availability toggle
  const toggle = document.getElementById('availabilityToggle');
  toggle.checked = user.isAvailable;
  updateAvailabilityUI(user.isAvailable);

  // Quick info grid
  document.getElementById('quickInfoGrid').innerHTML = `
    ${infoRow('📧', 'Email',          user.email)}
    ${infoRow('📞', 'Contact',        user.contact)}
    ${infoRow('🎂', 'Age',            `${user.age} years`)}
    ${infoRow('🪪', 'License Number', user.licenseNumber)}
  `;

  // Profile grid
  document.getElementById('profileGrid').innerHTML = `
    ${infoRow('📧', 'Email',          user.email)}
    ${infoRow('📞', 'Contact',        user.contact)}
    ${infoRow('🎂', 'Age',            `${user.age} years`)}
    ${infoRow('🪪', 'License Number', user.licenseNumber)}
    ${infoRow('🏎️', 'Experience',     `${user.experience || 0} years`)}
    ${infoRow('⭐', 'Rating',         avgRating === '—' ? 'No ratings yet' : `${avgRating} / 5.0 (${user.totalRatings} reviews)`)}
    ${infoRow('🚗', 'Total Rides',    user.totalRides || 0)}
  `;

  // Profile availability badge
  document.getElementById('profileBadge').innerHTML =
    `<span class="badge ${user.isAvailable ? 'badge-available' : 'badge-busy'}">
      ${user.isAvailable ? '🟢 Available' : '🔴 Busy'}
    </span>`;
}

// ---- Update availability label & stat ----
function updateAvailabilityUI(isAvailable) {
  const label  = document.getElementById('availabilityLabel');
  const stat   = document.getElementById('statStatus');
  label.textContent = isAvailable ? 'Available' : 'Busy';
  label.style.color = isAvailable ? 'var(--success)' : 'var(--danger)';
  if (stat) stat.innerHTML = isAvailable ? '🟢 Available' : '🔴 Busy';
}

// ---- Toggle availability via API ----
async function toggleAvailability() {
  try {
    const data = await apiFetch('/drivers/availability', { method: 'PATCH' });

    // Update local cache
    currentUser.isAvailable = data.isAvailable;
    saveAuth(getToken(), currentUser);

    updateAvailabilityUI(data.isAvailable);
    showToast(data.message, 'success');

    // Update profile badge
    document.getElementById('profileBadge').innerHTML =
      `<span class="badge ${data.isAvailable ? 'badge-available' : 'badge-busy'}">
        ${data.isAvailable ? '🟢 Available' : '🔴 Busy'}
      </span>`;

  } catch (err) {
    // Revert toggle on error
    const toggle = document.getElementById('availabilityToggle');
    toggle.checked = !toggle.checked;
    showToast(err.message, 'error');
  }
}

// ---- Fetch and refresh all dashboard data ----
async function refreshDashboard() {
  try {
    // Fetch fresh user profile
    const meData = await apiFetch('/auth/me');
    currentUser  = meData.user;
    saveAuth(getToken(), currentUser);
    populateUserInfo(currentUser);

    // Fetch bookings
    const bookData = await apiFetch('/bookings');
    allBookings = bookData.bookings || [];

    renderRecentRides();
    renderAllRides();

  } catch (err) {
    showToast('Failed to load dashboard data.', 'error');
    console.error(err);
  }
}

// ---- Render last 3 rides in Overview tab ----
function renderRecentRides() {
  const container = document.getElementById('recentRides');
  const recent    = allBookings.slice(0, 3);

  if (!recent.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚗</div>
        <div class="empty-state-title">No rides yet</div>
        <div class="empty-state-desc">Go available to start receiving bookings from passengers.</div>
      </div>`;
    return;
  }

  container.innerHTML = recent.map(b => buildRideCard(b)).join('');
}

// ---- Render all rides in Rides tab ----
function renderAllRides() {
  const container = document.getElementById('ridesContainer');

  if (!allBookings.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">No ride history</div>
        <div class="empty-state-desc">Your completed rides will appear here.</div>
      </div>`;
    return;
  }

  container.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px;">
    ${allBookings.map(b => buildRideCard(b, true)).join('')}
  </div>`;
}

// ---- Build a single ride card HTML ----
function buildRideCard(booking, showPassenger = false) {
  const passenger = booking.passengerId || {};
  const fare      = formatCurrency(booking.fare);
  const date      = formatDate(booking.bookedAt || booking.createdAt);

  return `
    <div class="booking-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--accent-dim);border:1px solid var(--border-accent);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🚗</div>
          <div>
            ${showPassenger ? `<div style="font-weight:700;font-size:0.95rem;">${passenger.name || 'Passenger'}</div>` : ''}
            <div style="font-size:0.78rem;color:var(--text-muted);">${date}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${statusBadge(booking.status)}
          ${booking.isPaid ? '<span class="badge badge-completed">✅ Paid</span>' : ''}
        </div>
      </div>

      <div class="booking-route">
        <div class="route-point">
          <div class="route-dot pickup"></div>
          <span style="font-size:0.9rem;">${booking.pickupLocation}</span>
        </div>
        <div class="route-line" style="margin-left:4px;"></div>
        <div class="route-point">
          <div class="route-dot drop"></div>
          <span style="font-size:0.9rem;">${booking.destination}</span>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:16px;">
          <span style="font-size:0.82rem;color:var(--text-muted);">📏 ${booking.estimatedDistance} km</span>
          ${showPassenger && passenger.carType ? `<span style="font-size:0.82rem;color:var(--text-muted);">🚗 ${passenger.carType}</span>` : ''}
          ${booking.driverRating ? `<span style="font-size:0.82rem;color:var(--accent-2);">⭐ Rated ${booking.driverRating}/5</span>` : ''}
        </div>
        <div class="fare-display" style="padding:8px 14px;">
          <span style="font-size:0.75rem;color:var(--text-muted);">Fare</span>
          <span class="fare-amount" style="font-size:1.1rem;margin-left:10px;">${fare}</span>
        </div>
      </div>
    </div>`;
}

// ---- Tab switching ----
function showTab(tabName) {
  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  // Show selected
  document.getElementById(`panel-${tabName}`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}
