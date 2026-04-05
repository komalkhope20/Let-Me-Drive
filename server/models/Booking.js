// ============================================
// models/Booking.js - Booking Schema
// ============================================

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // References to users
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Ride details
  pickupLocation: {
    type: String,
    required: [true, 'Pickup location is required'],
    trim: true,
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
  },
  estimatedDistance: {
    type: Number, // in km (simulated)
    required: true,
  },

  // Fare calculation
  fare: {
    type: Number, // in INR
    required: true,
  },

  // Booking lifecycle status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
  },

  // Payment simulation
  isPaid: {
    type: Boolean,
    default: false,
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'cash', null],
    default: null,
  },

  // Driver rating after ride (optional)
  driverRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },

  // Timestamps for ride lifecycle
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
