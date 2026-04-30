import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgress extends Document {
  patientId: mongoose.Types.ObjectId;
  exerciseId?: mongoose.Types.ObjectId;
  
  // Time period
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
  
  // Performance metrics
  totalSessions: number;
  totalDuration: number; // in seconds
  totalReps: number;
  
  // Scores and quality
  averageScore: number;
  maxScore: number;
  minScore: number;
  scoreImprovement: number; // compared to previous period
  
  // Exercise-specific progress
  exerciseProgress: Array<{
    exerciseId: mongoose.Types.ObjectId;
    exerciseName: string;
    sessionsCompleted: number;
    averageScore: number;
    totalReps: number;
    improvement: number;
  }>;
  
  // Form analysis
  formAnalysis: {
    commonErrors: Array<{
      error: string;
      frequency: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    improvements: Array<{
      area: string;
      improvement: number;
      description: string;
    }>;
  };
  
  // Goals and achievements
  goals: {
    targetSessions: number;
    targetScore: number;
    targetReps: number;
    sessionsAchieved: boolean;
    scoreAchieved: boolean;
    repsAchieved: boolean;
  };
  
  // Streak information
  currentStreak: number;
  longestStreak: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseProgressSchema = new Schema({
  exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  exerciseName: { type: String, required: true },
  sessionsCompleted: { type: Number, default: 0, min: 0 },
  averageScore: { type: Number, min: 0, max: 100 },
  totalReps: { type: Number, default: 0, min: 0 },
  improvement: { type: Number, default: 0 }
}, { _id: false });

const FormErrorSchema = new Schema({
  error: { type: String, required: true },
  frequency: { type: Number, required: true, min: 0 },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true }
}, { _id: false });

const FormImprovementSchema = new Schema({
  area: { type: String, required: true },
  improvement: { type: Number, required: true },
  description: { type: String, required: true }
}, { _id: false });

const GoalsSchema = new Schema({
  targetSessions: { type: Number, min: 0 },
  targetScore: { type: Number, min: 0, max: 100 },
  targetReps: { type: Number, min: 0 },
  sessionsAchieved: { type: Boolean, default: false },
  scoreAchieved: { type: Boolean, default: false },
  repsAchieved: { type: Boolean, default: false }
}, { _id: false });

const ProgressSchema = new Schema<IProgress>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    exerciseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Exercise' 
    },
    
    // Time period
    period: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'], 
      required: true 
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    
    // Performance metrics
    totalSessions: { type: Number, default: 0, min: 0 },
    totalDuration: { type: Number, default: 0, min: 0 },
    totalReps: { type: Number, default: 0, min: 0 },
    
    // Scores and quality
    averageScore: { type: Number, min: 0, max: 100 },
    maxScore: { type: Number, min: 0, max: 100 },
    minScore: { type: Number, min: 0, max: 100 },
    scoreImprovement: { type: Number, default: 0 },
    
    // Exercise-specific progress
    exerciseProgress: [ExerciseProgressSchema],
    
    // Form analysis
    formAnalysis: {
      commonErrors: [FormErrorSchema],
      improvements: [FormImprovementSchema]
    },
    
    // Goals and achievements
    goals: GoalsSchema,
    
    // Streak information
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

// Indexes for better performance
ProgressSchema.index({ patientId: 1, period: 1, periodStart: -1 });
ProgressSchema.index({ patientId: 1, periodEnd: -1 });
ProgressSchema.index({ exerciseId: 1, period: 1 });
ProgressSchema.index({ periodStart: 1, periodEnd: 1 });

// Compound indexes for common queries
ProgressSchema.index({ patientId: 1, period: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

const Progress: Model<IProgress> = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;
