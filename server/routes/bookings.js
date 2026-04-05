// ============================================
// routes/bookings.js
// ============================================

const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  payBooking,
  rateDriver,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All booking routes are protected
router.use(protect);

// POST   /api/bookings            - Create booking (passenger only)
router.post('/', createBooking);

// GET    /api/bookings            - Get my bookings (driver or passenger)
router.get('/', getMyBookings);

// PATCH  /api/bookings/:id/pay    - Simulate payment
router.patch('/:id/pay', payBooking);

// PATCH  /api/bookings/:id/rate   - Rate a driver
router.patch('/:id/rate', rateDriver);

// PATCH  /api/bookings/:id/cancel - Cancel a booking
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
