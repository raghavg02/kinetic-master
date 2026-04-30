import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import NotificationService from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 20, offset = 0, isRead, type, priority } = req.query;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const notifications = await NotificationService.getNotifications(userId, {
      limit: Number(limit),
      offset: Number(offset),
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as string,
      priority: priority as string
    });
    
    const response: ApiResponse<typeof notifications> = {
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch notifications'
    };
    res.status(500).json(response);
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const count = await NotificationService.getUnreadCount(userId);
    
    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count },
      message: 'Unread count retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch unread count'
    };
    res.status(500).json(response);
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notificationId } = req.params;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const success = await NotificationService.markAsRead(notificationId, userId);
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success },
      message: success ? 'Notification marked as read' : 'Failed to mark notification as read'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to mark notification as read'
    };
    res.status(500).json(response);
  }
};

export const markMultipleAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notificationIds } = req.body;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Notification IDs array is required'
      };
      return res.status(400).json(response);
    }
    
    const success = await NotificationService.markMultipleAsRead(notificationIds, userId);
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success },
      message: success ? 'Notifications marked as read' : 'Failed to mark notifications as read'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to mark notifications as read'
    };
    res.status(500).json(response);
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const success = await NotificationService.markAllAsRead(userId);
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success },
      message: success ? 'All notifications marked as read' : 'Failed to mark all notifications as read'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to mark all notifications as read'
    };
    res.status(500).json(response);
  }
};

export const archiveNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notificationId } = req.params;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const success = await NotificationService.archiveNotification(notificationId, userId);
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success },
      message: success ? 'Notification archived' : 'Failed to archive notification'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to archive notification'
    };
    res.status(500).json(response);
  }
};

export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const stats = await NotificationService.getNotificationStats(userId);
    
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      message: 'Notification statistics retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch notification statistics'
    };
    res.status(500).json(response);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notificationId } = req.params;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const success = await NotificationService.deleteNotification(notificationId, userId);
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success },
      message: success ? 'Notification deleted' : 'Failed to delete notification'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to delete notification'
    };
    res.status(500).json(response);
  }
};
