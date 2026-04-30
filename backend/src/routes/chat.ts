import express from 'express';
import { getChatHistory, markMessagesAsRead } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get chat history for a relationship
router.get('/history/:relationshipId', getChatHistory);

// Mark messages as read
router.post('/mark-read/:relationshipId', markMessagesAsRead);

export default router;
