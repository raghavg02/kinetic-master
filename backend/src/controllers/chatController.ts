import { Request, Response } from 'express';
import Message from '../models/Message';
import PatientDoctor from '../models/PatientDoctor';

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { relationshipId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Validate relationship access
    const relation = await PatientDoctor.findById(relationshipId).select(
      'patientId doctorId status'
    );
    if (!relation || relation.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Relationship not found' });
    }

    const isMember =
      relation.patientId?.toString() === userId ||
      relation.doctorId?.toString() === userId;
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Load messages
    const messages = await Message.find({ relationshipId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('senderId', 'name')
      .lean();

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        hasMore: messages.length === Number(limit)
      }
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { relationshipId } = req.params;
    const { messageIds } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid message IDs' });
    }

    // Validate relationship access
    const relation = await PatientDoctor.findById(relationshipId).select(
      'patientId doctorId status'
    );
    if (!relation || relation.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Relationship not found' });
    }

    const isMember =
      relation.patientId?.toString() === userId ||
      relation.doctorId?.toString() === userId;
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update messages as read
    const result = await Message.updateMany(
      { 
        _id: { $in: messageIds },
        recipientId: userId,
        isRead: false
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
