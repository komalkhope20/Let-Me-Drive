// ============================================
// controllers/authController.js
// ============================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ---- Helper: Generate JWT ----
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ---- POST /api/auth/register ----
const register = async (req, res) => {
  try {
    const { name, email, password, age, contact, role,
            licenseNumber, experience, carType } = req.body;

    // Validate role
    if (!['driver', 'passenger'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be driver or passenger.' });
    }

    // Driver-specific validation
    if (role === 'driver' && !licenseNumber) {
      return res.status(400).json({ message: 'License number is required for drivers.' });
    }

    // Passenger-specific validation
    if (role === 'passenger' && !carType) {
      return res.status(400).json({ message: 'Car type is required for passengers.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Create user object
    const userData = { name, email, password, age, contact, role };
    if (role === 'driver') {
      userData.licenseNumber = licenseNumber;
      userData.experience = experience || 0;
    } else {
      userData.carType = carType;
    }

    const user = await User.create(userData);

    // Return token + user info (exclude password)
    res.status(201).json({
      message: 'Registration successful!',
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        contact: user.contact,
        ...(role === 'driver' && {
          licenseNumber: user.licenseNumber,
          experience: user.experience,
          isAvailable: user.isAvailable,
          rating: user.rating,
        }),
        ...(role === 'passenger' && { carType: user.carType }),
      }
    });

  } catch (err) {
    console.error('Register Error:', err.message);
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ---- POST /api/auth/login ----
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required.' });
    }

    // Find user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or wrong role selected.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    res.json({
      message: 'Login successful!',
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        contact: user.contact,
        ...(role === 'driver' && {
          licenseNumber: user.licenseNumber,
          experience: user.experience,
          isAvailable: user.isAvailable,
          rating: user.rating,
          totalRatings: user.totalRatings,
          totalRides: user.totalRides,
        }),
        ...(role === 'passenger' && { carType: user.carType }),
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ---- GET /api/auth/me ----
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
