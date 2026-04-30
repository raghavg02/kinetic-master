import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import SessionService from '../services/sessionService';

export const startSession = async (req: Request, res: Response) => {
  try {
    const { exerciseId, doctorId, scheduledDuration } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    // Handle default exercise case
    let validExerciseId = exerciseId;
    if (exerciseId === 'default') {
      const { ExerciseService } = await import('../services/exerciseService');
      const defaultExercise = await ExerciseService.getOrCreateDefaultExercise(userId);
      validExerciseId = defaultExercise.id;
    }
    
    // Automatically find doctor if not provided
    let actualDoctorId = doctorId;
    if (!actualDoctorId) {
      const PatientDoctor = (await import('../models/PatientDoctor')).default;
      const connection = await PatientDoctor.findOne({ patientId: userId, status: 'active' });
      if (connection) {
        actualDoctorId = connection.doctorId.toString();
      }
    }
    
    const newSession = await SessionService.startSession(
      userId, 
      validExerciseId, 
      actualDoctorId,
      scheduledDuration,
      req.headers['user-agent']
    );
    
    const response: ApiResponse<typeof newSession> = {
      success: true,
      data: newSession,
      message: 'Session started successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to start session'
    };
    res.status(500).json(response);
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const endData = req.body;
    
    const updatedSession = await SessionService.endSession(sessionId, {
      totalReps: endData.totalReps || 0,
      averageScore: endData.averageScore || 0,
      maxScore: endData.maxScore || 0,
      minScore: endData.minScore || 0,
      overallFeedback: endData.overallFeedback || [],
      improvementAreas: endData.improvementAreas || [],
      strengths: endData.strengths || [],
      repAnalysis: endData.repAnalysis || [],
      videoUrl: endData.videoUrl
    });
    
    if (!updatedSession) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof updatedSession> = {
      success: true,
      data: updatedSession,
      message: 'Session ended successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to end session'
    };
    res.status(500).json(response);
  }
};

export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const { limit = 10, offset = 0, exerciseId, status } = req.query;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }
    
    const sessions = await SessionService.getUserSessions(userId, {
      limit: Number(limit),
      offset: Number(offset),
      exerciseId: exerciseId as string,
      status: status as string
    });
    
    const response: ApiResponse<typeof sessions> = {
      success: true,
      data: sessions,
      message: 'Session history retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch session history'
    };
    res.status(500).json(response);
  }
};

export const getDoctorPracticeSessions = async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0, patientId, exerciseId } = req.query;
    const doctorId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!doctorId || userRole !== 'doctor') {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Unauthorized: Doctor role required'
      };
      return res.status(403).json(response);
    }

    const sessions = await SessionService.getDoctorPatientSessions(doctorId, {
      limit: Number(limit),
      offset: Number(offset),
      patientId: patientId as string,
      exerciseId: exerciseId as string
    });

    const response: ApiResponse<typeof sessions> = {
      success: true,
      data: sessions,
      message: 'Practice-wide sessions retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch practice sessions'
    };
    res.status(500).json(response);
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await SessionService.getSessionById(sessionId);
    
    if (!session) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof session> = {
      success: true,
      data: session,
      message: 'Session retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch session'
    };
    res.status(500).json(response);
  }
};

export const uploadSessionVideo = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    
    // If using multer, the file is in req.file
    if (!req.file) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'No video file uploaded'
      };
      return res.status(400).json(response);
    }
    
    const videoUrl = `/uploads/${req.file.filename}`;
    const thumbnailUrl = ''; // Optional thumbnail handling
    
    const uploaded = await SessionService.uploadSessionVideo(sessionId, videoUrl, thumbnailUrl);
    
    if (!uploaded) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }

    // TRIGGER ASYNC ML ANALYSIS
    // We don't await this long-running process in the main request flow
    // but we start it here. In a robust system, this would be a worker task.
    const { processSessionVideo } = await import('../services/mlService');
    const { ExerciseService } = await import('../services/exerciseService');
    
    const session = await SessionService.getSession(sessionId);
    if (!session) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }

    // Get exercise name for ML engine
    const exercise = await ExerciseService.getExerciseById(session.exerciseId);
    const exerciseName = exercise?.name || "squat";
    
    // Start processing in the background (using a self-executing async function)
    (async () => {
      try {
        
        const mlResult = await processSessionVideo(sessionId, videoUrl, exerciseName);
        
        if (mlResult.success && mlResult.results) {
          const { results } = mlResult;
          // Update session with real analysis results
          await SessionService.endSession(sessionId, {
            totalReps: results.totalReps || 0,
            averageScore: results.averageScore || 0,
            maxScore: results.averageScore || 0,
            minScore: results.averageScore || 0,
            overallFeedback: results.feedback || [],
            improvementAreas: [],
            strengths: [],
            repAnalysis: [],
            videoUrl: videoUrl
          });
          
        }
      } catch (err) {
        
      }
    })();
    
    const response: ApiResponse<{ videoUrl: string, processing: boolean }> = {
      success: true,
      data: { videoUrl, processing: true },
      message: 'Video uploaded successfully. Analysis is running in the background.'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to upload video'
    };
    res.status(500).json(response);
  }
};

export const analyzeFrame = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { landmarks } = req.body;
    
    if (!landmarks) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Landmarks are required'
      };
      return res.status(400).json(response);
    }

    // Get session to know which exercise we are doing
    const session = await SessionService.getSession(sessionId);
    if (!session) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Session not found'
      };
      return res.status(404).json(response);
    }

    // Explicitly get exercise name to avoid hydration issues
    const { ExerciseService } = await import('../services/exerciseService');
    const exercise = await ExerciseService.getExerciseById(session.exerciseId);
    const exerciseName = exercise?.name || "squat";

    // Import the ML service function
    const { analyzePose } = await import('../services/mlService');
    
    // Call Python ML backend for pose analysis with exercise name and session context
    const result = await analyzePose(landmarks, exerciseName, sessionId);

    // Add pose frame to session (throttle DB writes - only save every 5th frame)
    // We use a global or session-based counter here. For simplicity, let's use a random sample or a timestamp check.
    const frameData = {
      timestamp: Date.now(),
      landmarks: landmarks,
      angles: result.angles || {},
      isCorrectForm: result.isCorrectForm ?? (result.accuracy > 70),
      confidence: result.confidence ?? (result.accuracy / 100)
    };

    if (Math.random() > 0.8) { // Save approx 20% of analyzed frames to DB to save space/perf
        SessionService.addPoseFrame(sessionId, frameData);
    }
 
    // Update rep count from ML results
    let currentRepCount = session.reps || 0;
    if (result.repCount !== undefined && result.repCount > currentRepCount) {
      currentRepCount = result.repCount;
      SessionService.updateSessionReps(sessionId, currentRepCount);
    }

    const response: ApiResponse<{
      accuracy: number;
      feedback: string[];
      primaryCoaching?: string;
      repCount?: number;
      angles?: any;
      isCorrectForm: boolean;
      confidence: number;
    }> = {
      success: true,
      data: {
        accuracy: result.accuracy,
        feedback: result.feedback || ['Good form!'],
        primaryCoaching: result.primary_coaching,
        repCount: currentRepCount,
        angles: result.angles,
        isCorrectForm: frameData.isCorrectForm,
        confidence: frameData.confidence
      },
      message: 'Pose analyzed successfully'
    };
    
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to analyze frame'
    };
    res.status(500).json(response);
  }
};
