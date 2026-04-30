import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import ActivityService from '../services/activityService';

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { limit = 20, offset = 0, type, visibility } = req.query;
    
    if (!userId || !userRole) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const activities = await ActivityService.getActivityFeed(userId, userRole, {
      limit: Number(limit),
      offset: Number(offset),
      type: type as string,
      visibility: visibility as string
    });
    
    const response: ApiResponse<typeof activities> = {
      success: true,
      data: activities,
      message: 'Activity feed retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch activity feed'
    };
    res.status(500).json(response);
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { limit = 10 } = req.query;
    
    if (!userId || !userRole) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const activities = await ActivityService.getRecentActivity(userId, userRole, Number(limit));
    
    const response: ApiResponse<typeof activities> = {
      success: true,
      data: activities,
      message: 'Recent activity retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch recent activity'
    };
    res.status(500).json(response);
  }
};

export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { period = 'week' } = req.query;
    
    if (!userId || !userRole) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const stats = await ActivityService.getActivityStats(
      userId, 
      userRole, 
      period as 'day' | 'week' | 'month'
    );
    
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      message: 'Activity statistics retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch activity statistics'
    };
    res.status(500).json(response);
  }
};

export const markActivitiesAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { activityIds } = req.body;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    if (!activityIds || !Array.isArray(activityIds)) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Activity IDs array is required'
      };
      return res.status(400).json(response);
    }
    
    const success = await ActivityService.markActivitiesAsRead(activityIds, userId);
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success },
      message: success ? 'Activities marked as read' : 'Failed to mark activities as read'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to mark activities as read'
    };
    res.status(500).json(response);
  }
};

export const archiveActivities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { activityIds } = req.body;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    if (!activityIds || !Array.isArray(activityIds)) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Activity IDs array is required'
      };
      return res.status(400).json(response);
    }
    
    const success = await ActivityService.archiveActivities(activityIds, userId);
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success },
      message: success ? 'Activities archived' : 'Failed to archive activities'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to archive activities'
    };
    res.status(500).json(response);
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { activityId } = req.params;
    
    const activity = await ActivityService.getActivityById(activityId);
    
    if (!activity) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Activity not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof activity> = {
      success: true,
      data: activity,
      message: 'Activity retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch activity'
    };
    res.status(500).json(response);
  }
};
