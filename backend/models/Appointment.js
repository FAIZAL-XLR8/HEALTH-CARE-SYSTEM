const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false, // Optional, only if doctor appointment
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: false, // Optional, only if lab test appointment
  },
  type: {
    type: String,
    enum: ['doctor', 'lab'],
    required: true,
  },
  testsSelected: [
    {
      testId: String,
      testName: String,
      price: Number,
    }
  ],
  date: {
    type: Date,
    required: true,
  },
  slotTime: {
    type: String, // e.g., "05:30 PM", "10:30 AM"
    required: true,
  },
  status: {
    type: String,
    enum: ['booked', 'completed', 'cancelled'],
    default: 'booked',
  },
  queueNumber: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
