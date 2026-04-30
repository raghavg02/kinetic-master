import express from 'express';
import {
  getActivityFeed,
  getRecentActivity,
  getActivityStats,
  markActivitiesAsRead,
  archiveActivities,
  getActivityById
} from '../controllers/activityController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get activity feed
router.get('/', getActivityFeed);

// Get recent activity for dashboard
router.get('/recent', getRecentActivity);

// Get activity statistics
router.get('/stats', getActivityStats);

// Mark activities as read
router.put('/mark-read', markActivitiesAsRead);

// Archive activities
router.put('/archive', archiveActivities);

// Get specific activity
router.get('/:activityId', getActivityById);

export default router;
