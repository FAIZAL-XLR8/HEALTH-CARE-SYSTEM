const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper: upload buffer directly to Cloudinary
const uploadFromBuffer = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const options = {
      folder: 'telemedicine_consultations',
      resource_type: 'auto',
      public_id: `${cleanName}_${Date.now()}`,
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('Cloudinary stream upload error:', error);
        return reject(error);
      }
      resolve(result);
    });

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// GET /api/messages/:appointmentId
exports.getChatHistory = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Verify user is either the patient or the doctor of the appointment
    const isPatient = appointment.patientId.toString() === userId.toString();
    
    let isDoctor = false;
    const doctorProfile = await Doctor.findOne({ userId });
    if (doctorProfile && appointment.doctorId.toString() === doctorProfile._id.toString()) {
      isDoctor = true;
    }

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Access denied: You are not a participant in this consultation.' });
    }

    const messages = await Message.find({ appointmentId })
      .sort({ timestamp: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({ message: 'Error retrieving chat history.' });
  }
};

// POST /api/messages/upload
// Body: appointmentId, type
// File: media
exports.uploadMediaMessage = async (req, res) => {
  try {
    const { appointmentId, type } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file was uploaded.' });
    }

    if (!appointmentId || !type) {
      return res.status(400).json({ message: 'Appointment ID and message type are required.' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (new Date() >= appointment.chatEnabledUntil) {
      return res.status(403).json({ message: 'Consultation Period Expired.' });
    }

    // Direct buffer upload to Cloudinary (no local disk writes)
    const result = await uploadFromBuffer(req.file.buffer, req.file.originalname);

    res.status(200).json({
      message: 'File uploaded successfully to Cloudinary.',
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('Error in uploadMediaMessage:', error);
    res.status(500).json({ message: 'Cloudinary upload failed.', error: error.message });
  }
};
