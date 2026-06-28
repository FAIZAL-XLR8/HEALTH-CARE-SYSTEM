const express = require('express');
const multer = require('multer');
const router = express.Router();

const labController = require('../controllers/labController');
const doctorController = require('../controllers/doctorController');
const appointmentController = require('../controllers/appointmentController');
const aiController = require('../controllers/aiController');
const chatbotController = require('../controllers/chatbotController');
const prescriptionController = require('../controllers/prescriptionController');
const { registerSSEClient } = require('../services/scraperService');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const apiRateLimiter = require('../middleware/rateLimiter');

const fileAnalyzeLimiter = apiRateLimiter({
  windowSeconds: 10,
  keyPrefix: 'rateLimit:fileAnalyze',
  message: 'Analysis rate limit exceeded. Please wait 10 seconds.'
});

const chatbotLimiter = apiRateLimiter({
  windowSeconds: 10,
  keyPrefix: 'rateLimit:chatbot',
  message: 'Chatbot rate limit exceeded. Please wait 10 seconds.'
});
const videoController = require('../controllers/videoController');

// Multer memory-storage configuration to handle medical report uploads safely
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB file sizes
});

// ==========================================
// 🧪 Diagnostic Lab Routes
// ==========================================
router.get('/labs/search-test', labController.searchTest);
router.get('/labs/compare', labController.compareLabs);
router.get('/labs/live-updates', registerSSEClient); // SSE persistent stream channel

// ==========================================
// 🩺 Doctor Routes
// ==========================================
router.get('/doctors/search', doctorController.searchDoctors);
router.get('/doctors/compare', doctorController.compareDoctors);

// ==========================================
// 📅 Appointment Booking & Telemedicine Routes
// ==========================================
const paymentController = require('../controllers/paymentController');
const messageController = require('../controllers/messageController');

router.post('/appointments', protect, appointmentController.createAppointment);
router.get('/appointments/slots/:doctorId', appointmentController.getAvailableSlots);
router.post('/appointments/reserve', protect, appointmentController.reserveSlot);
router.get('/appointments/patient/dashboard', protect, appointmentController.getPatientDashboard);
router.get('/appointments/doctor/dashboard', protect, appointmentController.getDoctorDashboard);
router.get('/appointments/patient/:patientId', protect, appointmentController.getPatientAppointments);

// ==========================================
// 💳 Payment Gateways (Razorpay)
// ==========================================
router.post('/payments/create-checkout-session', protect, paymentController.createCheckoutSession);
router.post('/payments/verify-checkout-session', protect, paymentController.verifyCheckoutSession);


// ==========================================
// 💬 Telehealth Consultation Chat & Messaging
// ==========================================
router.get('/messages/:appointmentId', protect, messageController.getChatHistory);
router.post('/messages/upload', protect, upload.single('media'), messageController.uploadMediaMessage);
router.delete('/messages/:messageId', protect, messageController.deleteMessage);
router.get('/videos/signature/:appointmentId', protect, videoController.generateUploadSignature);
router.post('/videos/metadata', protect, videoController.saveVideoMetadata);
router.delete('/videos/:appointmentId', protect, videoController.deleteVideo);

// ==========================================
// 🤖 AI Multimodal, Wizard & Chatbot Routes
// ==========================================
router.post('/reports/analyze', protect, fileAnalyzeLimiter, upload.single('report'), aiController.analyzeReport);
router.post('/prescriptions/analyze', protect, fileAnalyzeLimiter, upload.single('prescription'), prescriptionController.analyzePrescription);
router.post('/ai/chatbot', chatbotLimiter, chatbotController.handleChatbotMessage);
router.post('/ai/chat-triage', chatbotLimiter, aiController.chatTriage);

// ==========================================
// 👑 Admin Review Panel Routes
// ==========================================
router.get('/admin/doctors', protect, isAdmin, adminController.getPendingDoctors);
router.post('/admin/doctors/:doctorId/approve', protect, isAdmin, adminController.approveDoctor);
router.post('/admin/doctors/:doctorId/reject', protect, isAdmin, adminController.rejectDoctor);
router.post('/admin/doctors/:doctorId/suspend', protect, isAdmin, adminController.suspendDoctor);
router.get('/admin/suspend-form/:doctorId', adminController.getSuspendForm);

module.exports = router;

