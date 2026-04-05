// ============================================
// auth.js — Login & Registration Logic
// ============================================

// Currently selected role (driver | passenger)
let selectedRole = 'driver';

// ---- On page load: detect role from URL param ----
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  redirectIfLoggedIn();

  // Pre-select role from URL ?role=passenger
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role');
  if (roleParam === 'passenger' || roleParam === 'driver') {
    selectRole(roleParam);
  }
});

// ---- Role Selection ----
function selectRole(role) {
  selectedRole = role;

  // Update visual state of role buttons
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.role === role);
  });

  // Toggle driver vs passenger specific fields (register page)
  const driverFields    = document.getElementById('driverFields');
  const passengerFields = document.getElementById('passengerFields');

  if (driverFields)    driverFields.style.display    = role === 'driver'    ? 'block' : 'none';
  if (passengerFields) passengerFields.style.display = role === 'passenger' ? 'block' : 'none';
}

// ---- LOGIN Handler ----
async function handleLogin(e) {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl  = document.getElementById('loginError');
  const submitBtn = document.getElementById('submitBtn');

  errorEl.style.display = 'none';

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: selectedRole }),
    });

    // Persist auth data
    saveAuth(data.token, data.user);

    showToast(`Welcome back, ${data.user.name}! 🚗`, 'success');

    // Redirect to the correct dashboard based on role
    setTimeout(() => {
      window.location.href = data.user.role === 'driver'
        ? 'driver-dashboard.html'
        : 'passenger-dashboard.html';
    }, 800);

  } catch (err) {
    errorEl.textContent   = err.message;
    errorEl.style.display = 'block';
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In';
  }
}

// ---- REGISTER Handler ----
async function handleRegister(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const errorEl   = document.getElementById('registerError');
  errorEl.style.display = 'none';

  // Gather common fields
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirmPassword').value;
  const age      = Number(document.getElementById('age').value);
  const contact  = document.getElementById('contact').value.trim();

  // Client-side validation
  if (password !== confirm) {
    errorEl.textContent   = 'Passwords do not match.';
    errorEl.style.display = 'block';
    return;
  }
  if (age < 18) {
    errorEl.textContent   = 'You must be at least 18 years old.';
    errorEl.style.display = 'block';
    return;
  }

  // Build payload
  const payload = { name, email, password, age, contact, role: selectedRole };

  if (selectedRole === 'driver') {
    const licenseNumber = document.getElementById('licenseNumber').value.trim();
    const experience    = Number(document.getElementById('experience').value) || 0;
    if (!licenseNumber) {
      errorEl.textContent   = 'License number is required for drivers.';
      errorEl.style.display = 'block';
      return;
    }
    payload.licenseNumber = licenseNumber;
    payload.experience    = experience;
  } else {
    const carType = document.getElementById('carType').value;
    if (!carType) {
      errorEl.textContent   = 'Please select your car type.';
      errorEl.style.display = 'block';
      return;
    }
    payload.carType = carType;
  }

  // Show loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Creating Account...';

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    saveAuth(data.token, data.user);
    showToast(`Account created! Welcome, ${data.user.name}! 🎉`, 'success');

    setTimeout(() => {
      window.location.href = data.user.role === 'driver'
        ? 'driver-dashboard.html'
        : 'passenger-dashboard.html';
    }, 900);

  } catch (err) {
    errorEl.textContent   = err.message;
    errorEl.style.display = 'block';
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Create Account';
  }
}
