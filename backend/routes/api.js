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

// Multer memory-storage configuration to handle medical report uploads safely
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file sizes
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
// 💳 Payment Gateways (Stripe)
// ==========================================
router.post('/payments/create-checkout-session', protect, paymentController.createCheckoutSession);
router.post('/payments/verify-checkout-session', protect, paymentController.verifyCheckoutSession);
router.get('/payments/simulate-checkout', paymentController.simulateCheckoutPage);
router.post('/payments/onboard-doctor', protect, paymentController.onboardDoctor);
router.get('/payments/onboard-status', protect, paymentController.checkOnboardingStatus);
router.post('/payments/create-platform-subscription', protect, paymentController.createPlatformSubscription);
router.get('/payments/simulate-onboarding', paymentController.simulateOnboardingPage);
router.post('/payments/complete-simulate-onboarding', paymentController.completeSimulateOnboarding);

// ==========================================
// 💬 Telehealth Consultation Chat & Messaging
// ==========================================
router.get('/messages/:appointmentId', protect, messageController.getChatHistory);
router.post('/messages/upload', protect, upload.single('media'), messageController.uploadMediaMessage);

// ==========================================
// 🤖 AI Multimodal, Wizard & Chatbot Routes
// ==========================================
router.post('/reports/analyze', protect, upload.single('report'), aiController.analyzeReport);
router.post('/prescriptions/analyze', protect, upload.single('prescription'), prescriptionController.analyzePrescription);
router.post('/ai/chatbot', chatbotController.handleChatbotMessage);
router.post('/ai/chat-triage', aiController.chatTriage);

// ==========================================
// 👑 Admin Review Panel Routes
// ==========================================
router.get('/admin/doctors', protect, isAdmin, adminController.getPendingDoctors);
router.post('/admin/doctors/:doctorId/approve', protect, isAdmin, adminController.approveDoctor);
router.post('/admin/doctors/:doctorId/reject', protect, isAdmin, adminController.rejectDoctor);
router.post('/admin/doctors/:doctorId/suspend', protect, isAdmin, adminController.suspendDoctor);

module.exports = router;

