import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import DashboardService from '../services/dashboardService';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId || !userRole) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const stats = await DashboardService.getDashboardStats(userId, userRole);
    
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch dashboard stats'
    };
    res.status(500).json(response);
  }
};

export const getProgressData = async (req: Request, res: Response) => {
  try {
    const { exerciseId, days } = req.query;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const progressData = await DashboardService.getProgressData(
      userId, 
      exerciseId as string, 
      parseInt(days as string) || 30
    );
    
    const response: ApiResponse<typeof progressData> = {
      success: true,
      data: progressData,
      message: 'Progress data retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch progress data'
    };
    res.status(500).json(response);
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const activities = await DashboardService.getRecentActivity(
      userId, 
      limit ? parseInt(limit as string) : 10
    );
    
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
