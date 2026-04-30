// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  avatar?: string;
  createdAt: string;
}

// Patient Types
export interface Patient extends User {
  role: 'patient';
  doctorId?: string;
  medicalHistory?: string;
  currentExercises?: Exercise[];
  status?: string;
  averageScore?: number;
  totalSessions?: number;
  lastInteraction?: string;
  relationshipId?: string;
}

// Doctor Types
export interface Doctor extends User {
  role: 'doctor';
  specialization?: string;
  patients?: Patient[];
  licenseNumber?: string;
}

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  category: 'strength' | 'cardio' | 'flexibility' | 'balance';
  equipment?: string[];
  caloriesPerMinute?: number;
  videoUrl?: string;
  imageUrl?: string;
  formGuidance?: {
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
      lastUpdated: string;
      version: string;
    };
  };
}

// Session Types
export interface ExerciseSession {
  id: string;
  patientId: string;
  exerciseId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'paused';
  videoUrl?: string;
  feedback?: SessionFeedback;
}

// Feedback Types
export interface SessionFeedback {
  id: string;
  sessionId: string;
  overallScore: number; // 0-100
  postureErrors: PostureError[];
  repCount: number;
  recommendations: string[];
  timestamp: string;
}

export interface PostureError {
  id: string;
  type: 'posture' | 'form' | 'timing';
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number; // in seconds from session start
  suggestion: string;
}

// Progress Types
export interface ProgressData {
  patientId: string;
  exerciseId: string;
  date: string;
  score: number;
  repCount: number;
  duration: number;
  errors: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Camera/Video Types
export interface CameraSettings {
  width: number;
  height: number;
  frameRate: number;
  facingMode: 'user' | 'environment';
}

// Real-time Feedback Types
export interface RealTimeFeedback {
  isCorrect: boolean;
  message: string;
  primaryCoaching?: string;
  confidence: number;
  timestamp: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'reminder' | 'feedback' | 'system' | 'chat_message' | 'connection_request' | 'connection_update';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  data?: {
    relationshipId?: string;
    senderId?: string;
    senderName?: string;
    priority?: string;
    category?: string;
    actionUrl?: string;
    actionText?: string;
  };
}

// Dashboard Data Types
export interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  totalExercises: number;
  streakDays: number;
  lastSessionDate?: string;
  weeklyProgress?: number;
  improvementRate?: number;
  adherenceRate?: number;
  precisionRate?: number;
  correctionRate?: number;
  growthRate?: number;
  activeSessions?: number;
  activeSessionsList?: Array<{ patientName: string; exerciseName: string; startTime: string }>;
}

export interface ChartData {
  date: string;
  score: number;
  reps: number;
  duration: number;
  errors?: number;
  sessionCount?: number;
}

// Activity Types
export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
  session?: {
    id: string;
    score?: number;
    reps?: number;
  };
  exercise?: {
    id: string;
    name: string;
  };
}
