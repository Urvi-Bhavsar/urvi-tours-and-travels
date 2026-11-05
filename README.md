# Urvi Tours & Travels - Booking App

A mobile-friendly web application for car booking and inquiry management built with React, Node.js, Express, and MongoDB.

## Features

### Client Side (Public)
- **Home Page**: Hero banner, featured cars, contact options
- **Car Listing**: Browse all available cars with photos, seats, and rates
- **Car Details**: View car specifications with fare estimator
- **Inquiry Form**: Submit booking inquiries with trip details
- **Thank You Page**: Confirmation after inquiry submission
- **Contact Page**: Business information and contact methods

### Admin Side (Protected)
- **Login**: Secure authentication with account locking
- **Dashboard**: Statistics overview and latest inquiries
- **Car Management**: Add, edit, hide/show cars
- **Inquiry Management**: View and manage customer inquiries with call/WhatsApp buttons

### Key Features
- Mobile-first responsive design
- PWA support (installable on mobile devices)
- Fare estimation calculator
- 10-digit mobile number validation
- Rate limiting on inquiry submissions
- JWT-based authentication
- Role-based access control

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Axios
- CSS3 with mobile-first approach
- Vite

### Backend
- Node.js
- Express 5
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd urvi-tours-travels
```

### 2. Install Server Dependencies
```bash
cd server
npm install
```

### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

### 4. Environment Configuration

#### Server (.env)
Create `/server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/urvi_tours_travels
JWT_SECRET=urvi_tours_travels_jwt_secret_key_2026_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

#### Client (.env)
Create `/client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Urvi Tours & Travels
VITE_APP_ENV=development
```

## Running the Application

### Development Mode

#### Start MongoDB
```bash
# If using local MongoDB
mongod
```

#### Start Server
```bash
cd server
npm run dev
```
Server runs on http://localhost:5000

#### Start Client
```bash
cd client
npm run dev
```
Client runs on http://localhost:5173

### Production Build

#### Build Client
```bash
cd client
npm run build
```

#### Start Server
```bash
cd server
npm start
```

## Creating the First Admin User

### Option 1: Using the Create Users Script (Recommended)
```bash
cd server
npm run create-users
```

This will create two test users:
- **Admin**: email: `admin@urvitours.com` | password: `admin123`
- **Client**: email: `client@example.com` | password: `client123`

### Option 2: Via API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@urvitours.com",
    "mobileNumber": "9876543210",
    "password": "your_secure_password",
    "role": "admin"
  }'
```

### Login URLs
- **Admin Login**: http://localhost:5173/admin/login
- The login page has tabs for both Admin and Client users

## API Endpoints

### Public Routes
- `GET /api/cars` - Get all active cars
- `GET /api/cars/:id` - Get car by ID
- `POST /api/inquiries` - Submit inquiry (rate limited)

### Admin Routes (Protected)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user
- `GET /api/cars/admin/all` - Get all cars (including hidden)
- `POST /api/cars` - Create car
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car
- `PATCH /api/cars/:id/toggle` - Toggle car visibility
- `GET /api/inquiries` - Get all inquiries
- `GET /api/inquiries/stats/summary` - Get statistics
- `GET /api/inquiries/:id` - Get inquiry details
- `PATCH /api/inquiries/:id/status` - Update inquiry status
- `DELETE /api/inquiries/:id` - Delete inquiry

## Project Structure

```
urvi-tours-travels/
├── client/                 # React frontend
│   ├── public/
│   │   ├── manifest.json  # PWA manifest
│   │   └── icons.svg
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   │   ├── admin/     # Admin pages
│   │   │   ├── Home.jsx
│   │   │   ├── CarList.jsx
│   │   │   ├── CarDetail.jsx
│   │   │   ├── InquiryForm.jsx
│   │   │   ├── ThankYou.jsx
│   │   │   └── Contact.jsx
│   │   ├── services/      # API service layer
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── server/                # Node.js backend
    ├── src/
    │   ├── config/        # Database configuration
    │   ├── controllers/   # Route controllers
    │   ├── middleware/    # Auth, rate limiting
    │   ├── models/        # Mongoose models
    │   ├── routes/        # API routes
    │   ├── utils/         # Utility functions
    │   └── app.js         # Express app
    └── package.json
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Account locking after 5 failed login attempts
- Rate limiting on inquiry submissions
- CORS configuration
- Input validation
- Protected admin routes

## Mobile Optimization

- Mobile-first responsive design
- Touch-friendly interfaces
- PWA support for installation
- Optimized for phone screens
- Fast loading times
- Compressed images

## Deployment

### Deploy to Vercel/Netlify (Client)
1. Build the client: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in hosting platform

### Deploy to Render/Railway (Server)
1. Connect your repository
2. Set environment variables
3. Deploy with start command: `npm start`

### MongoDB Atlas (Database)
1. Create a MongoDB Atlas cluster
2. Get connection string
3. Update `MONGODB_URI` in server `.env`

## Customization

### Update Contact Information
- Replace phone numbers in components (search for `+919876543210`)
- Update email in Contact page
- Update office address in Contact page

### Update Branding
- Replace logo in `/client/src/assets/`
- Update colors in CSS files (search for `#667eea` and `#764ba2`)
- Update app name in manifest.json

## Support

For issues or questions, contact the development team.

## License

All rights reserved - Urvi Tours & Travels © 2026
