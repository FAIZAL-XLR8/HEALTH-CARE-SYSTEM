const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Lab = require('../models/Lab');
const DoctorAvailability = require('../models/DoctorAvailability');

// HELPER: Convert slot time to minutes
const parseTimeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (hours === 12) hours = 0;
  if (modifier === 'PM') hours += 12;
  return hours * 60 + minutes;
};

// GET /api/appointments/slots/:doctorId
// Query: date (e.g. YYYY-MM-DD)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required.' });
    }

        const doctor = await Doctor.findOne({ _id: doctorId, status: 'approved', isVerified: true });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found or profile is not approved/verified.' });
    }

    const defaultSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));

    // Find or create availability record
    let availability = await DoctorAvailability.findOne({ doctorId, date: startOfDay });
    if (!availability) {
      availability = new DoctorAvailability({
        doctorId,
        date: startOfDay,
        slots: defaultSlots.map(time => ({ time, isBooked: false }))
      });
      await availability.save();
    }

    // Find any unexpired reservations (pending payments)
    const now = new Date();
    const activeReservations = await Appointment.find({
      doctorId,
      appointmentDate: startOfDay,
      paymentStatus: 'pending',
      reservedUntil: { $gt: now }
    });

    const slotDetails = availability.slots.map(s => {
      const isReserved = activeReservations.some(r => r.slotTime === s.time);
      const isAvailable = !s.isBooked && !isReserved;

      return {
        slot: s.time,
        isAvailable,
        reason: s.isBooked ? 'booked' : (isReserved ? 'reserved' : null),
        expiresInSeconds: isReserved
          ? Math.max(0, Math.floor((activeReservations.find(r => r.slotTime === s.time).reservedUntil.getTime() - now.getTime()) / 1000))
          : null
      };
    });

    res.status(200).json(slotDetails);
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    res.status(500).json({ message: 'Error retrieving available slots.' });
  }
};

// POST /api/appointments/reserve
// Body: doctorId, date, slotTime
exports.reserveSlot = async (req, res) => {
  try {
    const { doctorId, date, slotTime } = req.body;
    const userId = req.user.id;

    if (!doctorId || !date || !slotTime) {
      return res.status(400).json({ message: 'Doctor, date, and slot time are required.' });
    }

        const doctor = await Doctor.findOne({ _id: doctorId, status: 'approved', isVerified: true });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found or profile is not approved/verified.' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));

    // Find or create availability record
    let availability = await DoctorAvailability.findOne({ doctorId, date: startOfDay });
    if (!availability) {
      availability = new DoctorAvailability({
        doctorId,
        date: startOfDay,
        slots: ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(time => ({ time, isBooked: false }))
      });
      await availability.save();
    }

    const slotIndex = availability.slots.findIndex(s => s.time === slotTime);
    if (slotIndex === -1) {
      return res.status(400).json({ message: 'Invalid slot time.' });
    }

    const slot = availability.slots[slotIndex];
    if (slot.isBooked) {
      return res.status(400).json({ message: 'This slot is already booked.' });
    }

    // Check for unexpired reservation
    const now = new Date();
    const activeReservation = await Appointment.findOne({
      doctorId,
      appointmentDate: startOfDay,
      slotTime,
      paymentStatus: 'pending',
      reservedUntil: { $gt: now }
    });

    if (activeReservation) {
      if (activeReservation.patientId.toString() === userId.toString()) {
        // Refresh hold
        activeReservation.reservedUntil = new Date(Date.now() + 10 * 60 * 1000);
        await activeReservation.save();
        return res.status(200).json({
          message: 'Reservation refreshed.',
          appointment: activeReservation
        });
      }
      return res.status(400).json({ message: 'This slot is currently reserved.' });
    }

    // Queue count wait estimate
    const previousBookings = await Appointment.find({
      doctorId,
      appointmentDate: startOfDay,
      paymentStatus: 'paid'
    });

    const targetMinutes = parseTimeToMinutes(slotTime);
    const beforeCount = previousBookings.filter(appt => {
      try {
        return parseTimeToMinutes(appt.slotTime) < targetMinutes;
      } catch (err) {
        return false;
      }
    }).length;

    const queueNumber = beforeCount + 1;

    // Create the pending appointment
    const appointment = new Appointment({
      patientId: userId,
      patient: userId, // legacy
      doctorId,
      doctor: doctorId, // legacy
      appointmentDate: startOfDay,
      slotTime,
      amountPaid: doctor.consultationFee || 500,
      paymentStatus: 'pending',
      appointmentStatus: 'pending',
      reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
      queueNumber
    });

    await appointment.save();

    res.status(201).json({
      message: 'Slot reserved for 10 minutes.',
      appointment,
      estimatedWaitMinutes: beforeCount * 15
    });
  } catch (error) {
    console.error('Error in reserveSlot:', error);
    res.status(500).json({ message: 'Error reserving slot.' });
  }
};

// GET /api/appointments/patient/dashboard
exports.getPatientDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const appointments = await Appointment.find({
      patientId: userId,
      $or: [
        { paymentStatus: 'paid' },
        { paymentStatus: 'pending', reservedUntil: { $gt: now } }
      ]
    })
      .populate({
        path: 'doctorId',
        select: 'name specialization consultationFee activeHours profileImage'
      })
      // Legacy path populate compatibility
      .populate({
        path: 'doctor',
        select: 'name specialization consultationFee activeHours profileImage'
      })
      .sort({ appointmentDate: 1, slotTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error in getPatientDashboard:', error);
    res.status(500).json({ message: 'Error retrieving patient dashboard.' });
  }
};

// GET /api/appointments/doctor/dashboard
exports.getDoctorDashboard = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findById(req.user.id);
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const doctorId = doctorProfile._id;

    const appointments = await Appointment.find({
      doctorId,
      paymentStatus: 'paid'
    })
      .populate('patientId', 'name email phone profileImage')
      .populate('patient', 'name email phone profileImage')
      .sort({ appointmentDate: 1, slotTime: 1 });

    res.status(200).json({
      doctorProfile,
      appointments
    });
  } catch (error) {
    console.error('Error in getDoctorDashboard:', error);
    res.status(500).json({ message: 'Error retrieving doctor dashboard.' });
  }
};

// Backwards compatibility endpoint
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (req.user && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name specialization clinicName')
      .sort({ appointmentDate: 1, slotTime: 1 });
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving appointments.' });
  }
};

// Legacy createAppointment (fallback)
exports.createAppointment = async (req, res) => {
  try {
    const { providerId, type, date, slotTime, testsSelected } = req.body;
    const patientId = req.user ? req.user.id : req.body.patientId;

    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));

    const appt = new Appointment({
      patientId,
      patient: patientId,
      doctorId: providerId,
      doctor: providerId,
      appointmentDate: startOfDay,
      slotTime,
      amountPaid: 500,
      paymentStatus: 'paid',
      appointmentStatus: 'confirmed',
      status: 'confirmed'
    });

    await appt.save();
    res.status(201).json({ appointment: appt, queueNumber: 1, estimatedWaitMinutes: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Error creating appointment.' });
  }
};
