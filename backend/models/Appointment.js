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
    enum: ['pending', 'paid', 'failed'],
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

  type: {
    type: String,
    default: 'doctor',
  },
  reservedUntil: { // block fr 10 mins to avoid race conditions
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
  razorpayOrderId: { // payment ke baad jo aata hai order ID
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
