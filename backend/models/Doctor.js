const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  specialty: {
    type: String,
    required: true,
    trim: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  clinicName: {
    type: String,
    required: true,
    trim: true,
  },
  fee: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  activeHours: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Create a 2dsphere index for geospatial queries
doctorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Doctor', doctorSchema);
