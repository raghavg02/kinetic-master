import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import PatientDoctor from '../models/PatientDoctor';
import User from '../models/User';
import SessionService from '../services/sessionService';
import NotificationService from '../services/notificationService';
import WebSocketService from '../services/websocketService';

export const getPatients = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    const patientRelations = await PatientDoctor.find({
      doctorId: doctorId,
      status: 'active'
    })
    .populate('patientId', 'name email role avatar createdAt')
    .sort({ lastInteraction: -1 });

    
    
    const patients = patientRelations.map(relation => {
      if (!relation.patientId) {
        
        return null;
      }
      return {
        relationshipId: (relation as any)._id.toString(),
        id: (relation.patientId as any)._id.toString(),
        name: (relation.patientId as any).name,
        email: (relation.patientId as any).email,
        role: (relation.patientId as any).role,
        avatar: (relation.patientId as any).avatar,
        createdAt: (relation.patientId as any).createdAt ? (relation.patientId as any).createdAt.toISOString() : new Date().toISOString(),
        lastInteraction: relation.lastInteraction?.toISOString(),
        totalSessions: relation.totalSessions || 0,
        averageScore: relation.averageScore || 0,
        status: relation.status
      };
    }).filter(Boolean);
    
    const response: ApiResponse<typeof patients> = {
      success: true,
      data: patients,
      message: 'Patients retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch patients'
    };
    res.status(500).json(response);
  }
};

export const assignPatient = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId, assignmentReason } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    if (!patientId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient ID is required'
      };
      return res.status(400).json(response);
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found'
      };
      return res.status(404).json(response);
    }

    // Check if relationship already exists
    const existingRelation = await PatientDoctor.findOne({
      patientId: patientId,
      doctorId: doctorId
    });

    if (existingRelation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient is already assigned to this doctor'
      };
      return res.status(400).json(response);
    }

    // Create new relationship
    const newRelation = new PatientDoctor({
      patientId: patientId,
      doctorId: doctorId,
      assignedBy: doctorId,
      assignmentReason: assignmentReason,
      status: 'active'
    });

    await newRelation.save();

    // Send notification to patient
    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: 'info',
      title: 'Assigned to Doctor',
      message: 'You have been assigned to a doctor for personalized exercise guidance.',
      data: {
        priority: 'medium',
        category: 'assignment'
      }
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Patient assigned successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to assign patient'
    };
    res.status(500).json(response);
  }
};

export const requestDoctorConnection = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).user?.id;
    const { doctorId, requestReason } = req.body;
    
    if (!patientId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Doctor ID is required'
      };
      return res.status(400).json(response);
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Doctor not found'
      };
      return res.status(404).json(response);
    }

    // Block only if already active or pending with the SAME doctor
    const existingRelation = await PatientDoctor.findOne({
      patientId: patientId,
      doctorId: doctorId,
      status: { $in: ['active', 'pending'] }
    });

    if (existingRelation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Connection request already exists or you are already connected'
      };
      return res.status(400).json(response);
    }

    // If patient has a pending request with a DIFFERENT doctor, cancel it automatically
    await PatientDoctor.updateMany(
      { patientId: patientId, status: 'pending', doctorId: { $ne: doctorId } },
      { $set: { status: 'terminated', endedAt: new Date() } }
    );

    // Create or revive relationship with pending status (handles unique index)
    const newRelation = await PatientDoctor.findOneAndUpdate(
      { patientId: patientId, doctorId: doctorId },
      {
        $set: {
          assignedBy: patientId,
          assignmentReason: requestReason || 'Patient requested connection',
          status: 'pending',
          startedAt: new Date(),
          endedAt: undefined
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Send notification to doctor
    await NotificationService.createNotification({
      recipientId: doctorId,
      senderId: patientId,
      type: 'info',
      title: 'New Connection Request',
      message: `A patient has requested to connect with you for exercise guidance.`,
      data: {
        priority: 'medium',
        category: 'connection_request'
      }
    });

    // Send real-time notification via WebSocket
    await WebSocketService.sendNotification(doctorId, {
      type: 'connection_request',
      title: 'New Connection Request',
      message: `A patient has requested to connect with you for exercise guidance.`,
      data: {
        patientId: patientId,
        relationshipId: (newRelation as any)._id.toString(),
        priority: 'medium',
        category: 'connection_request'
      },
      timestamp: new Date().getTime()
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Connection request sent successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to send connection request'
    };
    res.status(500).json(response);
  }
};

export const cancelConnectionRequest = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).user?.id;

    if (!patientId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    const relation = await PatientDoctor.findOne({
      patientId,
      status: 'pending'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'No pending request found'
      };
      return res.status(404).json(response);
    }

    await relation.deleteOne();

    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Connection request cancelled'
    };
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to cancel request'
    };
    res.status(500).json(response);
  }
};

export const updateConnectionStatus = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    const { status } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    if (!['pending', 'active', 'suspended', 'terminated'].includes(status)) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Invalid status'
      };
      return res.status(400).json(response);
    }

    // Find the relationship
    const relation = await PatientDoctor.findOne({
      patientId: patientId,
      doctorId: doctorId
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Connection not found'
      };
      return res.status(404).json(response);
    }

    // Update status
    relation.status = status;
    if (status === 'active') {
      relation.startedAt = new Date();
    }
    await relation.save();

    // Create activity log for the connection
    if (status === 'active') {
      try {
        const { default: Activity } = await import('../models/Activity');
        const doctor = await User.findById(doctorId);
        const patient = await User.findById(patientId);
        
        await Activity.create({
          userId: patientId,
          relatedUserId: doctorId,
          type: 'connection_approved',
          title: 'Doctor Connection Approved',
          description: `${doctor?.name || 'Doctor'} has approved the connection request from ${patient?.name || 'Patient'}.`,
          metadata: { doctorId, patientId },
          visibility: 'public'
        });
      } catch (err) {
        
      }
    }

    // Send notification to patient
    const notificationMessage = status === 'active' 
      ? 'Your connection request has been approved! You can now communicate with your doctor.'
      : status === 'suspended'
      ? 'Your connection has been suspended. Please contact your doctor for more information.'
      : 'Your connection has been terminated.';

    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: 'info',
      title: `Connection ${status === 'active' ? 'Approved' : status === 'suspended' ? 'Suspended' : 'Terminated'}`,
      message: notificationMessage,
      data: {
        priority: 'high',
        category: 'connection_update'
      }
    });

    // Send real-time notification via WebSocket
    await WebSocketService.sendNotification(patientId, {
      type: 'connection_update',
      title: `Connection ${status === 'active' ? 'Approved' : status === 'suspended' ? 'Suspended' : 'Terminated'}`,
      message: notificationMessage,
      data: {
        doctorId: doctorId,
        relationshipId: (relation as any)._id.toString(),
        status: status,
        priority: 'high',
        category: 'connection_update'
      },
      timestamp: new Date().getTime()
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: `Connection ${status} successfully`
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to update connection status'
    };
    res.status(500).json(response);
  }
};

export const getPatientProgress = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Verify doctor-patient relationship
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    const sessions = await SessionService.getDoctorPatientSessions(doctorId, {
      patientId: patientId,
      limit: 50
    });
    
    const response: ApiResponse<typeof sessions> = {
      success: true,
      data: sessions,
      message: 'Patient progress retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch patient progress'
    };
    res.status(500).json(response);
  }
};

export const sendRecommendation = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    const { message, type = 'recommendation' } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    if (!message) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Message is required'
      };
      return res.status(400).json(response);
    }

    // Verify doctor-patient relationship
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    // Send notification to patient
    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: type,
      title: 'Doctor Recommendation',
      message: message,
      data: {
        priority: 'high',
        category: 'recommendation',
        metadata: { doctorId, timestamp: new Date().toISOString() }
      }
    });

    // Update last interaction
    relation.lastInteraction = new Date();
    await relation.save();
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Recommendation sent successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to send recommendation'
    };
    res.status(500).json(response);
  }
};

export const updatePatientSettings = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    const { patientSettings, doctorSettings } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Verify doctor-patient relationship
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    // Update settings
    if (patientSettings) {
      relation.patientSettings = { ...relation.patientSettings, ...patientSettings };
    }
    
    if (doctorSettings) {
      relation.doctorSettings = { ...relation.doctorSettings, ...doctorSettings };
    }

    await relation.save();
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Patient settings updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to update patient settings'
    };
    res.status(500).json(response);
  }
};

export const getPatientDetails = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Get patient relationship with details
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    })
    .populate('patientId', 'name email role avatar createdAt');

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    const patientDetails = {
      id: relation.patientId._id.toString(),
      name: (relation.patientId as any).name,
      email: (relation.patientId as any).email,
      role: (relation.patientId as any).role,
      avatar: (relation.patientId as any).avatar,
      createdAt: (relation.patientId as any).createdAt.toISOString(),
      lastInteraction: relation.lastInteraction?.toISOString(),
      totalSessions: relation.totalSessions || 0,
      averageScore: relation.averageScore || 0,
      status: relation.status,
      patientSettings: relation.patientSettings,
      doctorSettings: relation.doctorSettings,
      assignmentReason: relation.assignmentReason,
      startedAt: relation.startedAt.toISOString()
    };
    
    const response: ApiResponse<typeof patientDetails> = {
      success: true,
      data: patientDetails,
      message: 'Patient details retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch patient details'
    };
    res.status(500).json(response);
  }
};

export const removePatient = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Find and update relationship
    const relation = await PatientDoctor.findOneAndUpdate(
      {
        doctorId: doctorId,
        patientId: patientId,
        status: 'active'
      },
      {
        status: 'terminated',
        endedAt: new Date()
      },
      { new: true }
    );

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    // Send notification to patient
    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: 'info',
      title: 'Doctor Assignment Ended',
      message: 'Your assignment with your doctor has been terminated.',
      data: {
        priority: 'medium',
        category: 'assignment'
      }
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Patient removed successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to remove patient'
    };
    res.status(500).json(response);
  }
};

// Enhanced endpoints for the new functionality
export const getDoctors = async (req: Request, res: Response) => {
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

    // Get all registered doctors (no isActive field in schema)
    const doctors = await User.find({ 
      role: 'doctor'
    }).select('name email role avatar specialization licenseNumber isOnline lastSeen');

    // Convert _id to id for frontend compatibility
    const doctorsWithId = doctors.map(doctor => ({
      id: (doctor as any)._id.toString(),
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      avatar: doctor.avatar,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      isOnline: (doctor as any).isOnline,
      lastSeen: (doctor as any).lastSeen
    }));

    const response: ApiResponse<typeof doctorsWithId> = {
      success: true,
      data: doctorsWithId,
      message: 'Doctors retrieved successfully'
    };
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch doctors'
    };
    res.status(500).json(response);
  }
};

export const getAllPatientProgress = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Get all patients assigned to this doctor with their progress
    const relationships = await PatientDoctor.find({ 
      doctorId: doctorId,
      status: 'active'
    }).populate('patientId', 'name email');

    const progressData = relationships.map(rel => ({
      id: (rel as any)._id.toString(),
      patientId: (rel.patientId as any)._id.toString(),
      patientName: (rel.patientId as any).name,
      totalSessions: rel.totalSessions || 0,
      averageScore: rel.averageScore || 0,
      lastSessionDate: rel.lastInteraction?.toISOString() || new Date().toISOString(),
      improvementRate: Math.random() * 20 + 5, // Mock data - would be calculated from actual progress
      currentStreak: Math.floor(Math.random() * 10) + 1, // Mock data
      weeklyGoal: rel.patientSettings?.weeklyTarget || 5,
      weeklyProgress: Math.floor(Math.random() * 7) // Mock data
    }));
    
    const response: ApiResponse<typeof progressData> = {
      success: true,
      data: progressData,
      message: 'Patient progress retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch patient progress'
    };
    res.status(500).json(response);
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
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

    // Get all suggestions for this user (as doctor or patient)
    const user = await User.findById(userId);
    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Mock suggestions data - in real implementation, this would come from a suggestions collection
    const suggestions = [
      {
        id: '1',
        doctorId: 'doctor1',
        doctorName: 'Dr. Smith',
        patientId: 'patient1',
        patientName: 'John Doe',
        suggestion: 'Try to maintain better posture during squats. Keep your chest up and back straight.',
        type: 'form',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        doctorId: 'doctor1',
        doctorName: 'Dr. Smith',
        patientId: 'patient1',
        patientName: 'John Doe',
        suggestion: 'Consider increasing your exercise frequency to 4 times per week for better results.',
        type: 'schedule',
        priority: 'medium',
        status: 'read',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    // Filter suggestions based on user role
    const filteredSuggestions = user.role === 'doctor' 
      ? suggestions.filter(s => s.doctorId === userId)
      : suggestions.filter(s => s.patientId === userId);
    
    const response: ApiResponse<typeof filteredSuggestions> = {
      success: true,
      data: filteredSuggestions,
      message: 'Suggestions retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch suggestions'
    };
    res.status(500).json(response);
  }
};

export const createSuggestion = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId, suggestion, type, priority } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    if (!patientId || !suggestion) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient ID and suggestion are required'
      };
      return res.status(400).json(response);
    }

    // Verify doctor-patient relationship
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    // Get doctor and patient names
    const doctor = await User.findById(doctorId);
    const patient = await User.findById(patientId);

    // Create suggestion (in real implementation, this would be saved to a suggestions collection)
    const newSuggestion = {
      id: Date.now().toString(),
      doctorId: doctorId,
      doctorName: doctor?.name || 'Unknown Doctor',
      patientId: patientId,
      patientName: patient?.name || 'Unknown Patient',
      suggestion: suggestion,
      type: type || 'general',
      priority: priority || 'medium',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Send notification to patient
    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: 'info',
      title: 'New Suggestion',
      message: suggestion,
      data: {
        priority: priority || 'medium',
        category: 'suggestion',
        metadata: { suggestionId: newSuggestion.id, type: type || 'general' }
      }
    });

    // Update last interaction
    relation.lastInteraction = new Date();
    await relation.save();
    
    const response: ApiResponse<typeof newSuggestion> = {
      success: true,
      data: newSuggestion,
      message: 'Suggestion created successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to create suggestion'
    };
    res.status(500).json(response);
  }
};

export const getPatientConnectionStatus = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).user?.id;
    
    if (!patientId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Check if patient has an active connection with any doctor
    const relation = await PatientDoctor.findOne({
      patientId: patientId,
      status: { $in: ['active', 'pending'] }
    }).populate('doctorId', 'name email specialization isOnline lastSeen');

    const connectionStatus = {
      isConnected: !!relation,
      doctor: relation ? {
        id: relation.doctorId._id.toString(),
        name: (relation.doctorId as any).name,
        email: (relation.doctorId as any).email,
        specialization: (relation.doctorId as any).specialization,
        isOnline: (relation.doctorId as any).isOnline || false,
        lastSeen: (relation.doctorId as any).lastSeen?.toISOString() || null
      } : null,
      relationshipId: relation ? (relation as any)._id.toString() : null,
      status: relation?.status || null,
      connectionDate: relation?.startedAt?.toISOString() || null
    };
    
    const response: ApiResponse<typeof connectionStatus> = {
      success: true,
      data: connectionStatus,
      message: 'Connection status retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch connection status'
    };
    res.status(500).json(response);
  }
};

export const getOnlineDoctors = async (req: Request, res: Response) => {
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

    // Get all online doctors
    const doctors = await User.find({ 
      role: 'doctor',
      isOnline: true
    }).select('name email specialization licenseNumber isOnline lastSeen');

    // Convert _id to id for frontend compatibility
    const doctorsWithId = doctors.map(doctor => ({
      id: (doctor as any)._id.toString(),
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      isOnline: doctor.isOnline,
      lastSeen: doctor.lastSeen
    }));

    const response: ApiResponse<typeof doctorsWithId> = {
      success: true,
      data: doctorsWithId,
      message: 'Online doctors retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch online doctors'
    };
    res.status(500).json(response);
  }
};

export const getConnectionRequests = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Get all pending connection requests for this doctor
    const requests = await PatientDoctor.find({
      doctorId: doctorId,
      status: 'pending'
    }).populate('patientId', 'name email avatar');

    const connectionRequests = requests.map(request => ({
      id: (request as any)._id.toString(),
      patientId: request.patientId._id.toString(),
      patientName: (request.patientId as any).name,
      patientEmail: (request.patientId as any).email,
      patientAvatar: (request.patientId as any).avatar,
      assignmentReason: request.assignmentReason,
      requestedAt: request.createdAt.toISOString()
    }));
    
    const response: ApiResponse<typeof connectionRequests> = {
      success: true,
      data: connectionRequests,
      message: 'Connection requests retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch connection requests'
    };
    res.status(500).json(response);
  }
};

export const updateUserOnlineStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { isOnline } = req.body;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    await User.findByIdAndUpdate(userId, {
      isOnline: isOnline,
      lastSeen: new Date()
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Online status updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to update online status'
    };
    res.status(500).json(response);
  }
};

export const disconnectFromDoctor = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).user?.id;
    
    if (!patientId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Find and update the active connection
    const relation = await PatientDoctor.findOneAndUpdate(
      {
        patientId: patientId,
        status: { $in: ['active', 'pending'] }
      },
      {
        status: 'terminated',
        endedAt: new Date()
      },
      { new: true }
    ).populate('doctorId', 'name email');

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'No active connection found'
      };
      return res.status(404).json(response);
    }

    // Send notification to doctor
    await NotificationService.createNotification({
      recipientId: relation.doctorId._id.toString(),
      senderId: patientId,
      type: 'info',
      title: 'Patient Disconnected',
      message: `Patient has disconnected from your care.`,
      data: {
        priority: 'medium',
        category: 'connection_update'
      }
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Successfully disconnected from doctor'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to disconnect from doctor'
    };
    res.status(500).json(response);
  }
};