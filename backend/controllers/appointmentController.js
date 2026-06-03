const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Lab = require('../models/Lab');

// POST /api/appointments
// Body: patientId, providerId, type ('doctor' | 'lab'), date, slotTime, testsSelected (array, optional)
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, providerId, type, date, slotTime, testsSelected } = req.body;

    if (!patientId || !providerId || !type || !date || !slotTime) {
      return res.status(400).json({ message: 'All booking fields are required.' });
    }

    const appointmentDate = new Date(date);
    // Start of the selected day for query boundary matching
    const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));

    // Verify provider exists
    if (type === 'doctor') {
      const doctorExists = await Doctor.findById(providerId);
      if (!doctorExists) {
        return res.status(404).json({ message: 'Selected doctor could not be found.' });
      }
    } else if (type === 'lab') {
      const labExists = await Lab.findById(providerId);
      if (!labExists) {
        return res.status(404).json({ message: 'Selected lab could not be found.' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid booking provider type.' });
    }

    // Dynamic Live Queue Calculation:
    // Count active appointments booked on the same day for this provider BEFORE the selected slot.
    // In our simplified logic, slots are sorted chronologically. We compare slot times.
    const query = {
      type,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'booked',
    };

    if (type === 'doctor') {
      query.doctor = providerId;
    } else {
      query.lab = providerId;
    }

    const previousBookings = await Appointment.find(query);

    // Simple time sorting comparison helper (e.g. "09:00 AM" vs "10:30 AM")
    const parseTimeToMinutes = (timeStr) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
      return hours * 60 + minutes;
    };

    const targetMinutes = parseTimeToMinutes(slotTime);

    // Count how many previous bookings occur chronologically before our target slot time
    const beforeCount = previousBookings.filter(appt => {
      try {
        return parseTimeToMinutes(appt.slotTime) < targetMinutes;
      } catch (err) {
        return false;
      }
    }).length;

    const queueNumber = beforeCount + 1; // User is placed sequentially right after them

    // Create the booking document
    const appointment = new Appointment({
      patient: patientId,
      doctor: type === 'doctor' ? providerId : undefined,
      lab: type === 'lab' ? providerId : undefined,
      type,
      testsSelected: testsSelected || [],
      date: startOfDay,
      slotTime,
      queueNumber,
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment successfully scheduled.',
      queueNumber,
      estimatedWaitMinutes: beforeCount * 15, // 15 mins average slot duration estimate
      appointment,
    });
  } catch (error) {
    console.error('Error in createAppointment controller:', error);
    res.status(500).json({ message: 'Internal Server Error during appointment scheduling.' });
  }
};

// GET /api/appointments/patient/:patientId
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name specialty clinicName')
      .populate('lab', 'name location')
      .sort({ date: 1, slotTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error in getPatientAppointments controller:', error);
    res.status(500).json({ message: 'Internal Server Error during booking history lookup.' });
  }
};
