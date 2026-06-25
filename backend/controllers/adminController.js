const Doctor = require('../models/Doctor');

// GET /api/admin/doctors
// Access: Admin Only
exports.getPendingDoctors = async (req, res) => {
  try {
    // Return all doctors so admin can manage pending, rejected, approved, and suspended ones
    const doctors = await Doctor.find({}).sort({ createdAt: -1 });
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctor applications:', error);
    res.status(500).json({ message: 'Error retrieving doctor applications.' });
  }
};

// POST /api/admin/doctors/:doctorId/approve
// Access: Admin Only
exports.approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    doctor.status = 'approved';
    doctor.isVerified = true;
    doctor.approvedBy = req.user.name || req.user.id || 'Admin';
    doctor.approvedAt = new Date();
    doctor.rejectionReason = ''; // Clear any previous rejection reasons

    await doctor.save();

    console.log(`[Admin Approval] Doctor ${doctor.name} was approved by ${doctor.approvedBy}`);
    res.status(200).json({ message: 'Doctor application approved successfully.', doctor });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ message: 'Error approving doctor application.' });
  }
};

// POST /api/admin/doctors/:doctorId/reject
// Access: Admin Only
exports.rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    doctor.status = 'rejected';
    doctor.isVerified = false;
    doctor.rejectionReason = rejectionReason.trim();

    await doctor.save();

    // Log the simulation email sent to the rejected doctor
    console.log(`
======================================================================
[EMAIL MOCK] - DOCTOR APPLICATION REJECTED
To: ${doctor.email}
Subject: AeroHealth Doctor Application Status Update

Dear Dr. ${doctor.name},

Your application for AeroHealth has been reviewed by the admin panel.
Unfortunately, your application was rejected for the following reason:

"${doctor.rejectionReason}"

Please log in to your registration wizard, review your credentials, and
re-upload a valid ID document matching the requirements (PDF, PNG, JPG).

Best regards,
AeroHealth Verification Authority
======================================================================
    `);

    res.status(200).json({ message: 'Doctor application rejected. Notification email logged.', doctor });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({ message: 'Error rejecting doctor application.' });
  }
};

// POST /api/admin/doctors/:doctorId/suspend
// Access: Admin Only
exports.suspendDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    doctor.status = 'suspended';
    doctor.isVerified = false;

    await doctor.save();

    console.log(`[Admin Suspension] Doctor ${doctor.name} has been suspended.`);
    res.status(200).json({ message: 'Doctor account suspended.', doctor });
  } catch (error) {
    console.error('Error suspending doctor:', error);
    res.status(500).json({ message: 'Error suspending doctor account.' });
  }
};
