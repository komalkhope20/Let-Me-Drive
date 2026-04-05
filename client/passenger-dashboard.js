// ============================================
// passenger-dashboard.js — Passenger Dashboard Logic
// ============================================

let currentUser       = null;
let allBookings       = [];
let selectedDriverId  = null;
let selectedDriver    = null;
let activeBookingId   = null;  // for payment / rating
let selectedPayMethod = 'card';
let selectedRating    = 0;

// ---- Init on page load ----
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('passenger')) return;

  currentUser = getUser();
  populateUserInfo(currentUser);

  // Live fare preview as user types distance
  const distInput = document.getElementById('estimatedDistance');
  if (distInput) {
    distInput.addEventListener('input', () => {
      const km = Number(distInput.value);
      document.getElementById('farePreview').textContent =
        km > 0 ? formatCurrency(calcFare(km)) : '₹ —';
    });
  }

  await refreshDashboard();
});

// ---- Populate sidebar & profile ----
function populateUserInfo(user) {
  document.getElementById('sidebarName').textContent = user.name;

  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileGrid').innerHTML = `
    ${infoRow('📧', 'Email',    user.email)}
    ${infoRow('📞', 'Contact',  user.contact)}
    ${infoRow('🎂', 'Age',      `${user.age} years`)}
    ${infoRow('🚗', 'Car Type', user.carType || '—')}
  `;
}

// ---- Refresh all data ----
async function refreshDashboard() {
  await Promise.all([loadDrivers(), loadBookings()]);
}

// ============================================
//  FIND DRIVERS TAB
// ============================================
async function loadDrivers() {
  const grid = document.getElementById('driversGrid');
  grid.innerHTML = '<div class="loading-screen"><span class="spinner"></span><span>Finding drivers...</span></div>';

  try {
    const minExp   = document.getElementById('filterExp')?.value || 0;
    const avail    = document.getElementById('filterAvailable')?.value ?? 'true';

    let query = `?minExperience=${minExp}`;
    if (avail !== '') query += `&available=${avail}`;

    const data = await apiFetch(`/drivers${query}`);
    renderDriverGrid(data.drivers || []);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">${err.message}</div></div>`;
  }
}

function resetFilters() {
  document.getElementById('filterExp').value = 0;
  document.getElementById('filterAvailable').value = 'true';
  loadDrivers();
}

function renderDriverGrid(drivers) {
  const grid = document.getElementById('driversGrid');

  if (!drivers.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No drivers found</div>
        <div class="empty-state-desc">Try changing your filters or check back later.</div>
      </div>`;
    return;
  }

  grid.innerHTML = `<div class="grid-auto">${drivers.map(d => buildDriverCard(d)).join('')}</div>`;
}

function buildDriverCard(driver) {
  const avgRating = driver.totalRatings > 0
    ? (driver.rating / driver.totalRatings).toFixed(1)
    : null;

  return `
    <div class="driver-card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="driver-avatar">🪪</div>
          <div>
            <div class="driver-name">${driver.name}</div>
            <div class="driver-meta">🎂 ${driver.age} yrs &nbsp;•&nbsp; 📞 ${driver.contact}</div>
          </div>
        </div>
        <span class="badge ${driver.isAvailable ? 'badge-available' : 'badge-busy'}">
          ${driver.isAvailable ? '🟢 Available' : '🔴 Busy'}
        </span>
      </div>

      <div class="driver-stats">
        <div class="driver-stat">
          <div class="driver-stat-val">${driver.experience || 0}</div>
          <div class="driver-stat-lbl">Years Exp.</div>
        </div>
        <div class="driver-stat">
          <div class="driver-stat-val">${driver.totalRides || 0}</div>
          <div class="driver-stat-lbl">Total Rides</div>
        </div>
        <div class="driver-stat">
          <div class="driver-stat-val" style="font-size:1rem;">
            ${avgRating ? `${avgRating} ⭐` : '—'}
          </div>
          <div class="driver-stat-lbl">Rating</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;">
        <div style="font-size:0.78rem;color:var(--text-muted);">🪪 License: ${driver.licenseNumber || '—'}</div>
        ${renderStars(driver.rating, driver.totalRatings)}
      </div>

      <button
        class="btn ${driver.isAvailable ? 'btn-primary' : 'btn-ghost'} btn-block"
        onclick="${driver.isAvailable ? `openBookingModal('${driver._id}')` : 'void(0)'}"
        ${driver.isAvailable ? '' : 'disabled'}
      >
        ${driver.isAvailable ? '🚗 Book This Driver' : '⛔ Unavailable'}
      </button>
    </div>`;
}

// ============================================
//  BOOKING MODAL
// ============================================
async function openBookingModal(driverId) {
  selectedDriverId = driverId;

  try {
    const data   = await apiFetch(`/drivers/${driverId}`);
    selectedDriver = data.driver;

    const avg = selectedDriver.totalRatings > 0
      ? (selectedDriver.rating / selectedDriver.totalRatings).toFixed(1)
      : 'No rating';

    document.getElementById('selectedDriverInfo').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="driver-avatar">🪪</div>
        <div>
          <div style="font-weight:800;font-size:1rem;">${selectedDriver.name}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);">
            ${selectedDriver.experience || 0} yrs exp &nbsp;•&nbsp; ⭐ ${avg}
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);">License: ${selectedDriver.licenseNumber}</div>
        </div>
        <span class="badge badge-available" style="margin-left:auto;">🟢 Available</span>
      </div>`;

    // Reset fields
    document.getElementById('pickupLocation').value    = '';
    document.getElementById('destination').value       = '';
    document.getElementById('estimatedDistance').value = '';
    document.getElementById('farePreview').textContent = '₹ —';
    document.getElementById('bookingError').style.display = 'none';

    document.getElementById('bookingModal').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.add('hidden');
  selectedDriverId = null;
  selectedDriver   = null;
}

async function confirmBooking() {
  const pickup   = document.getElementById('pickupLocation').value.trim();
  const dest     = document.getElementById('destination').value.trim();
  const distRaw  = document.getElementById('estimatedDistance').value;
  const errorEl  = document.getElementById('bookingError');

  errorEl.style.display = 'none';

  if (!pickup || !dest) {
    errorEl.textContent   = 'Please enter both pickup location and destination.';
    errorEl.style.display = 'block';
    return;
  }

  const payload = {
    driverId:          selectedDriverId,
    pickupLocation:    pickup,
    destination:       dest,
    estimatedDistance: distRaw ? Number(distRaw) : undefined,
  };

  const btn = document.querySelector('#bookingModal .btn-primary');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Booking...';

  try {
    const data = await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    closeBookingModal();
    showToast('Booking confirmed! 🎉', 'success');

    // Refresh bookings & switch to bookings tab
    allBookings = [data.booking, ...allBookings];
    renderBookings();
    showTab('bookings');

    // Refresh driver list (driver is now Busy)
    await loadDrivers();

  } catch (err) {
    errorEl.textContent   = err.message;
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🚗 &nbsp;Confirm Booking';
  }
}

// ============================================
//  MY BOOKINGS TAB
// ============================================
async function loadBookings() {
  const container = document.getElementById('bookingsContainer');
  container.innerHTML = '<div class="loading-screen"><span class="spinner"></span></div>';

  try {
    const data  = await apiFetch('/bookings');
    allBookings = data.bookings || [];
    renderBookings();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-title">${err.message}</div></div>`;
  }
}

function renderBookings() {
  const container = document.getElementById('bookingsContainer');

  if (!allBookings.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">No bookings yet</div>
        <div class="empty-state-desc">Find a driver and make your first booking!</div>
        <button class="btn btn-primary mt-4" onclick="showTab('find')">Find a Driver →</button>
      </div>`;
    return;
  }

  container.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px;">
    ${allBookings.map(b => buildBookingCard(b)).join('')}
  </div>`;
}

function buildBookingCard(booking) {
  const driver    = booking.driverId || {};
  const fare      = formatCurrency(booking.fare);
  const date      = formatDate(booking.bookedAt || booking.createdAt);
  const canPay    = !booking.isPaid && booking.status !== 'cancelled';
  const canCancel = !booking.isPaid && booking.status === 'pending';
  const canRate   = booking.isPaid && !booking.driverRating;

  return `
    <div class="booking-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--accent-dim);border:1px solid var(--border-accent);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🪪</div>
          <div>
            <div style="font-weight:700;font-size:0.95rem;">${driver.name || 'Driver'}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${date}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          ${statusBadge(booking.status)}
          ${booking.isPaid ? '<span class="badge badge-completed">✅ Paid</span>' : ''}
          ${booking.driverRating ? `<span class="badge badge-accent">⭐ Rated ${booking.driverRating}/5</span>` : ''}
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

      <div style="display:flex;gap:14px;font-size:0.82rem;color:var(--text-muted);flex-wrap:wrap;">
        <span>📏 ${booking.estimatedDistance} km</span>
        ${driver.experience !== undefined ? `<span>🏎️ ${driver.experience} yrs exp</span>` : ''}
        ${driver.licenseNumber ? `<span>🪪 ${driver.licenseNumber}</span>` : ''}
        ${booking.paymentMethod ? `<span>💳 Paid via ${booking.paymentMethod}</span>` : ''}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div class="fare-display" style="flex:1;min-width:140px;">
          <span style="font-size:0.78rem;color:var(--text-muted);">Total Fare</span>
          <span class="fare-amount">${fare}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${booking._id}')">Cancel</button>` : ''}
          ${canPay    ? `<button class="btn btn-primary btn-sm" onclick="openPaymentModal('${booking._id}', ${booking.fare})">💳 Pay Now</button>` : ''}
          ${canRate   ? `<button class="btn btn-warning btn-sm" onclick="openRatingModal('${booking._id}')">⭐ Rate Driver</button>` : ''}
        </div>
      </div>
    </div>`;
}

// ---- Cancel Booking ----
async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    await apiFetch(`/bookings/${bookingId}/cancel`, { method: 'PATCH' });
    showToast('Booking cancelled.', 'info');
    await loadBookings();
    await loadDrivers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================
//  PAYMENT MODAL
// ============================================
function openPaymentModal(bookingId, fare) {
  activeBookingId = bookingId;
  selectedPayMethod = 'card';

  // Reset method selection UI
  document.querySelectorAll('.payment-method').forEach(m => {
    m.classList.toggle('selected', m.dataset.method === 'card');
  });

  document.getElementById('paymentDetails').innerHTML = `
    <div class="fare-display">
      <div>
        <div style="font-weight:700;font-size:1rem;">Ride Fare</div>
        <div style="font-size:0.8rem;color:var(--text-muted);">Simulated secure payment</div>
      </div>
      <div class="fare-amount">${formatCurrency(fare)}</div>
    </div>`;

  document.getElementById('paymentModal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
  activeBookingId = null;
}

function selectPaymentMethod(method) {
  selectedPayMethod = method;
  document.querySelectorAll('.payment-method').forEach(m => {
    m.classList.toggle('selected', m.dataset.method === method);
  });
}

async function processPayment() {
  if (!activeBookingId) return;

  const btn = document.querySelector('#paymentModal .btn-primary');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Processing...';

  try {
    // Simulate slight delay for realism
    await new Promise(r => setTimeout(r, 1000));

    const data = await apiFetch(`/bookings/${activeBookingId}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentMethod: selectedPayMethod }),
    });

    closePaymentModal();
    await loadBookings();

    // Show success screen
    document.getElementById('successModal').classList.remove('hidden');

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '⚡ &nbsp;Pay Now';
  }
}

// ============================================
//  SUCCESS MODAL
// ============================================
function closeSuccessModal() {
  document.getElementById('successModal').classList.add('hidden');
}

function openRatingFromSuccess() {
  closeSuccessModal();
  // Find the most recently paid booking without a rating
  const unrated = allBookings.find(b => b.isPaid && !b.driverRating);
  if (unrated) openRatingModal(unrated._id);
}

// ============================================
//  RATING MODAL
// ============================================
function openRatingModal(bookingId) {
  activeBookingId = bookingId;
  selectedRating  = 0;
  // Reset stars
  document.querySelectorAll('.star').forEach(s => s.classList.remove('filled'));
  document.getElementById('ratingModal').classList.remove('hidden');
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.add('hidden');
  activeBookingId = null;
  selectedRating  = 0;
}

function setRating(val) {
  selectedRating = val;
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('filled', Number(s.dataset.val) <= val);
  });
}

async function submitRating() {
  if (!selectedRating) {
    showToast('Please select a star rating first.', 'error');
    return;
  }

  const btn = document.getElementById('submitRatingBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    await apiFetch(`/bookings/${activeBookingId}/rate`, {
      method: 'PATCH',
      body: JSON.stringify({ rating: selectedRating }),
    });

    closeRatingModal();
    showToast(`Thanks! You rated the driver ${selectedRating} ⭐`, 'success');
    await loadBookings();

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Submit Rating';
  }
}

// ============================================
//  TAB SWITCHING
// ============================================
function showTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  document.getElementById(`panel-${tabName}`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');

  // Lazy load bookings when tab is opened
  if (tabName === 'bookings') loadBookings();
}
