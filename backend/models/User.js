const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Hidden by default
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-()]{10,15}$/, 'Please fill a valid phone number'],
  },
  profileImage: {
    type: String,
    default: '',
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
  },
  role: {
    type: String,
    enum: ['patient', 'admin'],
    default: 'patient',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  lifestyleProfile: {
    sleepingHours: { type: Number, default: 7 },
    sleepTime: { type: String, default: "11:00 PM" },
    breakfastTime: { type: String, default: "09:00 AM" },
    lunchTime: { type: String, default: "01:30 PM" },
    dinnerTime: { type: String, default: "08:30 PM" },
    waterIntake: { type: Number, default: 2.0 },
    activityLevel: { 
      type: String, 
      enum: ['sedentary', 'moderate', 'active'],
      default: 'sedentary' 
    },
    location: { type: String, default: "Bengaluru" }
  },
  reports: [
    {
      fileName: String,
      uploadedAt: { type: Date, default: Date.now },
      analysis: {
        patientName: String,
        testsIdentified: [String],
        criticalAlerts: [String],
        medicationsIdentified: [String],
        recommendedSpecialist: String,
        suggestedFollowUpTests: [String],
        fullSummary: String
      }
    }
  ]
}, {
  timestamps: true,
});

// Pre-save hook to hash password before storing in database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  // If password was not selected, fetch it dynamically to compare
  let passwordHash = this.password;
  if (!passwordHash) {
    const u = await this.model('User').findById(this._id).select('+password');
    passwordHash = u ? u.password : '';
  }
  return await bcrypt.compare(enteredPassword, passwordHash);
};

module.exports = mongoose.model('User', userSchema);
