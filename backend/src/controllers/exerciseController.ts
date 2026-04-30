import { Request, Response } from "express";
import { ApiResponse } from "../types";
import { analyzePose } from "../services/mlService";
import ExerciseService from "../services/exerciseService";
import SessionService from "../services/sessionService";
import { ExerciseSeedService } from "../services/exerciseSeedService";

// =======================
// CRUD for Exercises
// =======================
export const getExercises = async (req: Request, res: Response) => {
  try {
    const { difficulty, category, targetMuscles, search } = req.query;
    
    const filters: any = {};
    if (difficulty) filters.difficulty = difficulty;
    if (category) filters.category = category;
    if (targetMuscles) filters.targetMuscles = Array.isArray(targetMuscles) ? targetMuscles : [targetMuscles];
    if (search) filters.search = search as string;
    
    const exercises = await ExerciseService.getExercises(filters);
    
    const response: ApiResponse<typeof exercises> = {
      success: true,
      data: exercises,
      message: "Exercises retrieved successfully",
    };
    res.json(response);
  } catch (error) {
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: "Failed to fetch exercises",
    };
    res.status(500).json(response);
  }
};

export const getExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exercise = await ExerciseService.getExerciseById(id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Exercise not found",
      });
    }

    const response: ApiResponse<typeof exercise> = {
      success: true,
      data: exercise,
      message: "Exercise retrieved successfully",
    };
    res.json(response);
  } catch (error) {
    
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to fetch exercise",
    });
  }
};

export const createExercise = async (req: Request, res: Response) => {
  try {
    const exerciseData = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "User not authenticated",
      });
    }
    
    const newExercise = await ExerciseService.createExercise(exerciseData, userId);

    const response: ApiResponse<typeof newExercise> = {
      success: true,
      data: newExercise,
      message: "Exercise created successfully",
    };
    res.status(201).json(response);
  } catch (error) {
    
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to create exercise",
    });
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "User not authenticated",
      });
    }

    const updatedExercise = await ExerciseService.updateExercise(id, updateData, userId);
    
    if (!updatedExercise) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Exercise not found",
      });
    }

    const response: ApiResponse<typeof updatedExercise> = {
      success: true,
      data: updatedExercise,
      message: "Exercise updated successfully",
    };
    res.json(response);
  } catch (error) {
    
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to update exercise",
    });
  }
};

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = await ExerciseService.deleteExercise(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Exercise not found",
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: "Exercise deleted successfully",
    };
    res.json(response);
  } catch (error) {
    
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to delete exercise",
    });
  }
};

// =======================
// Analyze Exercise (ML + DB)
// =======================
export const analyzeExercise = async (req: Request, res: Response) => {
  try {
    const { sessionId, landmarks, exercise } = req.body;

    if (!sessionId || !landmarks) {
      return res.status(400).json({
        success: false,
        message: "Session ID and landmarks are required"
      });
    }

    // Call Python ML backend
    const result = await analyzePose(landmarks);

    // Add pose frame to session
    const frameData = {
      timestamp: Date.now(),
      landmarks: landmarks,
      angles: result.angles || {},
      isCorrectForm: result.accuracy > 70,
      confidence: result.accuracy / 100
    };

    await SessionService.addPoseFrame(sessionId, frameData);

    const response = {
      success: true,
      data: {
        accuracy: result.accuracy,
        feedback: result.feedback,
        angles: result.angles,
        isCorrectForm: frameData.isCorrectForm,
        confidence: frameData.confidence
      }
    };

    res.json(response);
  } catch (err: any) {
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to analyze exercise",
      error: err.message 
    });
  }
};

// =======================
// Seed Exercises
// =======================
export const seedExercises = async (req: Request, res: Response) => {
  try {
    await ExerciseSeedService.seedExercises();
    
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: "Exercises seeded successfully",
    };
    res.json(response);
  } catch (error) {
    
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to seed exercises",
    });
  }
};
