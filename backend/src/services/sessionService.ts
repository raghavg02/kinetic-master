import { Types } from 'mongoose';
import ExerciseSession, { IPoseFrame, IExerciseSession } from '../models/ExerciseSession';
import { HydratedDocument } from 'mongoose';
import Activity from '../models/Activity';
import Notification from '../models/Notification';
import PatientDoctor from '../models/PatientDoctor';
import { ExerciseSession as IExerciseSessionType } from '../types';

export class SessionService {
  
  // Start a new exercise session
  static async startSession(
    patientId: string, 
    exerciseId: string, 
    doctorId?: string,
    scheduledDuration?: number,
    deviceInfo?: any
  ): Promise<IExerciseSessionType> {
    // Validate ObjectIds
    if (!Types.ObjectId.isValid(patientId)) {
      throw new Error('Invalid patient ID');
    }
    if (!Types.ObjectId.isValid(exerciseId)) {
      throw new Error('Invalid exercise ID');
    }
    if (doctorId && !Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID');
    }

    const session = new ExerciseSession({
      patientId: new Types.ObjectId(patientId),
      doctorId: doctorId ? new Types.ObjectId(doctorId) : undefined,
      exerciseId: new Types.ObjectId(exerciseId),
      startTime: new Date(),
      status: 'active',
      scheduledDuration,
      deviceInfo
    }) as HydratedDocument<IExerciseSession>;

    await session.save();

    // Create activity log
    await SessionService.createActivity({
      userId: patientId,
      relatedUserId: doctorId,
      sessionId: (session._id as Types.ObjectId).toString(),
      exerciseId,
      type: 'exercise_started',
      title: 'Exercise Session Started',
      description: 'Started a new exercise session',
      metadata: { exerciseId },
      visibility: 'public'
    });

    return {
      id: (session._id as Types.ObjectId).toString(),
      exerciseId: exerciseId,
      userId: patientId,
      doctorId,
      startTime: session.startTime.toISOString(),
      endTime: undefined,
      duration: 0,
      status: session.status as any,
      score: null,
      reps: 0,
      feedback: null,
      videoUrl: null
    };
  }

  // End an exercise session
  static async endSession(
    sessionId: string, 
    endData: {
      totalReps: number;
      averageScore: number;
      maxScore: number;
      minScore: number;
      overallFeedback: string[];
      improvementAreas: string[];
      strengths: string[];
      repAnalysis: any[];
      videoUrl?: string;
    }
  ): Promise<IExerciseSessionType | null> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    const session = await ExerciseSession.findById(sessionId) as HydratedDocument<IExerciseSession> | null;
    if (!session || session.status === 'completed') {
      return null;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    // Update session
    Object.assign(session, {
      ...endData,
      endTime,
      duration,
      status: 'completed'
    });

    await session.save();

    // Create activity log
    await this.createActivity({
      userId: session.patientId.toString(),
      relatedUserId: session.doctorId?.toString(),
      sessionId: sessionId,
      exerciseId: session.exerciseId.toString(),
      type: 'exercise_completed',
      title: 'Exercise Session Completed',
      description: `Completed exercise session with ${endData.totalReps} reps and ${endData.averageScore}% average score`,
      metadata: {
        score: endData.averageScore,
        reps: endData.totalReps,
        duration,
        improvement: endData.improvementAreas.length > 0 ? endData.improvementAreas[0] : null
      },
      visibility: 'public'
    });

    // Send notification to doctor if assigned
    if (session.doctorId) {
      await this.createNotification({
        recipientId: session.doctorId.toString(),
        senderId: session.patientId.toString(),
        sessionId: sessionId,
        exerciseId: session.exerciseId.toString(),
        type: 'progress_alert',
        title: 'Patient Completed Exercise',
        message: `Patient completed exercise session with ${endData.averageScore}% score`,
        data: {
          priority: 'medium',
          category: 'progress',
          actionUrl: `/doctor/sessions/${sessionId}`,
          actionText: 'View Session',
          metadata: {
            score: endData.averageScore,
            reps: endData.totalReps,
            duration
          }
        },
        deliveryMethod: ['in_app']
      });
    }

    return {
      id: (session._id as Types.ObjectId).toString(),
      exerciseId: session.exerciseId.toString(),
      userId: session.patientId.toString(),
      doctorId: session.doctorId?.toString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration || 0,
      status: session.status as any,
      score: session.averageScore || 0,
      reps: session.totalReps || 0,
      feedback: session.overallFeedback?.join(', ') || null,
      videoUrl: session.videoUrl || null
    };
  }

  // Add pose frame to session
  static async addPoseFrame(
    sessionId: string, 
    frameData: IPoseFrame
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const session = await ExerciseSession.findById(sessionId);
    if (!session || session.status === 'completed') {
      return false;
    }

    session.poseFrames.push(frameData);
    await session.save();

    return true;
  }

  // Get session by ID
  static async getSession(sessionId: string): Promise<IExerciseSessionType | null> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    const session = await ExerciseSession.findById(sessionId).populate('exerciseId', 'name description') as any;
    if (!session) {
      return null;
    }

    return {
      id: (session._id as Types.ObjectId).toString(),
      exerciseId: session.exerciseId._id.toString(),
      userId: session.patientId.toString(),
      doctorId: session.doctorId?.toString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration || 0,
      status: session.status as any,
      score: session.averageScore || null,
      reps: session.totalReps || 0,
      feedback: session.feedback ? {
        overallScore: session.averageScore || 0,
        strengths: session.strengths || [],
        improvementAreas: session.improvementAreas || [],
        recommendations: session.recommendations || []
      } : null,
      videoUrl: session.videoUrl || null
    };
  }

  // Update session rep count
  static async updateSessionReps(sessionId: string, repCount: number): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const session = await ExerciseSession.findById(sessionId);
    if (!session) {
      return false;
    }

    session.totalReps = repCount;
    await session.save();
    return true;
  }

  // Get session by ID (alias for compatibility)
  static async getSessionById(sessionId: string): Promise<IExerciseSessionType | null> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    const session = await ExerciseSession.findById(sessionId)
      .populate('exerciseId', 'name description')
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email') as any;

    if (!session) {
      return null;
    }

    return {
      id: (session._id as Types.ObjectId).toString(),
      exerciseId: session.exerciseId._id.toString(),
      userId: session.patientId._id.toString(),
      doctorId: session.doctorId?._id.toString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration || 0,
      status: session.status as any,
      score: session.averageScore || 0,
      reps: session.totalReps || 0,
      feedback: session.overallFeedback?.join(', ') || null,
      videoUrl: session.videoUrl || null
    };
  }

  // Get user's session history
  static async getUserSessions(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      exerciseId?: string;
      status?: string;
    } = {}
  ): Promise<IExerciseSessionType[]> {
    const { limit = 10, offset = 0, exerciseId, status } = options;

    const query: any = { patientId: new Types.ObjectId(userId) };
    
    if (exerciseId && Types.ObjectId.isValid(exerciseId)) {
      query.exerciseId = new Types.ObjectId(exerciseId);
    }
    
    if (status) {
      query.status = status;
    }

    const sessions = await ExerciseSession.find(query)
      .populate('exerciseId', 'name description')
      .populate('doctorId', 'name email')
      .sort({ startTime: -1 })
      .skip(offset)
      .limit(limit) as any[];

    return sessions.map(session => ({
      id: (session._id as Types.ObjectId).toString(),
      exerciseId: session.exerciseId ? (session.exerciseId._id || session.exerciseId).toString() : 'deleted_exercise',
      userId: userId,
      doctorId: session.doctorId ? (session.doctorId._id || session.doctorId).toString() : undefined,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration || 0,
      status: session.status as any,
      score: session.averageScore || 0,
      reps: session.totalReps || 0,
      feedback: session.overallFeedback?.join(', ') || null,
      videoUrl: session.videoUrl || null
    }));
  }

  // Get doctor's patient sessions
  static async getDoctorPatientSessions(
    doctorId: string,
    options: {
      limit?: number;
      offset?: number;
      patientId?: string;
      exerciseId?: string;
    } = {}
  ): Promise<IExerciseSessionType[]> {
    const { limit = 10, offset = 0, patientId, exerciseId } = options;

    const patientRelations = await PatientDoctor.find({ doctorId: new Types.ObjectId(doctorId), status: 'active' }).select('patientId');
    const patientIds = patientRelations.map(r => r.patientId);

    const query: any = {
      $or: [
        { doctorId: new Types.ObjectId(doctorId) },
        { patientId: { $in: patientIds }, doctorId: { $exists: false } },
        { patientId: { $in: patientIds }, doctorId: null }
      ]
    };
    
    if (patientId && Types.ObjectId.isValid(patientId)) {
      query.patientId = new Types.ObjectId(patientId);
    }
    
    if (exerciseId && Types.ObjectId.isValid(exerciseId)) {
      query.exerciseId = new Types.ObjectId(exerciseId);
    }

    const sessions = await ExerciseSession.find(query)
      .populate('exerciseId', 'name description')
      .populate('patientId', 'name email')
      .sort({ startTime: -1 })
      .skip(offset)
      .limit(limit) as any[];

    return sessions.map(session => ({
      id: (session._id as Types.ObjectId).toString(),
      exerciseId: session.exerciseId._id.toString(),
      exerciseName: session.exerciseId.name || 'Unknown Exercise',
      userId: session.patientId._id.toString(),
      patientName: session.patientId.name || 'Unknown Patient',
      doctorId: session.doctorId?.toString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration || 0,
      status: session.status as any,
      score: session.averageScore || 0,
      reps: session.totalReps || 0,
      feedback: session.overallFeedback?.join(', ') || null,
      videoUrl: session.videoUrl || null
    }));
  }

  // Upload session video
  static async uploadSessionVideo(
    sessionId: string, 
    videoUrl: string, 
    thumbnailUrl?: string
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const session = await ExerciseSession.findById(sessionId);
    if (!session) {
      return false;
    }

    session.videoUrl = videoUrl;
    if (thumbnailUrl) {
      session.thumbnailUrl = thumbnailUrl;
    }

    await session.save();

    // Create activity log
    await this.createActivity({
      userId: session.patientId.toString(),
      relatedUserId: session.doctorId?.toString(),
      sessionId: sessionId,
      exerciseId: session.exerciseId.toString(),
      type: 'session_uploaded',
      title: 'Session Video Uploaded',
      description: 'Uploaded video for exercise session',
      metadata: { videoUrl },
      visibility: 'public'
    });

    return true;
  }

  // Pause session
  static async pauseSession(sessionId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const result = await ExerciseSession.updateOne(
      { _id: sessionId, status: 'active' },
      { status: 'paused' }
    );

    return result.modifiedCount > 0;
  }

  // Resume session
  static async resumeSession(sessionId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const result = await ExerciseSession.updateOne(
      { _id: sessionId, status: 'paused' },
      { status: 'active' }
    );

    return result.modifiedCount > 0;
  }

  // Cancel session
  static async cancelSession(sessionId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const session = await ExerciseSession.findById(sessionId);
    if (!session || session.status === 'completed') {
      return false;
    }

    session.status = 'cancelled';
    session.endTime = new Date();
    await session.save();

    // Create activity log
    await this.createActivity({
      userId: session.patientId.toString(),
      relatedUserId: session.doctorId?.toString(),
      sessionId: sessionId,
      exerciseId: session.exerciseId.toString(),
      type: 'exercise_cancelled',
      title: 'Exercise Session Cancelled',
      description: 'Cancelled exercise session',
      metadata: { reason: 'user_cancelled' },
      visibility: 'public'
    });

    return true;
  }

  // Helper method to create activity
  private static async createActivity(activityData: {
    userId: string;
    relatedUserId?: string;
    sessionId?: string;
    exerciseId?: string;
    type: string;
    title: string;
    description: string;
    metadata: any;
    visibility: string;
  }): Promise<void> {
    const activity = new Activity({
      userId: new Types.ObjectId(activityData.userId),
      relatedUserId: activityData.relatedUserId ? new Types.ObjectId(activityData.relatedUserId) : undefined,
      sessionId: activityData.sessionId ? new Types.ObjectId(activityData.sessionId) : undefined,
      exerciseId: activityData.exerciseId ? new Types.ObjectId(activityData.exerciseId) : undefined,
      type: activityData.type as any,
      title: activityData.title,
      description: activityData.description,
      metadata: activityData.metadata,
      visibility: activityData.visibility as any
    });

    await activity.save();
  }

  // Helper method to create notification
  private static async createNotification(notificationData: {
    recipientId: string;
    senderId?: string;
    sessionId?: string;
    exerciseId?: string;
    type: string;
    title: string;
    message: string;
    data: any;
    deliveryMethod: string[];
  }): Promise<void> {
    const notification = new Notification({
      recipientId: new Types.ObjectId(notificationData.recipientId),
      senderId: notificationData.senderId ? new Types.ObjectId(notificationData.senderId) : undefined,
      sessionId: notificationData.sessionId ? new Types.ObjectId(notificationData.sessionId) : undefined,
      exerciseId: notificationData.exerciseId ? new Types.ObjectId(notificationData.exerciseId) : undefined,
      type: notificationData.type as any,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      deliveryMethod: notificationData.deliveryMethod as any[]
    });

    await notification.save();
  }
}

export default SessionService;
