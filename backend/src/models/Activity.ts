import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  relatedUserId?: mongoose.Types.ObjectId; // For doctor-patient interactions
  sessionId?: mongoose.Types.ObjectId;
  exerciseId?: mongoose.Types.ObjectId;
  
  type: 'exercise_started' | 'exercise_completed' | 'exercise_paused' | 'exercise_cancelled' |
        'session_uploaded' | 'goal_achieved' | 'milestone_reached' | 'doctor_recommendation' |
        'progress_update' | 'form_improvement' | 'streak_achieved' | 'new_exercise_assigned';
  
  title: string;
  description: string;
  
  // Activity-specific data
  metadata: {
    score?: number;
    reps?: number;
    duration?: number;
    streak?: number;
    previousScore?: number;
    improvement?: number;
    milestone?: string;
    recommendation?: string;
    exerciseName?: string;
    [key: string]: any;
  };
  
  // Visibility and targeting
  visibility: 'public' | 'private' | 'doctor_only' | 'patient_only';
  targetRoles: ('patient' | 'doctor')[];
  
  // Status
  isRead: boolean;
  isArchived: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    relatedUserId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    sessionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'ExerciseSession' 
    },
    exerciseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Exercise' 
    },
    
    type: {
      type: String,
      enum: [
        'exercise_started', 'exercise_completed', 'exercise_paused', 'exercise_cancelled',
        'session_uploaded', 'goal_achieved', 'milestone_reached', 'doctor_recommendation',
        'progress_update', 'form_improvement', 'streak_achieved', 'new_exercise_assigned'
      ],
      required: true
    },
    
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    
    // Activity-specific data
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    
    // Visibility and targeting
    visibility: { 
      type: String, 
      enum: ['public', 'private', 'doctor_only', 'patient_only'], 
      default: 'public' 
    },
    targetRoles: [{ 
      type: String, 
      enum: ['patient', 'doctor'] 
    }],
    
    // Status
    isRead: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes for better performance
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ relatedUserId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ visibility: 1, targetRoles: 1 });
ActivitySchema.index({ isRead: 1, isArchived: 1 });
ActivitySchema.index({ sessionId: 1 });
ActivitySchema.index({ exerciseId: 1 });

// Compound indexes for common queries
ActivitySchema.index({ userId: 1, type: 1, createdAt: -1 });
ActivitySchema.index({ relatedUserId: 1, visibility: 1, createdAt: -1 });

const Activity: Model<IActivity> = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
