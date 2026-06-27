const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  slotTime: {
    type: String, // e.g., "10:00 AM", "11:00 AM"
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  appointmentStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'expired'],
    default: 'pending',
  },
  chatEnabledUntil: {
    type: Date,
  },
  // Keep original visual queue, Stripe, and lab attributes
  patient: { // legacy alias for User mapping
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  doctor: { // legacy alias for Doctor mapping
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
  },
  type: {
    type: String,
    enum: ['doctor', 'lab'],
    default: 'doctor',
  },
  testsSelected: [
    {
      testId: String,
      testName: String,
      price: Number,
    }
  ],
  queueNumber: {
    type: Number,
    default: 1,
  },
  reservedUntil: {
    type: Date,
  },
  patientName: {
    type: String,
  },
  patientAge: {
    type: String,
  },
  patientGender: {
    type: String,
  },
  stripeSessionId: {
    type: String,
  },
  razorpayOrderId: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
