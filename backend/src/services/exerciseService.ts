import { Types } from 'mongoose';
import Exercise, { IExercise as IExerciseModel } from '../models/Exercise';
import { Exercise as IExercise } from '../types';
import { HydratedDocument } from 'mongoose';

export class ExerciseService {
  
  // Get all active exercises
  static async getExercises(filters?: {
    difficulty?: string;
    category?: string;
    targetMuscles?: string[];
    search?: string;
  }): Promise<IExercise[]> {
    const query: any = { isActive: true };

    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.targetMuscles && filters.targetMuscles.length > 0) {
      query.targetMuscles = { $in: filters.targetMuscles };
    }

    if (filters?.search) {
      query.$text = { $search: filters.search };
    }

    const exercises = await Exercise.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 }) as HydratedDocument<IExerciseModel>[];

    return exercises.map(exercise => ({
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    }));
  }

  // Get exercise by ID
  static async getExerciseById(exerciseId: string): Promise<IExercise | null> {
    if (!Types.ObjectId.isValid(exerciseId)) {
      return null;
    }

    const exercise = await Exercise.findOne({ 
      _id: exerciseId, 
      isActive: true 
    }).populate('createdBy', 'name email') as HydratedDocument<IExerciseModel> | null;

    if (!exercise) {
      return null;
    }

    return {
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    };
  }

  // Create new exercise (doctor only)
  static async createExercise(exerciseData: Omit<IExercise, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<IExercise> {
    const exercise = new Exercise({
      ...exerciseData,
      createdBy: new Types.ObjectId(createdBy)
    });

    await exercise.save();
    await exercise.populate('createdBy', 'name email');

    return {
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    };
  }

  // Update exercise
  static async updateExercise(exerciseId: string, updateData: Partial<IExercise>, updatedBy: string): Promise<IExercise | null> {
    if (!Types.ObjectId.isValid(exerciseId)) {
      return null;
    }

    const exercise = await Exercise.findOne({ 
      _id: exerciseId, 
      isActive: true 
    });

    if (!exercise) {
      return null;
    }

    // Update fields
    Object.assign(exercise, updateData);
    exercise.updatedAt = new Date();

    await exercise.save();
    await exercise.populate('createdBy', 'name email');

    return {
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    };
  }

  // Get or create default exercise for live sessions
  static async getOrCreateDefaultExercise(userId: string): Promise<IExercise> {
    // First, try to find an existing default exercise
    let exercise = await Exercise.findOne({ 
      name: 'Live Exercise Session',
      createdBy: new Types.ObjectId(userId)
    }) as HydratedDocument<IExerciseModel> | null;

    if (!exercise) {
      // Create a new default exercise
      exercise = new Exercise({
        name: 'Live Exercise Session',
        description: 'Real-time exercise analysis session',
        instructions: [
          'Position yourself in front of the camera',
          'Start the session when ready',
          'Follow the real-time feedback for proper form'
        ],
        difficulty: 'beginner',
        duration: 600, // 10 minutes
        targetMuscles: ['full body'],
        category: 'strength',
        poseLandmarks: {
          keyPoints: ['nose', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
          angles: [
            {
              name: 'elbow_angle',
              points: ['shoulder', 'elbow', 'wrist'],
              targetRange: [90, 180]
            }
          ],
          repDetection: {
            trigger: 'wrist',
            direction: 'up',
            threshold: 0.5
          }
        },
        formGuidance: {
          correctForm: {
            description: 'Maintain proper alignment throughout the movement.',
            keyPoints: [
              'Position yourself in front of the camera',
              'Follow the real-time feedback',
              'Maintain a neutral spine'
            ],
            commonMistakes: [
              'Moving outside the camera frame',
              'Poor lighting conditions',
              'Incomplete range of motion'
            ],
            tips: [
              'Ensure your full body is visible',
              'Perform exercises in a well-lit area',
              'Move at a controlled pace'
            ]
          },
          visualGuide: {
            landmarks: [
              { name: 'Shoulder', position: 'Shoulder joint', importance: 'important' },
              { name: 'Hip', position: 'Hip joint', importance: 'important' },
              { name: 'Knee', position: 'Knee joint', importance: 'important' }
            ]
          },
          datasetInfo: {
            source: 'Kinetic Master Default Guidance',
            sampleCount: 1000,
            accuracy: 90,
            lastUpdated: new Date(),
            version: '1.0.0'
          }
        },
        createdBy: new Types.ObjectId(userId),
        isActive: true
      });

      await exercise.save();
    }

    return {
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    };
  }

  // Delete exercise (soft delete)
  static async deleteExercise(exerciseId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(exerciseId)) {
      return false;
    }

    const result = await Exercise.updateOne(
      { _id: exerciseId },
      { isActive: false, updatedAt: new Date() }
    );

    return result.modifiedCount > 0;
  }

  // Get exercises by difficulty
  static async getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<IExercise[]> {
    const exercises = await Exercise.find({ 
      difficulty, 
      isActive: true 
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 }) as HydratedDocument<IExerciseModel>[];

    return exercises.map(exercise => ({
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    }));
  }

  // Get exercises by category
  static async getExercisesByCategory(category: 'strength' | 'cardio' | 'flexibility' | 'balance'): Promise<IExercise[]> {
    const exercises = await Exercise.find({ 
      category, 
      isActive: true 
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 }) as HydratedDocument<IExerciseModel>[];

    return exercises.map(exercise => ({
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    }));
  }

  // Search exercises
  static async searchExercises(searchTerm: string): Promise<IExercise[]> {
    const exercises = await Exercise.find({
      $text: { $search: searchTerm },
      isActive: true
    })
    .populate('createdBy', 'name email')
    .sort({ score: { $meta: 'textScore' } }) as HydratedDocument<IExerciseModel>[];

    return exercises.map(exercise => ({
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    }));
  }

  // Get exercises created by a specific doctor
  static async getExercisesByDoctor(doctorId: string): Promise<IExercise[]> {
    if (!Types.ObjectId.isValid(doctorId)) {
      return [];
    }

    const exercises = await Exercise.find({ 
      createdBy: new Types.ObjectId(doctorId),
      isActive: true 
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 }) as HydratedDocument<IExerciseModel>[];

    return exercises.map(exercise => ({
      id: (exercise as any)._id.toString(),
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      targetMuscles: exercise.targetMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      category: exercise.category,
      equipment: exercise.equipment,
      caloriesPerMinute: exercise.caloriesPerMinute,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    }));
  }

  // Get exercise statistics
  static async getExerciseStats(exerciseId: string): Promise<{
    totalSessions: number;
    averageScore: number;
    totalReps: number;
    popularity: number;
  } | null> {
    if (!Types.ObjectId.isValid(exerciseId)) {
      return null;
    }

    const ExerciseSession = require('../models/ExerciseSession').default;
    
    const stats = await ExerciseSession.aggregate([
      {
        $match: {
          exerciseId: new Types.ObjectId(exerciseId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          averageScore: { $avg: '$averageScore' },
          totalReps: { $sum: '$totalReps' }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        totalReps: 0,
        popularity: 0
      };
    }

    const stat = stats[0];
    
    // Calculate popularity based on recent usage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSessions = await ExerciseSession.countDocuments({
      exerciseId: new Types.ObjectId(exerciseId),
      status: 'completed',
      startTime: { $gte: thirtyDaysAgo }
    });

    return {
      totalSessions: stat.totalSessions,
      averageScore: Math.round(stat.averageScore || 0),
      totalReps: stat.totalReps,
      popularity: recentSessions
    };
  }
}

export default ExerciseService;
