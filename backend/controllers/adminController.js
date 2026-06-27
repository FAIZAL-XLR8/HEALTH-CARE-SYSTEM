const Doctor = require('../models/Doctor');
const PendingDoctor = require('../models/PendingDoctor');
const { sendApprovalEmail, sendSuspensionEmail } = require('../services/emailServices');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    // Check if doctor is already approved or suspended
    let doctor = await Doctor.findById(doctorId);
    if (doctor) {
      if (doctor.status === 'suspended') {
        doctor.status = 'approved';
        doctor.isVerified = true;
        doctor.rejectionReason = ''; // Clear suspension reason
        await doctor.save();

        try {
          await sendApprovalEmail(doctor.email, doctor.name);
        } catch (mailErr) {
          console.error('Error sending doctor approval email:', mailErr.message);
        }

        return res.status(200).json({ message: 'Doctor account unsuspended successfully. Notification email sent.', doctor });
      }
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
    const { suspensionReason } = req.body;

    if (!suspensionReason || !suspensionReason.trim()) {
      return res.status(400).json({ message: 'Suspension reason is required.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    doctor.status = 'suspended';
    doctor.isVerified = false;
    doctor.rejectionReason = suspensionReason.trim();

    await doctor.save();

    // Send suspension email notification
    try {
      await sendSuspensionEmail(doctor.email, doctor.name, suspensionReason.trim());
    } catch (mailErr) {
      console.error('Error sending doctor suspension email:', mailErr.message);
    }

    console.log(`[Admin Suspension] Doctor ${doctor.name} has been suspended for: ${suspensionReason}`);
    res.status(200).json({ message: 'Doctor account suspended and email notification sent.', doctor });
  } catch (error) {
    console.error('Error suspending doctor:', error);
    res.status(500).json({ message: 'Error suspending doctor account.' });
  }
};

// GET /api/admin/suspend-form/:doctorId
// Access: Public (token query parameter validated internally)
exports.getSuspendForm = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).send('<h1>Not authorized, no token provided.</h1>');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).send('<h1>Access denied. Admin access required.</h1>');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send('<h1>Doctor profile not found.</h1>');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Suspend Doctor Account - AeroHealth</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: #0b0f19;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
          }
          .card {
            background: linear-gradient(135deg, rgba(13, 17, 29, 0.85) 0%, rgba(22, 28, 45, 0.85) 100%);
            border: 1px solid rgba(234, 179, 8, 0.25);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(12px);
            border-radius: 16px;
            max-width: 500px;
            width: 100%;
            padding: 40px;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0 0 8px 0;
            color: #ffffff;
            text-align: center;
          }
          .doctor-name {
            font-size: 1.1rem;
            color: #94a3b8;
            text-align: center;
            margin-bottom: 24px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            font-size: 0.78rem;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          textarea {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            color: #fff;
            font-size: 0.9rem;
            font-family: inherit;
            outline: none;
            resize: vertical;
            box-sizing: border-box;
          }
          textarea:focus {
            border-color: #eab308;
          }
          .btn-container {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }
          button {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-confirm {
            background: #eab308;
            color: #000;
            border: none;
          }
          .btn-confirm:hover {
            opacity: 0.9;
          }
          .btn-cancel {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #94a3b8;
          }
          .btn-cancel:hover {
            background: rgba(255, 255, 255, 0.02);
          }
          .success-panel {
            display: none;
            text-align: center;
          }
          .success-icon {
            font-size: 3rem;
            color: #10b981;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card" id="formCard">
          <h1>Confirm Suspension</h1>
          <div class="doctor-name">Dr. ${doctor.name} (${doctor.specialization})</div>
          
          <div class="form-group">
            <label for="reason">Reason for Suspension</label>
            <textarea id="reason" rows="5" placeholder="Please provide specific details and reasons for suspending this doctor account. This explanation will be included in the notification email sent to the doctor..."></textarea>
          </div>

          <div class="btn-container">
            <button class="btn-cancel" onclick="window.close()">Cancel</button>
            <button class="btn-confirm" id="btnConfirm">Confirm Suspension</button>
          </div>
        </div>

        <div class="card success-panel" id="successCard">
          <div class="success-icon">✓</div>
          <h2>Doctor Suspended</h2>
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 24px;">The account has been suspended and the doctor has been notified via email.</p>
          <button class="btn-confirm" onclick="window.close()" style="max-width: 150px; margin: 0 auto;">Close Window</button>
        </div>

        <script>
          const btnConfirm = document.getElementById('btnConfirm');
          const reasonInput = document.getElementById('reason');
          const formCard = document.getElementById('formCard');
          const successCard = document.getElementById('successCard');

          btnConfirm.addEventListener('click', async () => {
            const reason = reasonInput.value.trim();
            if (!reason) {
              alert('Please enter a reason for suspension.');
              return;
            }

            if (!confirm('Are you sure you want to suspend this doctor account? They will lose access immediately.')) {
              return;
            }

            btnConfirm.disabled = true;
            btnConfirm.textContent = 'Suspending...';

            try {
              const response = await fetch('/api/admin/doctors/${doctor._id}/suspend', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ${token}'
                },
                body: JSON.stringify({ suspensionReason: reason })
              });

              const data = await response.json();
              if (response.ok) {
                if (window.opener) {
                  window.opener.postMessage('doctor-suspended', '*');
                }
                formCard.style.display = 'none';
                successCard.style.display = 'block';
              } else {
                alert(data.message || 'Suspension failed.');
                btnConfirm.disabled = false;
                btnConfirm.textContent = 'Confirm Suspension';
              }
            } catch (err) {
              console.error(err);
              alert('Error connecting to server.');
              btnConfirm.disabled = false;
              btnConfirm.textContent = 'Confirm Suspension';
            }
          });
        </script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error serving suspend form:', error);
    res.status(500).send('<h1>Server Error: Could not load suspension form.</h1>');
  }
};
