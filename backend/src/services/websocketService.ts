import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import User from '../models/User';
import PatientDoctor from '../models/PatientDoctor';
import Message from '../models/Message';
import NotificationService from './notificationService';

interface AuthenticatedSocket {
  userId: string;
  userRole: 'patient' | 'doctor';
  isAuthenticated: boolean;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      
      
      

      // Handle authentication
      socket.on('authenticate', async (data: { token: string, userId: string, userRole: string }) => {
        
        try {
          // In a real implementation, you would verify the JWT token here
          // For now, we'll trust the client data
          const authenticatedSocket: AuthenticatedSocket = {
            userId: data.userId,
            userRole: data.userRole as 'patient' | 'doctor',
            isAuthenticated: true
          };

          this.connectedUsers.set(socket.id, authenticatedSocket);
          
          // Update user online status
          await this.updateUserOnlineStatus(data.userId, true);
          
          // Join user to their role-specific room
          socket.join(data.userRole);
          socket.join(data.userId);

          // Notify connected patients/doctors about online status
          await this.notifyStatusChange(data.userId, data.userRole, true);

          socket.emit('authenticated', { success: true });
          
        } catch (error) {
          
          socket.emit('authentication_error', { message: 'Authentication failed' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          await this.updateUserOnlineStatus(user.userId, false);
          await this.notifyStatusChange(user.userId, user.userRole, false);
          this.connectedUsers.delete(socket.id);
          
        }
      });

      // Handle manual status updates
      socket.on('update_status', async (data: { isOnline: boolean }) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          await this.updateUserOnlineStatus(user.userId, data.isOnline);
          await this.notifyStatusChange(user.userId, user.userRole, data.isOnline);
        }
      });

      // Handle joining specific patient-doctor relationship room
      socket.on('join_relationship', async (data: { relationshipId: string }) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          socket.join(`relationship_${data.relationshipId}`);
        }
      });

      // Relay chat messages within a relationship room
      socket.on(
        'relationship_send',
        async (data: {
          relationshipId: string;
          senderId: string;
          recipientId: string;
          text?: string;
          attachments?: { url: string; type: string; name?: string }[];
          clientMessageId?: string;
        }) => {
          const user = this.connectedUsers.get(socket.id);
          if (!user || !user.isAuthenticated) return;

          try {
            // Validate that this relationship exists and includes the sender
            const relation = await PatientDoctor.findById(data.relationshipId).select(
              'patientId doctorId status'
            );
            if (!relation || relation.status !== 'active') return;

            const isMember =
              relation.patientId?.toString() === user.userId ||
              relation.doctorId?.toString() === user.userId;
            if (!isMember) return;

            // Determine recipient ID
            const recipientId = relation.patientId?.toString() === user.userId 
              ? relation.doctorId?.toString() 
              : relation.patientId?.toString();

            if (!recipientId) return;

            // Save message to database
            const savedMessage = await Message.create({
              relationshipId: data.relationshipId,
              senderId: data.senderId,
              recipientId: recipientId,
              text: data.text || '',
              attachments: data.attachments || [],
              clientMessageId: data.clientMessageId,
              deliveredAt: new Date()
            });

            const messagePayload = {
              _id: savedMessage._id,
              relationshipId: data.relationshipId,
              senderId: data.senderId,
              recipientId: recipientId,
              text: data.text || '',
              attachments: data.attachments || [],
              clientMessageId: data.clientMessageId,
              timestamp: savedMessage.createdAt.getTime(),
              isRead: false,
              deliveredAt: savedMessage.deliveredAt
            };

            // Emit to the room and to recipient's personal room for badge updates
            this.io?.to(`relationship_${data.relationshipId}`).emit('relationship_message', messagePayload);
            this.io?.to(recipientId).emit('relationship_message', messagePayload);

            // Send chat notification to recipient
            await this.sendChatNotification(recipientId, {
              relationshipId: data.relationshipId,
              senderId: data.senderId,
              message: data.text || 'Sent an attachment',
              timestamp: savedMessage.createdAt.getTime()
            });

            // Also save notification to database
            await NotificationService.createNotification({
              recipientId: recipientId,
              senderId: data.senderId,
              type: 'chat_message',
              title: `New message from ${(await User.findById(data.senderId))?.name || 'Someone'}`,
              message: data.text || 'Sent an attachment',
              data: {
                relationshipId: data.relationshipId,
                senderId: data.senderId,
                priority: 'medium',
                category: 'chat',
                actionUrl: `/chat/${data.relationshipId}`,
                actionText: 'Open Chat'
              }
            });
          } catch (err) {
            
            // Emit error back to sender
            socket.emit('message_error', { 
              clientMessageId: data.clientMessageId,
              error: 'Failed to send message' 
            });
          }
        }
      );

      // Typing indicator within relationship
      socket.on(
        'relationship_typing',
        (data: { relationshipId: string; senderId: string; isTyping: boolean }) => {
          const user = this.connectedUsers.get(socket.id);
          if (!user || !user.isAuthenticated) return;
          this.io?.to(`relationship_${data.relationshipId}`).emit('relationship_typing', {
            relationshipId: data.relationshipId,
            senderId: data.senderId,
            isTyping: data.isTyping
          });
        }
      );

      // Mark messages as read
      socket.on(
        'mark_messages_read',
        async (data: { relationshipId: string; messageIds: string[] }) => {
          const user = this.connectedUsers.get(socket.id);
          if (!user || !user.isAuthenticated) return;

          try {
            // Update messages as read
            await Message.updateMany(
              { 
                _id: { $in: data.messageIds },
                recipientId: user.userId,
                isRead: false
              },
              { 
                isRead: true, 
                readAt: new Date() 
              }
            );

            // Notify sender about read receipts
            this.io?.to(`relationship_${data.relationshipId}`).emit('messages_read', {
              relationshipId: data.relationshipId,
              messageIds: data.messageIds,
              readBy: user.userId,
              readAt: new Date()
            });
          } catch (err) {
            
          }
        }
      );

      // Load chat history
      socket.on(
        'load_chat_history',
        async (data: { relationshipId: string; limit?: number; offset?: number }) => {
          const user = this.connectedUsers.get(socket.id);
          if (!user || !user.isAuthenticated) return;

          try {
            // Validate relationship access
            const relation = await PatientDoctor.findById(data.relationshipId).select(
              'patientId doctorId status'
            );
            if (!relation || relation.status !== 'active') return;

            const isMember =
              relation.patientId?.toString() === user.userId ||
              relation.doctorId?.toString() === user.userId;
            if (!isMember) return;

            // Load messages
            const messages = await Message.find({ relationshipId: data.relationshipId })
              .sort({ createdAt: -1 })
              .limit(data.limit || 50)
              .skip(data.offset || 0)
              .populate('senderId', 'name')
              .lean();

            socket.emit('chat_history_loaded', {
              relationshipId: data.relationshipId,
              messages: messages.reverse() // Reverse to show oldest first
            });
          } catch (err) {
            
            socket.emit('chat_history_error', { 
              relationshipId: data.relationshipId,
              error: 'Failed to load chat history' 
            });
          }
        }
      );
    });
  }

  private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      
    }
  }

  private async notifyStatusChange(userId: string, userRole: string, isOnline: boolean) {
    try {
      if (userRole === 'doctor') {
        // Notify all patients connected to this doctor
        const relationships = await PatientDoctor.find({
          doctorId: userId,
          status: 'active'
        }).populate('patientId', 'name email');

        relationships.forEach(relationship => {
          this.io?.to(relationship.patientId._id.toString()).emit('doctor_status_change', {
            doctorId: userId,
            doctorName: (relationship.patientId as any).name,
            isOnline,
            lastSeen: new Date()
          });
        });
      } else if (userRole === 'patient') {
        // Notify the doctor connected to this patient
        const relationship = await PatientDoctor.findOne({
          patientId: userId,
          status: 'active'
        }).populate('doctorId', 'name email');

        if (relationship) {
          this.io?.to(relationship.doctorId._id.toString()).emit('patient_status_change', {
            patientId: userId,
            patientName: (relationship.doctorId as any).name,
            isOnline,
            lastSeen: new Date()
          });
        }
      }
    } catch (error) {
      
    }
  }

  // Method to send real-time notifications
  async sendNotification(recipientId: string, notification: any) {
    this.io?.to(recipientId).emit('notification', notification);
  }

  // Method to send chat notifications
  async sendChatNotification(recipientId: string, chatData: {
    relationshipId: string;
    senderId: string;
    message: string;
    timestamp: number;
  }) {
    try {
      // Get sender information
      const sender = await User.findById(chatData.senderId).select('name role');
      if (!sender) return;

      const notification = {
        type: 'chat_message',
        title: `New message from ${sender.name}`,
        message: chatData.message.length > 50 ? chatData.message.substring(0, 50) + '...' : chatData.message,
        data: {
          relationshipId: chatData.relationshipId,
          senderId: chatData.senderId,
          senderName: sender.name,
          senderRole: sender.role,
          timestamp: chatData.timestamp,
          priority: 'medium',
          category: 'chat',
          actionUrl: `/chat/${chatData.relationshipId}`,
          actionText: 'Open Chat'
        },
        timestamp: chatData.timestamp
      };

      this.io?.to(recipientId).emit('notification', notification);
    } catch (error) {
      
    }
  }

  // Method to send message to specific relationship
  async sendRelationshipMessage(relationshipId: string, message: any) {
    this.io?.to(`relationship_${relationshipId}`).emit('relationship_message', message);
  }

  // Method to get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Method to get online doctors count
  getOnlineDoctorsCount(): number {
    return Array.from(this.connectedUsers.values()).filter(user => user.userRole === 'doctor').length;
  }

  // Method to get online patients count
  getOnlinePatientsCount(): number {
    return Array.from(this.connectedUsers.values()).filter(user => user.userRole === 'patient').length;
  }
}

export default new WebSocketService();
