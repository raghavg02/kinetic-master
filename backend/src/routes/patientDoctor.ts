import express from 'express';
import {
  getPatients,
  assignPatient,
  requestDoctorConnection,
  updateConnectionStatus,
  getPatientProgress,
  sendRecommendation,
  updatePatientSettings,
  getPatientDetails,
  removePatient,
  getDoctors,
  getAllPatientProgress,
  getSuggestions,
  createSuggestion,
  getPatientConnectionStatus,
  getOnlineDoctors,
  getConnectionRequests,
  updateUserOnlineStatus,
  disconnectFromDoctor,
  cancelConnectionRequest
} from '../controllers/patientDoctorController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all patients assigned to doctor
router.get('/patients', getPatients);

// Assign patient to doctor
router.post('/assign', assignPatient);

// Patient requests connection to doctor
router.post('/request-connection', requestDoctorConnection);

// Patient cancels pending connection request
router.post('/cancel-connection', cancelConnectionRequest);

// Update connection status (approve/deny/suspend)
router.put('/patients/:patientId/status', updateConnectionStatus);

// Get patient progress
router.get('/patients/:patientId/progress', getPatientProgress);

// Get patient details
router.get('/patients/:patientId', getPatientDetails);

// Send recommendation to patient
router.post('/patients/:patientId/recommendations', sendRecommendation);

// Update patient settings
router.put('/patients/:patientId/settings', updatePatientSettings);

// Remove patient assignment
router.delete('/patients/:patientId', removePatient);

// Enhanced endpoints
router.get('/doctors', getDoctors);
router.get('/online-doctors', getOnlineDoctors);
router.get('/progress', getAllPatientProgress);
router.get('/suggestions', getSuggestions);
router.post('/suggestions', createSuggestion);
router.get('/connection-status', getPatientConnectionStatus);
router.get('/patient/connection-status', getPatientConnectionStatus); // Add new route for patient connection status
router.get('/connection-requests', getConnectionRequests);
router.put('/online-status', updateUserOnlineStatus);
router.post('/disconnect', disconnectFromDoctor);

export default router;
