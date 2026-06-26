const Doctor = require('../models/Doctor');
const PendingDoctor = require('../models/PendingDoctor');
const { sendApprovalEmail } = require('../services/emailServices');

// GET /api/admin/doctors
// Access: Admin Only
exports.getPendingDoctors = async (req, res) => {
  try {
    // Return all doctors so admin can manage pending, rejected, approved, and suspended ones
    const pending = await PendingDoctor.find({}).sort({ createdAt: -1 });
    const registered = await Doctor.find({}).sort({ createdAt: -1 });
    res.status(200).json([...pending, ...registered]);
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

    // Check if doctor is already approved
    let doctor = await Doctor.findById(doctorId);
    if (doctor) {
      return res.status(200).json({ message: 'Doctor is already approved.', doctor });
    }

    const pending = await PendingDoctor.findById(doctorId);
    if (!pending) {
      return res.status(404).json({ message: 'Doctor application not found.' });
    }

    // Create doctor in Doctor collection
    doctor = await Doctor.create({
      name: pending.name,
      email: pending.email,
      password: pending.password, // Hashed password will be saved, pre-save hook will skip re-hashing
      profileImage: pending.profileImage,
      specialization: pending.specialization,
      qualification: pending.qualification,
      experienceYears: pending.experienceYears,
      consultationFee: pending.consultationFee,
      bio: pending.bio,
      isOnline: pending.isOnline,
      lastSeen: pending.lastSeen,
      phone: pending.phone,
      governmentIdUrl: pending.governmentIdUrl,
      emailVerified: true,
      phoneVerified: true,
      status: 'approved',
      isVerified: true,
      approvedBy: req.user?.name || req.user?.id || 'Admin',
      approvedAt: new Date(),
      clinicName: pending.clinicName,
      location: pending.location,
      activeHours: pending.activeHours
    });

    // Delete pending record
    await PendingDoctor.findByIdAndDelete(doctorId);

    // Send approval email notification
    try {
      await sendApprovalEmail(doctor.email, doctor.name);
    } catch (mailErr) {
      console.error('Error sending doctor approval email:', mailErr.message);
    }

    console.log(`[Admin Approval] Doctor ${doctor.name} was approved by ${doctor.approvedBy}`);
    res.status(200).json({ message: 'Doctor application approved successfully. Notification email sent.', doctor });
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

    const doctor = await PendingDoctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor application not found.' });
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
