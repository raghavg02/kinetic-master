import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  X,
  Clock,
  Users,
} from 'lucide-react';
import apiService from '../services/api';

import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

interface ConnectionRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientAvatar?: string;
  assignmentReason: string;
  requestedAt: string;
}

interface Props {
  onRequestProcessed?: () => void;
}

const DoctorConnectionRequests: React.FC<Props> = ({ onRequestProcessed }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const { isConnected: wsConnected, updateStatus } = useWebSocket({
    userId: user?.id || '',
    userRole: user?.role || 'doctor',
    token: localStorage.getItem('authToken') || ''
  });

  useEffect(() => {
    fetchConnectionRequests();
    
    // Set user as online when component mounts
    if (user?.id) {
      updateStatus(true);
    }

    // Set user as offline when component unmounts
    return () => {
      if (user?.id) {
        updateStatus(false);
      }
    };
  }, [user?.id, updateStatus]);

  useEffect(() => {
    // Listen for WebSocket notifications
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'connection_request' || notification.type === 'connection_update') {
        fetchConnectionRequests();
      }
    };

    window.addEventListener('websocket-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('websocket-notification', handleNotification as EventListener);
    };
  }, []);

  const fetchConnectionRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getConnectionRequests();
      if (response.success) {
        setRequests(response.data || []);
      } else {
        setError('Failed to load connection requests');
      }
    } catch (error) {
      
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (patientId: string) => {
    try {
      const response = await apiService.updateConnectionStatus(patientId, 'active');
      if (response.success) {
        fetchConnectionRequests();
        if (onRequestProcessed) onRequestProcessed();
      }
    } catch (error) {
      
    }
  };

  const handleRejectRequest = async (patientId: string) => {
    try {
      const response = await apiService.updateConnectionStatus(patientId, 'terminated');
      if (response.success) {
        fetchConnectionRequests();
        if (onRequestProcessed) onRequestProcessed();
      }
    } catch (error) {
      
    }
  };

  const formatRequestTime = (requestedAt: string) => {
    const date = new Date(requestedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="relative">
          <div className="h-8 w-8 rounded-full border-2 border-violet-100 border-t-violet-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2">
        <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-100 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-bold text-rose-700 mb-2 uppercase tracking-widest">{error}</p>
          <button
            onClick={fetchConnectionRequests}
            className="text-[9px] font-bold text-rose-600 hover:text-rose-800 underline decoration-rose-200"
          >
            Try Refreshing
          </button>
        </div>
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className="relative group">
      {/* Decorative Gradient Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-400/20 to-rose-400/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative glass-card overflow-hidden border border-white/40 shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center">
              <div className="p-2 rounded-xl bg-violet-100/50 text-violet-600 shadow-inner">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="ml-3 text-xs font-bold uppercase tracking-[0.15em] text-violet-900/70">
                Queue
              </h3>
            </div>
            <div className="flex items-center px-2 py-1 rounded-full bg-white/40 backdrop-blur-md border border-white/60">
              <div className={`h-1.5 w-1.5 rounded-full mr-2 relative ${wsConnected ? 'bg-green-500' : 'bg-rose-500'}`}>
                {wsConnected && (
                   <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                )}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-widest ${wsConnected ? 'text-green-700' : 'text-rose-700'}`}>
                {wsConnected ? 'Live' : 'Off'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="group/item relative p-3 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/60 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0 relative">
                      {request.patientAvatar ? (
                        <img
                          className="h-10 w-10 rounded-xl shadow-sm object-cover border-2 border-white"
                          src={request.patientAvatar}
                          alt={request.patientName}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-sm font-bold text-white">
                            {request.patientName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold text-gray-900 leading-tight truncate group-hover/item:text-violet-700 transition-colors">
                        {request.patientName}
                      </h4>
                      <div className="flex items-center mt-1 text-[9px] font-medium text-gray-500 truncate">
                        <span className="truncate">{request.patientEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative mb-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-200 rounded-full" />
                    <div className="pl-3 text-[9px] text-gray-600 leading-relaxed line-clamp-2 italic">
                      "{request.assignmentReason}"
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 px-2 py-0.5 rounded-lg">
                      <Clock className="h-2.5 w-2.5 mr-1.5" />
                      {formatRequestTime(request.requestedAt)}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRejectRequest(request.patientId)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                        title="Skip"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.patientId)}
                        className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-violet-200 transition-all active:scale-95"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Accept</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Decorative Edge */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500/10 via-rose-500/10 to-violet-500/10" />
      </div>
    </div>
  );
};

export default DoctorConnectionRequests;
