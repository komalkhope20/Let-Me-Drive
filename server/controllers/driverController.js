// ============================================
// controllers/driverController.js
// ============================================

const User = require('../models/User');

// ---- GET /api/drivers - List all available drivers ----
const getAllDrivers = async (req, res) => {
  try {
    const { available, minExperience, minRating } = req.query;

    // Build filter object
    const filter = { role: 'driver' };
    if (available === 'true') filter.isAvailable = true;
    if (minExperience) filter.experience = { $gte: Number(minExperience) };
    if (minRating) filter.rating = { $gte: Number(minRating) };

    const drivers = await User.find(filter)
      .select('-password -__v')
      .sort({ experience: -1, rating: -1 }); // Sort by experience then rating

    res.json({ count: drivers.length, drivers });
  } catch (err) {
    console.error('Get Drivers Error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- GET /api/drivers/:id - Get single driver profile ----
const getDriverById = async (req, res) => {
  try {
    const driver = await User.findOne({ _id: req.params.id, role: 'driver' })
      .select('-password -__v');

    if (!driver) return res.status(404).json({ message: 'Driver not found.' });
    res.json({ driver });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- PATCH /api/drivers/availability - Toggle driver availability ----
const toggleAvailability = async (req, res) => {
  try {
    // Only drivers can toggle availability
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can update availability.' });
    }

    const driver = await User.findById(req.user.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found.' });

    driver.isAvailable = !driver.isAvailable;
    await driver.save();

    res.json({
      message: `You are now ${driver.isAvailable ? 'Available' : 'Busy'}`,
      isAvailable: driver.isAvailable,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllDrivers, getDriverById, toggleAvailability };
