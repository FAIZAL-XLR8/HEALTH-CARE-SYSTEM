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
    sparse: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  lifestyleProfile: {
    sleepingHours: { type: Number, default: 7 }, // e.g. average hours
    sleepTime: { type: String, default: "11:00 PM" }, // wake/sleep routine
    breakfastTime: { type: String, default: "09:00 AM" },
    lunchTime: { type: String, default: "01:30 PM" },
    dinnerTime: { type: String, default: "08:30 PM" },
    waterIntake: { type: Number, default: 2.0 }, // in Litres
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
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
