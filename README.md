# 🚗 Let Me Drive

> A platform connecting **licensed young drivers** with **car owners who prefer not to drive**.

---

## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Setup Instructions](#setup-instructions)
- [API Reference](#api-reference)
- [Features](#features)
- [Database Design](#database-design)

---

## Overview

**Let Me Drive** solves a real-world problem:
- 🧑 Young people have driving skills but no car.
- 👴 Elderly people own cars but prefer not to drive.

This platform connects both groups — drivers register and offer services, passengers search and book a driver for their own car.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript     |
| Backend   | Node.js + Express.js                |
| Database  | MongoDB + Mongoose ODM              |
| Auth      | JWT (JSON Web Tokens) + bcryptjs    |

---

## Folder Structure

```
let-me-drive/
│
├── client/                        # Frontend (static files served by Express)
│   ├── index.html                 # Homepage
│   ├── login.html                 # Login page
│   ├── register.html              # Registration page
│   ├── driver-dashboard.html      # Driver dashboard
│   ├── passenger-dashboard.html   # Passenger dashboard
│   ├── style.css                  # Global styles
│   ├── utils.js                   # Shared JS utilities
│   ├── auth.js                    # Login/register logic
│   ├── driver-dashboard.js        # Driver dashboard logic
│   └── passenger-dashboard.js     # Passenger dashboard logic
│
├── server/
│   ├── server.js                  # Express entry point
│   ├── models/
│   │   ├── User.js                # User schema (drivers & passengers)
│   │   └── Booking.js             # Booking schema
│   ├── controllers/
│   │   ├── authController.js      # Register / Login / Me
│   │   ├── driverController.js    # Driver listing & availability
│   │   └── bookingController.js   # CRUD + pay + rate + cancel
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── drivers.js             # /api/drivers/*
│   │   └── bookings.js            # /api/bookings/*
│   └── middleware/
│       └── authMiddleware.js      # JWT protect middleware
│
├── .env.example                   # Environment variable template
├── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or [MongoDB Atlas](https://cloud.mongodb.com/))
- [Git](https://git-scm.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/let-me-drive.git
cd let-me-drive
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Now edit `.env`:

```env
# If using local MongoDB:
MONGO_URI=mongodb://localhost:27017/letmedrive

# If using MongoDB Atlas:
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/letmedrive

# JWT Secret (use any long random string)
JWT_SECRET=your_very_secret_key_change_this

# Server port
PORT=5000
```

---

### 4. Start MongoDB (Local)

**macOS:**
```bash
brew services start mongodb-community
```

**Ubuntu/Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

Or use [MongoDB Compass](https://www.mongodb.com/products/compass) as a GUI.

---

### 5. Start the Application

**Development mode (auto-restart on changes):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

---

### 6. Open in Browser

```
http://localhost:5000
```

The Express server serves the frontend directly from the `client/` folder.

---

## API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint         | Description              | Auth Required |
|--------|-----------------|--------------------------|---------------|
| POST   | `/register`      | Register a user          | No            |
| POST   | `/login`         | Login and get JWT        | No            |
| GET    | `/me`            | Get current user profile | ✅ Yes        |

**Register payload (Driver):**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "password123",
  "age": 24,
  "contact": "9876543210",
  "role": "driver",
  "licenseNumber": "MH01-1234567",
  "experience": 3
}
```

**Register payload (Passenger):**
```json
{
  "name": "Suresh Patel",
  "email": "suresh@example.com",
  "password": "password123",
  "age": 65,
  "contact": "9988776655",
  "role": "passenger",
  "carType": "Sedan"
}
```

---

### Driver Routes — `/api/drivers`

| Method | Endpoint          | Description               | Auth Required |
|--------|------------------|---------------------------|---------------|
| GET    | `/`               | List all drivers (filters)| No            |
| GET    | `/:id`            | Get driver by ID          | No            |
| PATCH  | `/availability`   | Toggle availability       | ✅ Driver only |

**Query filters for GET `/`:**
```
?available=true       → only available drivers
?minExperience=2      → minimum 2 years experience
?minRating=4          → minimum rating
```

---

### Booking Routes — `/api/bookings`

All routes require authentication (`Authorization: Bearer <token>`).

| Method | Endpoint           | Description              | Role         |
|--------|--------------------|--------------------------|--------------|
| POST   | `/`                | Create booking           | Passenger    |
| GET    | `/`                | Get my bookings          | Both         |
| PATCH  | `/:id/pay`         | Simulate payment         | Passenger    |
| PATCH  | `/:id/rate`        | Rate a driver (1–5)      | Passenger    |
| PATCH  | `/:id/cancel`      | Cancel a booking         | Passenger    |

**Create booking payload:**
```json
{
  "driverId": "64f3a...",
  "pickupLocation": "Koregaon Park, Pune",
  "destination": "Pune Airport",
  "estimatedDistance": 18
}
```

---

## Features

### ✅ Implemented

- [x] Role-based auth (Driver / Passenger) with JWT
- [x] Secure password hashing with bcryptjs
- [x] Driver registration with license & experience
- [x] Passenger registration with car type
- [x] Driver availability toggle
- [x] Search/filter drivers (availability, experience)
- [x] Real-time fare estimation (₹50 + ₹12/km)
- [x] Booking creation with driver validation
- [x] Payment simulation (Card / UPI / Cash)
- [x] Driver rating system (1–5 stars, per booking)
- [x] Booking cancellation
- [x] Ride history for both drivers and passengers
- [x] Responsive UI for mobile & desktop
- [x] Toast notifications
- [x] Tab-based dashboard navigation

---

## Database Design

### Users Collection

```
{
  name:          String  (required)
  email:         String  (unique)
  password:      String  (hashed with bcrypt)
  age:           Number
  contact:       String
  role:          'driver' | 'passenger'

  // Driver-only
  licenseNumber: String
  experience:    Number
  isAvailable:   Boolean
  rating:        Number  (cumulative)
  totalRatings:  Number
  totalRides:    Number

  // Passenger-only
  carType:       String
}
```

### Bookings Collection

```
{
  driverId:          ObjectId → User
  passengerId:       ObjectId → User
  pickupLocation:    String
  destination:       String
  estimatedDistance: Number (km)
  fare:              Number (INR)
  status:            'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'
  isPaid:            Boolean
  paymentMethod:     'card' | 'upi' | 'cash'
  driverRating:      Number (1–5)
  bookedAt:          Date
  completedAt:       Date
}
```

---

## Fare Calculation

```
Fare = ₹50 (base) + ₹12 × distance (km)

Examples:
  5 km  → ₹50 + ₹60  = ₹110
  15 km → ₹50 + ₹180 = ₹230
  30 km → ₹50 + ₹360 = ₹410
```

---

## Environment Variables

| Variable     | Description                          | Default                              |
|-------------|--------------------------------------|--------------------------------------|
| `MONGO_URI` | MongoDB connection string            | `mongodb://localhost:27017/letmedrive` |
| `JWT_SECRET`| JWT signing secret                   | (change this!)                        |
| `PORT`      | Server port                          | `5000`                               |

---

## License

MIT © 2024 Let Me Drive
