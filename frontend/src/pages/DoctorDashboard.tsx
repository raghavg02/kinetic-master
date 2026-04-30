import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Activity,
  TrendingUp,
  Target,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Patient, DashboardStats } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useWebSocket } from '../hooks/useWebSocket';
import NotificationsSection from '../components/NotificationsSection';
import ChatWidget from '../components/ChatWidget';
import '../SereneWellness.css';

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const chatWidgetRef = useRef<any>(null);

  const { updateStatus } = useWebSocket({
    userId: user?.id || '',
    userRole: 'doctor',
    token: localStorage.getItem('authToken') || ''
  });

  const fetchDashboardData = async () => {
    try {
      const [statsResult, patientsResult, activityResult] = await Promise.allSettled([
        apiService.getDashboardStats(),
        apiService.getPatients(),
        apiService.getRecentActivity(10)
      ]);

      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        
        setStats(statsResult.value.data!);
      }
      if (patientsResult.status === 'fulfilled' && patientsResult.value.success) {
        
        setPatients(patientsResult.value.data!);
      }
      if (activityResult.status === 'fulfilled' && activityResult.value.success) {
        
        setRecentActivity(activityResult.value.data!);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Ensure doctors remain online across refresh while on the dashboard
    const setActive = async () => {
      try {
        setIsOnline(true);
        await apiService.updateOnlineStatus(true);
        updateStatus(true);
      } catch (e) {
        
      }
    };
    setActive();

    return () => {
      // Mark offline when leaving the dashboard
      (async () => {
        try {
          setIsOnline(false);
          await apiService.updateOnlineStatus(false);
          updateStatus(false);
        } catch {}
      })();
    };
  }, [updateStatus]);

  const handleOpenChat = (relationshipId: string) => {
    if (chatWidgetRef.current) {
      chatWidgetRef.current.openChat(relationshipId);
    }
  };

  const toggleOnline = async () => {
    try {
      const next = !isOnline;
      setIsOnline(next);
      await apiService.updateOnlineStatus(next);
      updateStatus(next);
    } catch (e) {
      
      setIsOnline((prev) => !prev);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl serene-title mb-2">
                Welcome back, Dr. {user?.name}!
              </h1>
              <p className="serene-subtitle text-lg">
                Monitor your patients' progress and provide personalized guidance in your digital sanctuary.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <button
                onClick={toggleOnline}
                className={`h-6 w-6 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${
                  isOnline ? 'bg-green-400 scale-110' : 'bg-rose-400'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              />
              <span className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                {isOnline ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/doctor/patients"
          className="glass-card p-8 group hover:bg-white/50 transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-violet-100 text-violet-600">
              <Users className="h-7 w-7" />
            </div>
            <UserPlus className="h-6 w-6 text-gray-300 group-hover:text-violet-400 transition-colors" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Patient Profiles</h3>
          <p className="serene-subtitle">Manage patient plans and monitor clinical updates.</p>
        </Link>

        <Link
          to="/doctor/reports"
          className="glass-card p-8 group hover:bg-white/50 transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
              <FileText className="h-7 w-7" />
            </div>
            <BarChart3 className="h-6 w-6 text-gray-300 group-hover:text-rose-400 transition-colors" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Exercise Reports</h3>
          <p className="serene-subtitle">Review detailed performance and posture analytics.</p>
        </Link>

        <Link
          to="/doctor/analytics"
          className="glass-card p-8 group hover:bg-white/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
              <BarChart3 className="h-7 w-7" />
            </div>
            <TrendingUp className="h-6 w-6 text-gray-300 group-hover:text-amber-400 transition-colors" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Progress Charts</h3>
          <p className="serene-subtitle">Analyze recovery trends with interactive telemetry.</p>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { id: 'patients', label: 'Total Patients', value: patients.length, icon: Users, color: 'violet' },
          { id: 'active', label: 'Active Sessions', value: stats?.activeSessions || 0, icon: Activity, color: 'emerald', clickable: true },
          { id: 'score', label: 'Avg. Patient Score', value: `${stats?.averageScore || 0}%`, icon: Target, color: 'rose' },
          { id: 'exercises', label: 'Completed Exercises', value: stats?.totalSessions || 0, icon: CheckCircle, color: 'amber', clickable: true, link: '/doctor/reports' }
        ].map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => {
              if (item.id === 'active') setShowActiveModal(true);
              else if (item.link) navigate(item.link);
            }}
            className={`glass-card p-6 flex items-center transition-all ${item.clickable ? 'cursor-pointer hover:bg-white/60 active:scale-95' : ''}`}
          >
            <div className={`p-4 rounded-2xl bg-${item.color}-50 text-${item.color}-600 mr-5`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{item.label}</p>
              <div className="flex items-center gap-2">
                <p className="serene-stat-value">{item.value}</p>
                {item.id === 'active' && (stats?.activeSessions || 0) > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Sessions Modal */}
      {showActiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowActiveModal(false)} />
          <div className="glass-card w-full max-w-md p-8 relative shadow-2xl">
            <h3 className="text-xl serene-title mb-6">Live Practice Sessions</h3>
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {stats?.activeSessionsList && stats.activeSessionsList.length > 0 ? (
                stats.activeSessionsList.map((session: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-600">
                        {session.patientName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{session.patientName}</p>
                        <p className="text-xs text-gray-500">{session.exerciseName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase animate-pulse">
                        Live
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 italic">
                  No patients are currently performing exercises.
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowActiveModal(false)}
              className="mt-8 w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Close Monitor
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patient Activity */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-6 sm:p-8">
            <h3 className="text-xl serene-title mb-6">
              Recent Patient Activity
            </h3>
            <div className="mt-5">
              {recentActivity.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-100">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="py-5 serene-table-row">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-2xl bg-violet-50 flex items-center justify-center">
                              <Activity className="h-5 w-5 text-violet-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {activity.user?.name || 'Patient'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.title}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {activity.session?.score && (
                              <span className={`serene-badge ${
                                activity.session.score >= 80 
                                  ? 'badge-active'
                                  : activity.session.score >= 60
                                  ? 'badge-stable'
                                  : 'badge-risk'
                              }`}>
                                {activity.session.score}%
                              </span>
                            )}
                            <p className="text-xs font-semibold text-gray-400 mt-2">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-16 w-16 text-gray-200" />
                  <h3 className="mt-4 text-lg font-bold text-gray-900">No recent activity</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Patient activity will appear here as they complete exercises.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl serene-title">
                Your Patients
              </h3>
              <Link
                to="/doctor/patients"
                className="text-sm font-bold text-violet-600 hover:text-violet-500 uppercase tracking-widest"
              >
                View all
              </Link>
            </div>
            <div className="mt-5">
              {patients.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-100">
                    {patients.slice(0, 5).map((patient) => (
                      <li key={patient.id} className="py-5 serene-table-row">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-white">
                              <span className="text-sm font-bold text-gray-600">
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {patient.name}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {patient.email}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`serene-badge ${
                              patient.status === 'active' 
                                ? 'badge-active'
                                : patient.status === 'pending'
                                ? 'badge-pending'
                                : 'badge-stable'
                            }`}>
                              {patient.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto h-16 w-16 text-gray-200" />
                  <h3 className="mt-4 text-lg font-bold text-gray-900">No patients yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Patients will appear here once they register and connect with you.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NotificationsSection onOpenChat={handleOpenChat} />

      <ChatWidget ref={chatWidgetRef} />
    </div>
  );
};

export default DoctorDashboard;
