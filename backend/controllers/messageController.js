const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { cloudinary, uploadFromBuffer } = require('../services/cloudinaryService');


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
    
    const isDoctor = appointment.doctorId.toString() === userId.toString();

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
    const result = await uploadFromBuffer(req.file.buffer, req.file.originalname, 'telemedicine_consultations');

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

const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  const publicIdParts = parts.slice(uploadIndex + 2);
  const publicIdWithExt = publicIdParts.join('/');
  const lastDot = publicIdWithExt.lastIndexOf('.');
  if (lastDot === -1) return publicIdWithExt;
  return publicIdWithExt.substring(0, lastDot);
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own messages.' });
    }

    if (message.fileUrl) {
      const publicId = getPublicIdFromUrl(message.fileUrl);
      if (publicId) {
        let resourceType = 'image';
        if (message.messageType === 'video') resourceType = 'video';
        else if (message.messageType === 'pdf') resourceType = 'raw';

        try {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true,
          });
          console.log(`[Cloudinary Delete] Purged file: ${publicId} of type: ${resourceType}`);
        } catch (cloudinaryErr) {
          console.error('Failed to destroy Cloudinary asset:', cloudinaryErr.message);
        }
      }
    }

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ message: 'Message deleted successfully.', messageId });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    res.status(500).json({ message: 'Failed to delete message.' });
  }
};
