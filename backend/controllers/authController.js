const User = require('../models/User');
const Doctor = require('../models/Doctor');
const PendingDoctor = require('../models/PendingDoctor');
const jwt = require('jsonwebtoken');
const FileType = require('file-type');
const { sendOtpToEmail } = require('../services/emailServices');
const twilioService = require('../services/twilioService');
const { uploadFromBuffer } = require('../services/cloudinaryService');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET , {
    expiresIn: '30d',
  });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// @desc    Register a new user or doctor
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { 
      name, phone, password, email, role = 'patient', 
      specialty, experience, fee, clinicName, activeHours 
    } = req.body;

    if (!name || !password || !email) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (role === 'doctor') {
      if (!specialty || !fee || !clinicName || !phone) {
        return res.status(400).json({ message: 'Phone, specialization, fee, and clinic details are required.' });
      }

      // Check if email already registered as doctor
      const emailExists = await Doctor.findOne({ email: email.toLowerCase().trim() }) ||
                          await PendingDoctor.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email address is already registered as a doctor.' });
      }

      // Check if phone already registered as doctor
      const phoneExists = await Doctor.findOne({ phone: phone.trim() }) ||
                         await PendingDoctor.findOne({ phone: phone.trim() });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number is already registered.' });
      }

      const emailOtp = generateOtp();
      const phoneOtp = generateOtp();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const doctor = await PendingDoctor.create({
        name,
        email: email.toLowerCase().trim(),
        password,
        phone: phone.trim(),
        specialization: specialty,
        experienceYears: Number(experience) || 5,
        clinicName,
        consultationFee: Number(fee),
        activeHours: activeHours || '09:00 AM - 05:00 PM',
        emailOtp,
        emailOtpExpires: otpExpires,
        phoneOtp,
        phoneOtpExpires: otpExpires,
        location: {
          type: 'Point',
          coordinates: [77.641151 + (Math.random() - 0.5) * 0.05, 12.971891 + (Math.random() - 0.5) * 0.05]
        }
      });

      console.log(`
======================================================================
[OTP VERIFICATION CODES]
Doctor: ${doctor.name}
Email OTP sent to ${doctor.email}: ${emailOtp}
SMS OTP sent to ${doctor.phone}: ${phoneOtp}
======================================================================
      `);

      // Send real verification email
      await sendOtpToEmail(doctor.email, emailOtp);

      // Send real verification SMS using twilioService
      const formattedPhone = doctor.phone.startsWith('+') ? doctor.phone : `+91${doctor.phone}`;
      await twilioService.sendOtpToPhoneNumber(formattedPhone);

      return res.status(201).json({
        message: 'Doctor account created. Please verify your Email and Phone OTPs.',
        token: generateToken(doctor._id),
        email: doctor.email,
        phone: doctor.phone,
        user: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          role: 'doctor',
          emailVerified: false,
          phoneVerified: false,
          status: 'pending',
          isVerified: false,
        },
      });
    } else {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for patient registration.' });
      }

      // Check email uniqueness
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email address is already in use.' });
      }

      // Check phone uniqueness
      const phoneExists = await User.findOne({ phone: phone.trim() });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number is already in use.' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password,
        phone: phone.trim(),
      });

      return res.status(201).json({
        message: 'Patient registration successful',
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'patient',
          profileImage: user.profileImage,
        },
      });
    }
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Error registering account.', error: error.message });
  }
};

// @desc    Login patient or doctor
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, phone, password, role = 'patient' } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    if (role === 'admin') {
      if (!email) {
        return res.status(400).json({ message: 'Email is required for admin login.' });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid admin credentials.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid admin credentials.' });
      }

      return res.status(200).json({
        message: 'Logged in successfully as admin',
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: 'admin',
          profileImage: user.profileImage,
        },
      });
    }

    if (role === 'doctor') {
      if (!email) {
        return res.status(400).json({ message: 'Email is required for doctor login.' });
      }

      let doctor = await Doctor.findOne({ email: email.toLowerCase().trim() }).select('+password');
      if (!doctor) {
        doctor = await PendingDoctor.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!doctor) {
          return res.status(401).json({ message: 'Invalid credentials.' });
        }
      }

      const isMatch = await doctor.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      // Check doctor application status
      if (doctor.status === 'pending') {
        return res.status(403).json({ message: 'Your application is under review.' });
      }
      if (doctor.status === 'rejected') {
        return res.status(403).json({ 
          message: 'Your application was rejected.',
          rejectionReason: doctor.rejectionReason 
        });
      }
      if (doctor.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended.' });
      }

      return res.status(200).json({
        message: 'Logged in successfully as doctor',
        token: generateToken(doctor._id),
        user: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          role: 'doctor',
          profileImage: doctor.profileImage,
          emailVerified: doctor.emailVerified,
          phoneVerified: doctor.phoneVerified,
          status: doctor.status,
          isVerified: doctor.isVerified,
        },
      });
    } else {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for login.' });
      }

      const user = await User.findOne({ phone: phone.trim() }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      return res.status(200).json({
        message: 'Logged in successfully as patient',
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'patient',
          profileImage: user.profileImage,
        },
      });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Error logging in.', error: error.message });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: 'Error retrieving profile.' });
  }
};

// @desc    Verify Doctor Email OTP
// @route   POST /api/auth/verify-email-otp
// @access  Private (Doctor only)
const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP code is required.' });
    }

    let doctor = await PendingDoctor.findById(req.user.id);
    if (!doctor) {
      doctor = await Doctor.findById(req.user.id);
    }
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    if (doctor.emailOtp !== otp || new Date() > doctor.emailOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired Email OTP code.' });
    }

    doctor.emailVerified = true;
    doctor.emailOtp = undefined;
    doctor.emailOtpExpires = undefined;
    await doctor.save();

    res.status(200).json({ message: 'Email verified successfully.', emailVerified: true });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    res.status(500).json({ message: 'Internal Server Error during email verification.' });
  }
};

const verifyPhoneOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP code is required.' });
    }

    let doctor = await PendingDoctor.findById(req.user.id);
    if (!doctor) {
      doctor = await Doctor.findById(req.user.id);
    }
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    let verified = false;

    // 1. Check if it matches the locally logged/simulated phone OTP in the database
    if (doctor.phoneOtp && doctor.phoneOtp === otp && new Date() < doctor.phoneOtpExpires) {
      verified = true;
    } else {
      // 2. Otherwise fall back to the live Twilio Verify check
      try {
        const formattedPhone = doctor.phone.startsWith('+') ? doctor.phone : `+91${doctor.phone}`;
        const verificationResult = await twilioService.verifyOtp(formattedPhone, otp);
        if (verificationResult && verificationResult.status === 'approved') {
          verified = true;
        }
      } catch (twilioErr) {
        console.error('Twilio Verify API call failed, using local fallback:', twilioErr.message);
      }
    }

    if (!verified) {
      return res.status(400).json({ message: 'Invalid or expired Phone OTP verification code.' });
    }

    doctor.phoneVerified = true;
    doctor.phoneOtp = undefined;
    doctor.phoneOtpExpires = undefined;
    await doctor.save();

    res.status(200).json({ message: 'Phone number verified successfully.', phoneVerified: true });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    res.status(500).json({ message: 'Internal Server Error during phone verification.' });
  }
};

// @desc    Upload Doctor Government ID
// @route   POST /api/auth/upload-id
// @access  Private (Doctor only)
const uploadGovernmentId = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size exceeds maximum limit of 5MB.' });
    }

    const fileInfo = await FileType.fromBuffer(req.file.buffer);
    if (!fileInfo || !['application/pdf', 'image/jpeg', 'image/png'].includes(fileInfo.mime)) {
      return res.status(400).json({ 
        message: 'Invalid file signature (magic bytes). Allowed types: PDF, JPG, JPEG, PNG.' 
      });
    }

    let doctor = await PendingDoctor.findById(req.user.id);
    if (!doctor) {
      doctor = await Doctor.findById(req.user.id);
    }
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const result = await uploadFromBuffer(req.file.buffer, req.file.originalname);
    
    doctor.governmentIdUrl = result.secure_url;
    await doctor.save();

    res.status(200).json({ 
      message: 'ID document uploaded successfully.', 
      governmentIdUrl: result.secure_url 
    });
  } catch (error) {
    console.error('Error uploading government ID:', error);
    res.status(500).json({ message: 'Internal Server Error during ID upload.', error: error.message });
  }
};

// @desc    Submit Doctor Application
// @route   POST /api/auth/submit-application
// @access  Private (Doctor only)
const submitDoctorApplication = async (req, res) => {
  try {
    let doctor = await PendingDoctor.findById(req.user.id);
    if (!doctor) {
      doctor = await Doctor.findById(req.user.id);
    }
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    if (!doctor.emailVerified || !doctor.phoneVerified) {
      return res.status(400).json({ message: 'Email and phone number must be verified first.' });
    }

    if (!doctor.governmentIdUrl) {
      return res.status(400).json({ message: 'Government ID document proof must be uploaded.' });
    }

    doctor.status = 'pending';
    doctor.isVerified = false;
    await doctor.save();

    res.status(200).json({ 
      message: 'Doctor application submitted successfully under review.', 
      doctor 
    });
  } catch (error) {
    console.error('Error submitting doctor application:', error);
    res.status(500).json({ message: 'Internal Server Error during application submission.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmailOtp,
  verifyPhoneOtp,
  uploadGovernmentId,
  submitDoctorApplication,
};
