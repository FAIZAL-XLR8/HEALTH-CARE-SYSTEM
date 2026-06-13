const express = require('express');
const multer = require('multer');
const router = express.Router();

const labController = require('../controllers/labController');
const doctorController = require('../controllers/doctorController');
const appointmentController = require('../controllers/appointmentController');
const aiController = require('../controllers/aiController');
const { registerSSEClient } = require('../services/scraperService');
const { protect } = require('../middleware/authMiddleware');

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
// 📅 Appointment Booking Routes
// ==========================================
router.post('/appointments', protect, appointmentController.createAppointment);
router.get('/appointments/patient/:patientId', protect, appointmentController.getPatientAppointments);

// ==========================================
// 🤖 AI Multimodal & Wizard Routes
// ==========================================
router.post('/reports/analyze', protect, upload.single('report'), aiController.analyzeReport);
router.post('/ai/lifestyle', protect, aiController.getLifestyleRecommendations);

module.exports = router;
