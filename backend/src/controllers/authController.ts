import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const signToken = (id: string, role: 'patient' | 'doctor') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'change_me', { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, specialization, licenseNumber } = req.body as {
      name: string;
      email: string;
      password: string;
      role: 'patient' | 'doctor';
      specialization?: string;
      licenseNumber?: string;
    };

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, specialization, licenseNumber });

    const token = signToken(user.id, user.role);
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signToken(user.id, user.role);
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  // Stateless JWT logout handled client-side. Endpoint for symmetry.
  return res.json({ success: true, message: 'Logged out' });
};


