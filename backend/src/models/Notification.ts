import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  exerciseId?: mongoose.Types.ObjectId;
  
  type: 'info' | 'warning' | 'success' | 'error' | 'recommendation' | 'reminder' |
        'progress_alert' | 'goal_reminder' | 'form_feedback' | 'achievement' |
        'doctor_message' | 'system_update' | 'chat_message' | 'connection_request' | 'connection_update';
  
  title: string;
  message: string;
  
  // Notification-specific data
  data: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    actionUrl?: string;
    actionText?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
  };
  
  // Status
  isRead: boolean;
  isArchived: boolean;
  readAt?: Date;
  
  // Delivery
  deliveryMethod: ('in_app' | 'email' | 'push')[];
  deliveredAt?: Date;
  failedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    senderId: { 
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
        'info', 'warning', 'success', 'error', 'recommendation', 'reminder',
        'progress_alert', 'goal_reminder', 'form_feedback', 'achievement',
        'doctor_message', 'system_update', 'chat_message', 'connection_request', 'connection_update'
      ],
      required: true
    },
    
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    
    // Notification-specific data
    data: {
      priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'], 
        default: 'medium' 
      },
      category: { type: String },
      actionUrl: { type: String },
      actionText: { type: String },
      expiresAt: { type: Date },
      metadata: { type: Map, of: Schema.Types.Mixed, default: {} }
    },
    
    // Status
    isRead: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    readAt: { type: Date },
    
    // Delivery
    deliveryMethod: [{ 
      type: String, 
      enum: ['in_app', 'email', 'push'] 
    }],
    deliveredAt: { type: Date },
    failedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for better performance
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ senderId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ 'data.priority': 1, createdAt: -1 });
NotificationSchema.index({ isArchived: 1 });
NotificationSchema.index({ sessionId: 1 });
NotificationSchema.index({ exerciseId: 1 });

// Compound indexes for common queries
NotificationSchema.index({ recipientId: 1, type: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, isArchived: 1, createdAt: -1 });

// TTL index for expired notifications
NotificationSchema.index({ 'data.expiresAt': 1 }, { expireAfterSeconds: 0, partialFilterExpression: { 'data.expiresAt': { $exists: true } } });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
