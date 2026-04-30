import { Router } from 'express';
import { 
  startSession, 
  endSession, 
  getSessionHistory, 
  getSession,
  uploadSessionVideo,
  analyzeFrame,
  getDoctorPracticeSessions
} from '../controllers/sessionController';
import { authMiddleware } from '../middleware/auth';

import { upload } from '../middleware/upload';

const router = Router();

// All session routes require authentication
router.use(authMiddleware);

router.post('/start', startSession);
router.post('/:sessionId/end', endSession);
router.get('/history', getSessionHistory);
router.get('/practice/history', getDoctorPracticeSessions);
router.get('/:sessionId', getSession);
router.post('/:sessionId/video', upload.single('video'), uploadSessionVideo);
router.post('/:sessionId/analyze-pose', analyzeFrame);

export default router;
