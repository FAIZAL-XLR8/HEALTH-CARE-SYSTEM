const mongoose = require('mongoose');

const testItemSchema = new mongoose.Schema({
  testId: {
    type: String,
    required: true,
    trim: true,
  },
  testName: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    default: null,
  },
  tat: {
    type: String, // Turnaround time (e.g., "6 hours", "12 hours")
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  nablAccredited: {
    type: Boolean,
    default: false,
  },
  homeCollection: {
    type: Boolean,
    default: true,
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
  tests: [testItemSchema],
}, {
  timestamps: true,
});

// Create a 2dsphere index for geospatial queries
labSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Lab', labSchema);
