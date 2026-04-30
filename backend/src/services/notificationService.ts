import { Types } from 'mongoose';
import Notification from '../models/Notification';
import PatientDoctor from '../models/PatientDoctor';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
  session?: {
    id: string;
    score?: number;
  };
  exercise?: {
    id: string;
    name: string;
  };
}

export class NotificationService {
  
  // Get notifications for a user
  static async getNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      isRead?: boolean;
      type?: string;
      priority?: string;
    } = {}
  ): Promise<NotificationItem[]> {
    const { limit = 20, offset = 0, isRead, type, priority } = options;
    const userObjectId = new Types.ObjectId(userId);

    const query: any = {
      recipientId: userObjectId,
      isArchived: false
    };

    if (typeof isRead === 'boolean') {
      query.isRead = isRead;
    }

    if (type) {
      query.type = type;
    }

    if (priority) {
      query['data.priority'] = priority;
    }

    // Filter out expired notifications
    query.$or = [
      { 'data.expiresAt': { $exists: false } },
      { 'data.expiresAt': { $gt: new Date() } }
    ];

    const notifications = await Notification.find(query)
      .populate('senderId', 'name email role')
      .populate('sessionId', 'averageScore')
      .populate('exerciseId', 'name')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return notifications.map(notification => ({
      id: (notification as any)._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
      sender: notification.senderId ? {
        id: notification.senderId._id.toString(),
        name: (notification.senderId as any).name,
        role: (notification.senderId as any).role
      } : undefined,
      session: notification.sessionId ? {
        id: notification.sessionId._id.toString(),
        score: (notification.sessionId as any).averageScore
      } : undefined,
      exercise: notification.exerciseId ? {
        id: notification.exerciseId._id.toString(),
        name: (notification.exerciseId as any).name
      } : undefined
    }));
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);

    return Notification.countDocuments({
      recipientId: userObjectId,
      isRead: false,
      isArchived: false,
      $or: [
        { 'data.expiresAt': { $exists: false } },
        { 'data.expiresAt': { $gt: new Date() } }
      ]
    });
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(notificationId)) {
      return false;
    }

    const result = await Notification.updateOne(
      {
        _id: notificationId,
        recipientId: new Types.ObjectId(userId)
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return result.modifiedCount > 0;
  }

  // Mark multiple notifications as read
  static async markMultipleAsRead(notificationIds: string[], userId: string): Promise<boolean> {
    if (!notificationIds.length) return true;

    const objectIds = notificationIds
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (objectIds.length === 0) return false;

    const result = await Notification.updateMany(
      {
        _id: { $in: objectIds },
        recipientId: new Types.ObjectId(userId)
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return result.modifiedCount > 0;
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);

    const result = await Notification.updateMany(
      {
        recipientId: userObjectId,
        isRead: false,
        isArchived: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return result.modifiedCount > 0;
  }

  // Archive notification
  static async archiveNotification(notificationId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(notificationId)) {
      return false;
    }

    const result = await Notification.updateOne(
      {
        _id: notificationId,
        recipientId: new Types.ObjectId(userId)
      },
      { isArchived: true }
    );

    return result.modifiedCount > 0;
  }

  // Create a new notification
  static async createNotification(notificationData: {
    recipientId: string;
    senderId?: string;
    sessionId?: string;
    exerciseId?: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    deliveryMethod?: ('in_app' | 'email' | 'push')[];
  }): Promise<NotificationItem> {
    const notification = new Notification({
      recipientId: new Types.ObjectId(notificationData.recipientId),
      senderId: notificationData.senderId ? new Types.ObjectId(notificationData.senderId) : undefined,
      sessionId: notificationData.sessionId ? new Types.ObjectId(notificationData.sessionId) : undefined,
      exerciseId: notificationData.exerciseId ? new Types.ObjectId(notificationData.exerciseId) : undefined,
      type: notificationData.type as any,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      deliveryMethod: notificationData.deliveryMethod || ['in_app']
    });

    await notification.save();
    await notification.populate('senderId', 'name email role');
    await notification.populate('sessionId', 'averageScore');
    await notification.populate('exerciseId', 'name');

    return {
      id: (notification as any)._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
      sender: notification.senderId ? {
        id: notification.senderId._id.toString(),
        name: (notification.senderId as any).name,
        role: (notification.senderId as any).role
      } : undefined,
      session: notification.sessionId ? {
        id: notification.sessionId._id.toString(),
        score: (notification.sessionId as any).averageScore
      } : undefined,
      exercise: notification.exerciseId ? {
        id: notification.exerciseId._id.toString(),
        name: (notification.exerciseId as any).name
      } : undefined
    };
  }

  // Create notification for all patients of a doctor
  static async createNotificationForDoctorPatients(
    doctorId: string,
    notificationData: {
      type: string;
      title: string;
      message: string;
      data?: any;
    }
  ): Promise<number> {
    const doctorObjectId = new Types.ObjectId(doctorId);

    // Get all active patients of the doctor
    const patientRelations = await PatientDoctor.find({
      doctorId: doctorObjectId,
      status: 'active'
    }).select('patientId');

    const patientIds = patientRelations.map(pd => pd.patientId);

    if (patientIds.length === 0) {
      return 0;
    }

    // Create notifications for all patients
    const notifications = patientIds.map(patientId => ({
      recipientId: patientId,
      senderId: doctorObjectId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      deliveryMethod: ['in_app']
    }));

    await Notification.insertMany(notifications);
    return notifications.length;
  }

  // Create notification for a specific patient's doctor
  static async createNotificationForPatientDoctor(
    patientId: string,
    notificationData: {
      type: string;
      title: string;
      message: string;
      data?: any;
      sessionId?: string;
      exerciseId?: string;
    }
  ): Promise<NotificationItem | null> {
    const patientObjectId = new Types.ObjectId(patientId);

    // Find the patient's active doctor
    const patientDoctor = await PatientDoctor.findOne({
      patientId: patientObjectId,
      status: 'active'
    }).select('doctorId');

    if (!patientDoctor) {
      return null;
    }

    return this.createNotification({
      recipientId: patientDoctor.doctorId.toString(),
      senderId: patientId,
      sessionId: notificationData.sessionId,
      exerciseId: notificationData.exerciseId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data
    });
  }

  // Send progress alert notification
  static async sendProgressAlert(
    patientId: string,
    sessionId: string,
    score: number,
    previousScore?: number
  ): Promise<void> {
    const message = previousScore 
      ? `Exercise completed! Score: ${score}% (${score > previousScore ? 'improved' : 'decreased'} from ${previousScore}%)`
      : `Exercise completed! Score: ${score}%`;

    await this.createNotificationForPatientDoctor(patientId, {
      type: 'progress_alert',
      title: 'Exercise Progress Update',
      message,
      data: {
        priority: score < 60 ? 'high' : score < 80 ? 'medium' : 'low',
        category: 'progress',
        actionUrl: `/doctor/sessions/${sessionId}`,
        actionText: 'View Session',
        metadata: { score, previousScore }
      },
      sessionId
    });
  }

  // Send form feedback notification
  static async sendFormFeedback(
    patientId: string,
    sessionId: string,
    feedback: string[]
  ): Promise<void> {
    await this.createNotificationForPatientDoctor(patientId, {
      type: 'form_feedback',
      title: 'Form Feedback Available',
      message: `New form feedback: ${feedback[0] || 'Check your form'}`,
      data: {
        priority: 'medium',
        category: 'feedback',
        actionUrl: `/doctor/sessions/${sessionId}`,
        actionText: 'View Feedback',
        metadata: { feedback }
      },
      sessionId
    });
  }

  // Send goal achievement notification
  static async sendGoalAchievement(
    patientId: string,
    goalType: string,
    achievement: string
  ): Promise<void> {
    await this.createNotificationForPatientDoctor(patientId, {
      type: 'achievement',
      title: 'Goal Achieved!',
      message: `Patient achieved ${goalType}: ${achievement}`,
      data: {
        priority: 'medium',
        category: 'achievement',
        metadata: { goalType, achievement }
      }
    });
  }

  // Get notification statistics
  static async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const userObjectId = new Types.ObjectId(userId);

    const [total, unread, byType, byPriority] = await Promise.all([
      Notification.countDocuments({
        recipientId: userObjectId,
        isArchived: false
      }),
      Notification.countDocuments({
        recipientId: userObjectId,
        isRead: false,
        isArchived: false
      }),
      Notification.aggregate([
        {
          $match: {
            recipientId: userObjectId,
            isArchived: false
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      Notification.aggregate([
        {
          $match: {
            recipientId: userObjectId,
            isArchived: false
          }
        },
        {
          $group: {
            _id: '$data.priority',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const typeStats: Record<string, number> = {};
    byType.forEach(item => {
      typeStats[item._id] = item.count;
    });

    const priorityStats: Record<string, number> = {};
    byPriority.forEach(item => {
      priorityStats[item._id || 'medium'] = item.count;
    });

    return {
      total,
      unread,
      byType: typeStats,
      byPriority: priorityStats
    };
  }

  // Delete notification
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(notificationId)) {
      return false;
    }

    const result = await Notification.deleteOne({
      _id: notificationId,
      recipientId: new Types.ObjectId(userId)
    });

    return result.deletedCount > 0;
  }
}

export default NotificationService;
