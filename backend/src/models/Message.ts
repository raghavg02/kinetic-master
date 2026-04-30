import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  relationshipId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  text: string;
  attachments?: {
    url: string;
    type: string;
    name?: string;
  }[];
  clientMessageId?: string;
  
  // Message status
  isRead: boolean;
  readAt?: Date;
  deliveredAt?: Date;
  
  // Message metadata
  messageType: 'text' | 'image' | 'file' | 'system';
  replyTo?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    relationshipId: { 
      type: Schema.Types.ObjectId, 
      ref: 'PatientDoctor', 
      required: true 
    },
    senderId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    recipientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    text: { 
      type: String, 
      required: true, 
      trim: true 
    },
    attachments: [{
      url: { type: String, required: true },
      type: { type: String, required: true },
      name: { type: String }
    }],
    clientMessageId: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    
    // Message status
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    deliveredAt: { type: Date, default: Date.now },
    
    // Message metadata
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'file', 'system'], 
      default: 'text' 
    },
    replyTo: { 
      type: Schema.Types.ObjectId, 
      ref: 'Message' 
    }
  },
  { timestamps: true }
);

// Indexes for better performance
MessageSchema.index({ relationshipId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
