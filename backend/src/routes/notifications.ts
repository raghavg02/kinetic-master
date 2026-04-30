import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  archiveNotification,
  getNotificationStats,
  deleteNotification
} from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get notifications
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Mark multiple notifications as read
router.put('/mark-read', markMultipleAsRead);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// Archive notification
router.put('/:notificationId/archive', archiveNotification);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;
