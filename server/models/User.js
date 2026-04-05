// ============================================
// models/User.js - User Schema (Driver & Passenger)
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // --- Common Fields ---
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 18,
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  // Role: 'driver' or 'passenger'
  role: {
    type: String,
    enum: ['driver', 'passenger'],
    required: [true, 'Role is required'],
  },

  // --- Driver-Specific Fields ---
  licenseNumber: {
    type: String,
    // Required only for drivers (validated in controller)
    trim: true,
  },
  experience: {
    type: Number, // Years of experience
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true, // Drivers start as available
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  totalRides: {
    type: Number,
    default: 0,
  },

  // --- Passenger-Specific Fields ---
  carType: {
    type: String, // e.g., "Sedan", "SUV", "Hatchback"
    trim: true,
  },

}, { timestamps: true }); // Adds createdAt & updatedAt automatically

// ---- Pre-save hook: Hash password before saving ----
userSchema.pre('save', async function (next) {
  // Only hash if the password field was modified
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---- Instance method: Compare entered password with hashed password ----
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ---- Virtual: Compute average rating ----
userSchema.virtual('averageRating').get(function () {
  if (this.totalRatings === 0) return 'No ratings yet';
  return (this.rating / this.totalRatings).toFixed(1);
});

module.exports = mongoose.model('User', userSchema);
