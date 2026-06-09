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
    default: null,
  },
  googleRating: {
    type: Number,
    default: null,
  },
  scrapedRating: {
    type: Number,
    default: null,
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
