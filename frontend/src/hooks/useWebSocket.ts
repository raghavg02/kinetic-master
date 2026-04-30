import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketProps {
  userId: string;
  userRole: 'patient' | 'doctor';
  token: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface WebSocketMessage {
  type: 'doctor_status_change' | 'patient_status_change' | 'notification' | 'relationship_message';
  data: any;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars

export const useWebSocket = ({ userId, userRole, token }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ [key: string]: boolean }>({});
  const socketRef = useRef<Socket | null>(null);
  const subscriptionsSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !userRole || !token) return;

    // Derive WS URL from API URL if available, otherwise fallback to localhost:8000
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const wsUrl = process.env.REACT_APP_WS_URL || apiBaseUrl.replace('/api', '');
    
    

    // Initialize socket connection
    const socket = io(wsUrl, {
      auth: {
        token,
        userId,
        userRole
      },
      transports: ['websocket', 'polling'], // Allow fallback to polling
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      
      setIsConnected(true);
      
      // Authenticate with the server
      socket.emit('authenticate', {
        token,
        userId,
        userRole
      });
    });

    socket.on('disconnect', () => {
      
      setIsConnected(false);
    });

    socket.on('authenticated', (data) => {
      
    });

    socket.on('authentication_error', (error) => {
      
    });

    // Status change handlers
    socket.on('doctor_status_change', (data) => {
      
      setOnlineUsers(prev => ({
        ...prev,
        [data.doctorId]: data.isOnline
      }));
    });

    socket.on('patient_status_change', (data) => {
      
      setOnlineUsers(prev => ({
        ...prev,
        [data.patientId]: data.isOnline
      }));
    });

    socket.on('notification', (notification) => {
      
      // You can emit a custom event or use a state management solution here
      window.dispatchEvent(new CustomEvent('websocket-notification', { detail: notification }));
    });

    socket.on('relationship_message', (message) => {
      
      window.dispatchEvent(new CustomEvent('websocket-message', { detail: message }));
    });

    socket.on('relationship_typing', (payload) => {
      window.dispatchEvent(new CustomEvent('websocket-typing', { detail: payload }));
    });

    socket.on('messages_read', (payload) => {
      window.dispatchEvent(new CustomEvent('websocket-messages-read', { detail: payload }));
    });

    socket.on('chat_history_loaded', (payload) => {
      window.dispatchEvent(new CustomEvent('websocket-chat-history', { detail: payload }));
    });

    socket.on('message_error', (payload) => {
      window.dispatchEvent(new CustomEvent('websocket-message-error', { detail: payload }));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userRole, token]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(type, data);
    }
  }, [isConnected]);

  const joinRelationship = useCallback((relationshipId: string) => {
    if (socketRef.current && isConnected && !subscriptionsSet.current.has(relationshipId)) {
      subscriptionsSet.current.add(relationshipId);
      socketRef.current.emit('join_relationship', { relationshipId });
    }
  }, [isConnected]);

  const updateStatus = useCallback((isOnline: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update_status', { isOnline });
    }
  }, [isConnected]);

  const sendTypingIndicator = useCallback((relationshipId: string, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('relationship_typing', {
        relationshipId,
        senderId: userId,
        isTyping
      });
    }
  }, [isConnected, userId]);

  const markMessagesAsRead = useCallback((relationshipId: string, messageIds: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_messages_read', {
        relationshipId,
        messageIds
      });
    }
  }, [isConnected]);

  const loadChatHistory = useCallback((relationshipId: string, limit?: number, offset?: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('load_chat_history', {
        relationshipId,
        limit,
        offset
      });
    }
  }, [isConnected]);

  return {
    isConnected,
    onlineUsers,
    sendMessage,
    joinRelationship,
    updateStatus,
    sendTypingIndicator,
    markMessagesAsRead,
    loadChatHistory
  };
};
