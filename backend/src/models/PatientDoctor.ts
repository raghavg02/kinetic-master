import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPatientDoctor extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  
  // Relationship status
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  startedAt: Date;
  endedAt?: Date;
  
  // Assignment details
  assignedBy: mongoose.Types.ObjectId; // Admin or doctor who assigned
  assignmentReason?: string;
  
  // Patient-specific settings
  patientSettings: {
    exercisePlan?: mongoose.Types.ObjectId;
    goalReps?: number;
    goalSessions?: number;
    weeklyTarget?: number;
    difficultyPreference?: 'beginner' | 'intermediate' | 'advanced';
    restrictions?: string[];
    notes?: string;
  };
  
  // Doctor monitoring preferences
  doctorSettings: {
    notificationsEnabled: boolean;
    weeklyReports: boolean;
    progressAlerts: boolean;
    formFeedback: boolean;
    customSchedule?: {
      checkInFrequency: 'daily' | 'weekly' | 'monthly';
      lastCheckIn?: Date;
      nextCheckIn?: Date;
    };
  };
  
  // Communication
  lastInteraction?: Date;
  totalSessions?: number;
  averageScore?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const PatientDoctorSchema = new Schema<IPatientDoctor>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    doctorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    
    // Relationship status
    status: { 
      type: String, 
      enum: ['pending', 'active', 'suspended', 'terminated'], 
      default: 'pending' 
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    
    // Assignment details
    assignedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    assignmentReason: { type: String },
    
    // Patient-specific settings
    patientSettings: {
      exercisePlan: { type: Schema.Types.ObjectId, ref: 'ExercisePlan' },
      goalReps: { type: Number, min: 1 },
      goalSessions: { type: Number, min: 1 },
      weeklyTarget: { type: Number, min: 1 },
      difficultyPreference: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'] 
      },
      restrictions: [{ type: String }],
      notes: { type: String }
    },
    
    // Doctor monitoring preferences
    doctorSettings: {
      notificationsEnabled: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      progressAlerts: { type: Boolean, default: true },
      formFeedback: { type: Boolean, default: true },
      customSchedule: {
        checkInFrequency: { 
          type: String, 
          enum: ['daily', 'weekly', 'monthly'], 
          default: 'weekly' 
        },
        lastCheckIn: { type: Date },
        nextCheckIn: { type: Date }
      }
    },
    
    // Communication
    lastInteraction: { type: Date },
    totalSessions: { type: Number, default: 0 },
    averageScore: { type: Number, min: 0, max: 100 }
  },
  { timestamps: true }
);

// Indexes for better performance
PatientDoctorSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });
PatientDoctorSchema.index({ patientId: 1, status: 1 });
PatientDoctorSchema.index({ doctorId: 1, status: 1 });
PatientDoctorSchema.index({ status: 1 });
PatientDoctorSchema.index({ assignedBy: 1 });
PatientDoctorSchema.index({ lastInteraction: -1 });

// Compound indexes for common queries
PatientDoctorSchema.index({ doctorId: 1, status: 1, lastInteraction: -1 });
PatientDoctorSchema.index({ patientId: 1, status: 1, createdAt: -1 });

const PatientDoctor: Model<IPatientDoctor> = mongoose.models.PatientDoctor || mongoose.model<IPatientDoctor>('PatientDoctor', PatientDoctorSchema);

export default PatientDoctor;
