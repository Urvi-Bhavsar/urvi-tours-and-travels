const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User Schema (same as in models)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobileNumber: String,
  password: String,
  role: String,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createUsers() {
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const clientPassword = await bcrypt.hash('client123', salt);

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@urvitours.com',
      mobileNumber: '9876543210',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('✅ Admin user created:', {
      email: 'admin@urvitours.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create Client User
    const client = await User.create({
      name: 'Client User',
      email: 'client@example.com',
      mobileNumber: '9876543211',
      password: clientPassword,
      role: 'staff', // or you can use 'client' if you add that role
    });
    console.log('✅ Client user created:', {
      email: 'client@example.com',
      password: 'client123',
      role: 'staff'
    });

    console.log('\n🎉 Users created successfully!');
    console.log('\nYou can now login with:');
    console.log('Admin - Email: admin@urvitours.com | Password: admin123');
    console.log('Client - Email: client@example.com | Password: client123');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Users already exist in database');
    } else {
      console.error('Error creating users:', error);
    }
    process.exit(1);
  }
}

createUsers();
