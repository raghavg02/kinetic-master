import { Request, Response } from 'express';
import User from '../models/User';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user?.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const updates = req.body as Partial<{
      name: string;
      avatar: string;
      specialization: string;
      licenseNumber: string;
    }>;

    const user = await User.findByIdAndUpdate((req as any).user?.id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateOnlineStatus = async (req: Request, res: Response) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findByIdAndUpdate(
      (req as any).user?.id, 
      { isOnline, lastSeen: new Date() }, 
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: { isOnline: user.isOnline, lastSeen: user.lastSeen }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
