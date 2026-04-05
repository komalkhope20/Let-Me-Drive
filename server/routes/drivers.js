// ============================================
// routes/drivers.js
// ============================================

const express = require('express');
const router = express.Router();
const { getAllDrivers, getDriverById, toggleAvailability } = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/drivers         - List all drivers (optional query filters)
router.get('/', getAllDrivers);

// GET /api/drivers/:id     - Get single driver profile
router.get('/:id', getDriverById);

// PATCH /api/drivers/availability - Toggle driver availability (protected)
router.patch('/availability', protect, toggleAvailability);

module.exports = router;
