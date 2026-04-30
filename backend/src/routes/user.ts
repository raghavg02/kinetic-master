import { Router } from 'express';
import { getProfile, updateProfile, updateOnlineStatus } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/online-status', authMiddleware, updateOnlineStatus);

export default router;
