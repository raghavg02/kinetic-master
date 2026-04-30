import { Types } from 'mongoose';
import Activity from '../models/Activity';
import PatientDoctor from '../models/PatientDoctor';

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
  session?: {
    id: string;
    score?: number;
    reps?: number;
  };
  exercise?: {
    id: string;
    name: string;
  };
}

export class ActivityService {
  
  // Get activity feed for a user
  static async getActivityFeed(
    userId: string, 
    userRole: 'patient' | 'doctor',
    options: {
      limit?: number;
      offset?: number;
      type?: string;
      visibility?: string;
    } = {}
  ): Promise<ActivityItem[]> {
    const { limit = 20, offset = 0, type, visibility } = options;
    const userObjectId = new Types.ObjectId(userId);

    let query: any = {};

    if (userRole === 'patient') {
      // Patients see their own activities and public activities from their doctor
      const patientDoctorRelations = await PatientDoctor.find({
        patientId: userObjectId,
        status: 'active'
      }).select('doctorId');

      const doctorIds = patientDoctorRelations.map(pd => pd.doctorId);
      
      query = {
        $or: [
          { userId: userObjectId },
          { 
            relatedUserId: { $in: doctorIds },
            visibility: { $in: ['public', 'patient_only'] }
          }
        ]
      };
    } else {
      // Doctors see activities from their patients
      const doctorPatientRelations = await PatientDoctor.find({
        doctorId: userObjectId,
        status: 'active'
      }).select('patientId');

      const patientIds = doctorPatientRelations.map(pd => pd.patientId);
      
      query = {
        $or: [
          { userId: { $in: patientIds } },
          { 
            relatedUserId: userObjectId,
            visibility: { $in: ['public', 'doctor_only'] }
          }
        ]
      };
    }

    if (type) {
      query.type = type;
    }

    if (visibility) {
      query.visibility = visibility;
    }

    const activities = await Activity.find(query)
      .populate('userId', 'name email role')
      .populate('relatedUserId', 'name email role')
      .populate('sessionId', 'averageScore totalReps')
      .populate('exerciseId', 'name')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return activities.map(activity => ({
      id: (activity as any)._id.toString(),
      type: activity.type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
      user: activity.userId ? {
        id: (activity.userId as any)._id.toString(),
        name: (activity.userId as any).name,
        role: (activity.userId as any).role
      } : undefined,
      session: activity.sessionId ? {
        id: (activity.sessionId as any)._id.toString(),
        score: (activity.sessionId as any).averageScore,
        reps: (activity.sessionId as any).totalReps
      } : undefined,
      exercise: activity.exerciseId ? {
        id: (activity.exerciseId as any)._id.toString(),
        name: (activity.exerciseId as any).name
      } : undefined
    }));
  }

  // Get recent activity for dashboard
  static async getRecentActivity(
    userId: string,
    userRole: 'patient' | 'doctor',
    limit: number = 10
  ): Promise<ActivityItem[]> {
    return this.getActivityFeed(userId, userRole, { limit });
  }

  // Create a new activity
  static async createActivity(activityData: {
    userId: string;
    relatedUserId?: string;
    sessionId?: string;
    exerciseId?: string;
    type: string;
    title: string;
    description: string;
    metadata?: any;
    visibility?: string;
    targetRoles?: ('patient' | 'doctor')[];
  }): Promise<ActivityItem> {
    const activity = new Activity({
      userId: new Types.ObjectId(activityData.userId),
      relatedUserId: activityData.relatedUserId ? new Types.ObjectId(activityData.relatedUserId) : undefined,
      sessionId: activityData.sessionId ? new Types.ObjectId(activityData.sessionId) : undefined,
      exerciseId: activityData.exerciseId ? new Types.ObjectId(activityData.exerciseId) : undefined,
      type: activityData.type as any,
      title: activityData.title,
      description: activityData.description,
      metadata: activityData.metadata || {},
      visibility: (activityData.visibility || 'public') as any,
      targetRoles: activityData.targetRoles || []
    });

    await activity.save();
    await activity.populate('userId', 'name email role');
    await activity.populate('sessionId', 'averageScore totalReps');
    await activity.populate('exerciseId', 'name');

    return {
      id: (activity as any)._id.toString(),
      type: activity.type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
      user: activity.userId ? {
        id: (activity.userId as any)._id.toString(),
        name: (activity.userId as any).name,
        role: (activity.userId as any).role
      } : undefined,
      session: activity.sessionId ? {
        id: (activity.sessionId as any)._id.toString(),
        score: (activity.sessionId as any).averageScore,
        reps: (activity.sessionId as any).totalReps
      } : undefined,
      exercise: activity.exerciseId ? {
        id: (activity.exerciseId as any)._id.toString(),
        name: (activity.exerciseId as any).name
      } : undefined
    };
  }

  // Get activity statistics
  static async getActivityStats(
    userId: string,
    userRole: 'patient' | 'doctor',
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    recentTrend: 'up' | 'down' | 'stable';
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    let query: any = {
      createdAt: { $gte: startDate }
    };

    if (userRole === 'patient') {
      query.userId = userObjectId;
    } else {
      // For doctors, get activities from their patients
      const doctorPatientRelations = await PatientDoctor.find({
        doctorId: userObjectId,
        status: 'active'
      }).select('patientId');

      const patientIds = doctorPatientRelations.map(pd => pd.patientId);
      query.userId = { $in: patientIds };
    }

    const [currentPeriodStats, previousPeriodStats] = await Promise.all([
      Activity.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalActivities: { $sum: 1 },
            activitiesByType: { $push: '$type' }
          }
        }
      ]),
      Activity.aggregate([
        { 
          $match: {
            ...query,
            createdAt: { 
              $gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
              $lt: startDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalActivities: { $sum: 1 }
          }
        }
      ])
    ]);

    const currentStats = currentPeriodStats[0] || { totalActivities: 0, activitiesByType: [] };
    const previousStats = previousPeriodStats[0] || { totalActivities: 0 };

    // Count activities by type
    const activitiesByType: Record<string, number> = {};
    currentStats.activitiesByType.forEach((type: string) => {
      activitiesByType[type] = (activitiesByType[type] || 0) + 1;
    });

    // Determine trend
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (currentStats.totalActivities > previousStats.totalActivities) {
      recentTrend = 'up';
    } else if (currentStats.totalActivities < previousStats.totalActivities) {
      recentTrend = 'down';
    }

    return {
      totalActivities: currentStats.totalActivities,
      activitiesByType,
      recentTrend
    };
  }

  // Mark activities as read
  static async markActivitiesAsRead(activityIds: string[], userId: string): Promise<boolean> {
    if (!activityIds.length) return true;

    const objectIds = activityIds
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (objectIds.length === 0) return false;

    const result = await Activity.updateMany(
      {
        _id: { $in: objectIds },
        userId: new Types.ObjectId(userId)
      },
      { isRead: true }
    );

    return result.modifiedCount > 0;
  }

  // Archive activities
  static async archiveActivities(activityIds: string[], userId: string): Promise<boolean> {
    if (!activityIds.length) return true;

    const objectIds = activityIds
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (objectIds.length === 0) return false;

    const result = await Activity.updateMany(
      {
        _id: { $in: objectIds },
        userId: new Types.ObjectId(userId)
      },
      { isArchived: true }
    );

    return result.modifiedCount > 0;
  }

  // Get activity by ID
  static async getActivityById(activityId: string): Promise<ActivityItem | null> {
    if (!Types.ObjectId.isValid(activityId)) {
      return null;
    }

    const activity = await Activity.findById(activityId)
      .populate('userId', 'name email role')
      .populate('relatedUserId', 'name email role')
      .populate('sessionId', 'averageScore totalReps')
      .populate('exerciseId', 'name');

    if (!activity) {
      return null;
    }

    return {
      id: (activity as any)._id.toString(),
      type: activity.type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
      user: activity.userId ? {
        id: (activity.userId as any)._id.toString(),
        name: (activity.userId as any).name,
        role: (activity.userId as any).role
      } : undefined,
      session: activity.sessionId ? {
        id: (activity.sessionId as any)._id.toString(),
        score: (activity.sessionId as any).averageScore,
        reps: (activity.sessionId as any).totalReps
      } : undefined,
      exercise: activity.exerciseId ? {
        id: (activity.exerciseId as any)._id.toString(),
        name: (activity.exerciseId as any).name
      } : undefined
    };
  }

  // Delete activity (admin only)
  static async deleteActivity(activityId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(activityId)) {
      return false;
    }

    const result = await Activity.deleteOne({ _id: activityId });
    return result.deletedCount > 0;
  }
}

export default ActivityService;
