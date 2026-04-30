import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPoseFrame {
  timestamp: number;
  landmarks: Array<{
    x: number;
    y: number;
    z?: number;
    visibility?: number;
  }>;
  angles: Record<string, number>;
  repCount?: number;
  isCorrectForm: boolean;
  confidence: number;
}

export interface IExerciseSession extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  scheduledDuration?: number; // in minutes
  
  // Exercise Performance
  totalReps: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  
  // Detailed Tracking
  poseFrames: IPoseFrame[];
  repAnalysis: Array<{
    repNumber: number;
    startTime: number;
    endTime: number;
    score: number;
    feedback: string[];
    angles: Record<string, number>;
  }>;
  
  // Feedback and Analysis
  overallFeedback: string[];
  improvementAreas: string[];
  strengths: string[];
  
  // Media
  videoUrl?: string;
  thumbnailUrl?: string;
  
  // Metadata
  deviceInfo?: {
    platform: string;
    browser?: string;
    cameraResolution?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const PoseFrameSchema = new Schema({
  timestamp: { type: Number, required: true },
  landmarks: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number },
    visibility: { type: Number, min: 0, max: 1 }
  }],
  angles: { type: Map, of: Number },
  repCount: { type: Number, min: 0 },
  isCorrectForm: { type: Boolean, default: false },
  confidence: { type: Number, min: 0, max: 1, default: 0 }
}, { _id: false });

const RepAnalysisSchema = new Schema({
  repNumber: { type: Number, required: true, min: 1 },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  feedback: [{ type: String }],
  angles: { type: Map, of: Number }
}, { _id: false });

const ExerciseSessionSchema = new Schema<IExerciseSession>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    doctorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    exerciseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Exercise', 
      required: true 
    },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number, min: 0 },
    status: { 
      type: String, 
      enum: ['active', 'paused', 'completed', 'cancelled'], 
      default: 'active' 
    },
    scheduledDuration: { type: Number, min: 0 },
    
    // Exercise Performance
    totalReps: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, min: 0, max: 100 },
    maxScore: { type: Number, min: 0, max: 100 },
    minScore: { type: Number, min: 0, max: 100 },
    
    // Detailed Tracking
    poseFrames: [PoseFrameSchema],
    repAnalysis: [RepAnalysisSchema],
    
    // Feedback and Analysis
    overallFeedback: [{ type: String }],
    improvementAreas: [{ type: String }],
    strengths: [{ type: String }],
    
    // Media
    videoUrl: { type: String },
    thumbnailUrl: { type: String },
    
    // Metadata
    deviceInfo: {
      platform: { type: String },
      browser: { type: String },
      cameraResolution: { type: String }
    }
  },
  { timestamps: true }
);

// Indexes for better performance
ExerciseSessionSchema.index({ patientId: 1, createdAt: -1 });
ExerciseSessionSchema.index({ doctorId: 1, createdAt: -1 });
ExerciseSessionSchema.index({ exerciseId: 1 });
ExerciseSessionSchema.index({ status: 1 });
ExerciseSessionSchema.index({ startTime: -1 });

// Virtual for calculating duration if not set
ExerciseSessionSchema.virtual('calculatedDuration').get(function() {
  if (this.duration) return this.duration;
  if (this.endTime && this.startTime) {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  return null;
});

const ExerciseSession: Model<IExerciseSession> = mongoose.models.ExerciseSession || mongoose.model<IExerciseSession>('ExerciseSession', ExerciseSessionSchema);

export default ExerciseSession;
