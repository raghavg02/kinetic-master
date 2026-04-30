import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import apiService from '../services/api';
import { Bell, MessageSquare, UserPlus, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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

interface NotificationsSectionProps {
  onOpenChat?: (relationshipId: string) => void;
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ onOpenChat }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isConnected } = useWebSocket({
    userId: user?.id || '',
    userRole: (user?.role as any) || 'patient',
    token: localStorage.getItem('authToken') || ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    // Listen for real-time notifications
    const handleWebSocketNotification = (event: CustomEvent) => {
      const notification = event.detail;
      
      
      // Add new notification to the list
      const newNotification: Notification = {
        id: `ws_${Date.now()}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdAt: new Date(notification.timestamp || Date.now()).toISOString(),
        data: notification.data
      };

      setNotifications(prev => [newNotification, ...prev]);
    };

    window.addEventListener('websocket-notification', handleWebSocketNotification as EventListener);
    return () => {
      window.removeEventListener('websocket-notification', handleWebSocketNotification as EventListener);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    if (notification.type === 'chat_message' && notification.data?.relationshipId && onOpenChat) {
      // Open the chatbox for this relationship
      onOpenChat(notification.data.relationshipId);
    } else if (notification.data?.actionUrl) {
      // Handle other action URLs if needed
      window.location.href = notification.data.actionUrl;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat_message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'connection_request':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'connection_update':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Notifications & Messages
            </h3>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={fetchNotifications}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>
        
        <div className="mt-5">
          {loading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No new notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                You'll receive updates from your doctor and system notifications here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.data?.actionText && (
                        <span className="inline-flex items-center mt-2 text-xs text-blue-600 font-medium">
                          {notification.data.actionText} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {notifications.length > 10 && (
                <div className="text-center pt-3">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;
