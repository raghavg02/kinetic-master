import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  description: string;
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in seconds
  targetMuscles: string[];
  imageUrl?: string;
  videoUrl?: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'balance';
  equipment?: string[];
  caloriesPerMinute?: number;
  poseLandmarks: {
    keyPoints: string[];
    angles: Array<{
      name: string;
      points: [string, string, string]; // Three landmark names for angle calculation
      targetRange: [number, number]; // [min, max] degrees
    }>;
    repDetection: {
      trigger: string; // landmark name that triggers rep counting
      direction: 'up' | 'down';
      threshold: number;
    };
  };
  // Enhanced form guidance data
  formGuidance: {
    correctForm: {
      description: string;
      keyPoints: string[];
      commonMistakes: string[];
      tips: string[];
    };
    visualGuide: {
      referenceImage?: string;
      referenceVideo?: string;
      landmarks: Array<{
        name: string;
        position: string;
        importance: 'critical' | 'important' | 'optional';
      }>;
    };
    datasetInfo: {
      source: string;
      sampleCount: number;
      accuracy: number;
      lastUpdated: Date;
      version: string;
    };
  };
  createdBy: mongoose.Types.ObjectId; // doctor who created the exercise
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    instructions: [{ type: String, required: true }],
    difficulty: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'], 
      required: true 
    },
    duration: { type: Number, required: true, min: 30, max: 3600 },
    targetMuscles: [{ type: String, required: true }],
    imageUrl: { type: String },
    videoUrl: { type: String },
    category: { 
      type: String, 
      enum: ['strength', 'cardio', 'flexibility', 'balance'], 
      required: true 
    },
    equipment: [{ type: String }],
    caloriesPerMinute: { type: Number, min: 0 },
    poseLandmarks: {
      keyPoints: [{ type: String }],
      angles: [{
        name: { type: String, required: true },
        points: [{ type: String, required: true }],
        targetRange: [{ type: Number, required: true }]
      }],
      repDetection: {
        trigger: { type: String, required: true },
        direction: { type: String, enum: ['up', 'down'], required: true },
        threshold: { type: Number, required: true }
      }
    },
    formGuidance: {
      correctForm: {
        description: { type: String, required: true },
        keyPoints: [{ type: String, required: true }],
        commonMistakes: [{ type: String, required: true }],
        tips: [{ type: String, required: true }]
      },
      visualGuide: {
        referenceImage: { type: String },
        referenceVideo: { type: String },
        landmarks: [{
          name: { type: String, required: true },
          position: { type: String, required: true },
          importance: { 
            type: String, 
            enum: ['critical', 'important', 'optional'], 
            required: true 
          }
        }]
      },
      datasetInfo: {
        source: { type: String, required: true },
        sampleCount: { type: Number, required: true },
        accuracy: { type: Number, required: true },
        lastUpdated: { type: Date, required: true },
        version: { type: String, required: true }
      }
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes for better performance
ExerciseSchema.index({ name: 'text', description: 'text' });
ExerciseSchema.index({ difficulty: 1, category: 1 });
ExerciseSchema.index({ createdBy: 1 });
ExerciseSchema.index({ isActive: 1 });

const Exercise: Model<IExercise> = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
