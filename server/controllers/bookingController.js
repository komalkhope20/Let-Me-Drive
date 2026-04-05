// ============================================
// controllers/bookingController.js
// ============================================

const Booking = require('../models/Booking');
const User = require('../models/User');

// ---- Fare Calculation Helper ----
// Base fare: ₹50 + ₹12/km (simulated distance 1-50km)
const calculateFare = (distanceKm) => {
  const baseFare = 50;
  const perKmRate = 12;
  return Math.round(baseFare + perKmRate * distanceKm);
};

// Simulate distance (since we don't have real map API in backend)
const simulateDistance = () => {
  return Math.floor(Math.random() * 50) + 1; // 1 to 50 km
};

// ---- POST /api/bookings - Create a new booking ----
const createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'passenger') {
      return res.status(403).json({ message: 'Only passengers can create bookings.' });
    }

    const { driverId, pickupLocation, destination, estimatedDistance } = req.body;

    if (!driverId || !pickupLocation || !destination) {
      return res.status(400).json({ message: 'Driver, pickup location, and destination are required.' });
    }

    // Check driver exists and is available
    const driver = await User.findOne({ _id: driverId, role: 'driver' });
    if (!driver) return res.status(404).json({ message: 'Driver not found.' });
    if (!driver.isAvailable) {
      return res.status(400).json({ message: 'This driver is currently unavailable.' });
    }

    // Calculate fare
    const distance = estimatedDistance || simulateDistance();
    const fare = calculateFare(distance);

    // Create booking
    const booking = await Booking.create({
      driverId,
      passengerId: req.user.id,
      pickupLocation,
      destination,
      estimatedDistance: distance,
      fare,
      status: 'pending',
    });

    // Mark driver as busy
    driver.isAvailable = false;
    await driver.save();

    // Populate references for response
    await booking.populate('driverId', 'name contact licenseNumber experience');
    await booking.populate('passengerId', 'name contact carType');

    res.status(201).json({ message: 'Booking created successfully!', booking });

  } catch (err) {
    console.error('Create Booking Error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- GET /api/bookings - Get bookings for logged-in user ----
const getMyBookings = async (req, res) => {
  try {
    const filter = req.user.role === 'passenger'
      ? { passengerId: req.user.id }
      : { driverId: req.user.id };

    const bookings = await Booking.find(filter)
      .populate('driverId', 'name contact licenseNumber experience rating')
      .populate('passengerId', 'name contact carType')
      .sort({ createdAt: -1 }); // Newest first

    res.json({ count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- PATCH /api/bookings/:id/pay - Simulate payment ----
const payBooking = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.passengerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'This booking is already paid.' });
    }

    booking.isPaid = true;
    booking.paymentMethod = paymentMethod || 'card';
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Update driver stats and availability
    const driver = await User.findById(booking.driverId);
    if (driver) {
      driver.isAvailable = true;
      driver.totalRides += 1;
      await driver.save();
    }

    res.json({ message: 'Payment successful! Ride completed.', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- PATCH /api/bookings/:id/rate - Rate a driver after ride ----
const rateDriver = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.passengerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (!booking.isPaid) {
      return res.status(400).json({ message: 'Can only rate after payment.' });
    }
    if (booking.driverRating) {
      return res.status(400).json({ message: 'Driver already rated for this ride.' });
    }

    // Update booking rating
    booking.driverRating = rating;
    await booking.save();

    // Update driver's cumulative rating
    const driver = await User.findById(booking.driverId);
    if (driver) {
      driver.rating += rating;
      driver.totalRatings += 1;
      await driver.save();
    }

    res.json({ message: 'Driver rated successfully!', rating });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- PATCH /api/bookings/:id/cancel - Cancel a booking ----
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.passengerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel this booking.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Free up the driver
    await User.findByIdAndUpdate(booking.driverId, { isAvailable: true });

    res.json({ message: 'Booking cancelled.', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createBooking, getMyBookings, payBooking, rateDriver, cancelBooking };
