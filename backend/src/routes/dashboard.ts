import { Router } from 'express';
import { getDashboardStats, getProgressData, getRecentActivity } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

router.get('/stats', getDashboardStats);
router.get('/progress', getProgressData);
router.get('/recent-activity', getRecentActivity);

export default router;
