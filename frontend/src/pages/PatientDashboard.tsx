import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Upload, 
  BarChart3, 
  Activity,
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DashboardStats, ExerciseSession, Exercise } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ExerciseSelector from '../components/ExerciseSelector';
import NotificationsSection from '../components/NotificationsSection';
import ChatWidget from '../components/ChatWidget';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recentSessions, setRecentSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDuration, setUploadDuration] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  
  const chatWidgetRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, , sessionsResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getExercises(),
          apiService.getSessionHistory(5)
        ]);

        if (statsResponse.success) setStats(statsResponse.data!);
        // if (exercisesResponse.success) setExercises(exercisesResponse.data || []);
        if (sessionsResponse.success) setRecentSessions(sessionsResponse.data!);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleOpenChat = (relationshipId: string) => {
    if (chatWidgetRef.current) {
      chatWidgetRef.current.openChat(relationshipId);
    }
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleExerciseSelectForUpload = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExercise || !uploadDuration) return;

    try {
      setIsUploading(true);
      setUploadError('');
      
      // 1. Start a session for this exercise with duration
      const durationNum = parseInt(uploadDuration);
      const sessionResponse = await apiService.startSession(selectedExercise.id, durationNum);
      if (!sessionResponse.success || !sessionResponse.data) {
        throw new Error('Failed to start session for upload');
      }
      
      const sessionId = sessionResponse.data.id;

      // 2. Upload the video
      const uploadResponse = await apiService.uploadSessionVideo(sessionId, file);
      if (uploadResponse.success) {
        // 3. Mark session as completed
        await apiService.endSession(sessionId);
        
        setIsUploadModalOpen(false);
        navigate('/patient/progress');
      } else {
        throw new Error(uploadResponse.message || 'Upload failed');
      }
    } catch (err) {
      
      setUploadError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ready to start your exercise session? Let's track your progress together.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/patient/exercise/new"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
              <Play className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              Start Live Exercise
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Begin a new exercise session with real-time feedback and guidance.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <Activity className="h-6 w-6" />
          </span>
        </Link>

        <div 
          onClick={handleUploadClick}
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-secondary-50 text-secondary-700 ring-4 ring-white">
              <Upload className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              Upload Past Session
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload a recorded exercise video for analysis and feedback.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <Upload className="h-6 w-6" />
          </span>
        </div>

        <Link
          to="/patient/progress"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
              <BarChart3 className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              View Progress
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Track your improvement with detailed charts and analytics.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <TrendingUp className="h-6 w-6" />
          </span>
        </Link>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Sessions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalSessions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.averageScore}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Exercises Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalExercises}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Streak Days
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.streakDays}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Exercise Sessions
          </h3>
          <div className="mt-5">
            {recentSessions.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentSessions.map((session) => (
                    <li key={session.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Exercise Session
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(session.startTime).toLocaleDateString()} at{' '}
                            {new Date(session.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start your first exercise session to see your progress here.
                </p>
                <div className="mt-6">
                  <Link
                    to="/patient/exercise/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Exercise
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <NotificationsSection onOpenChat={handleOpenChat} />

      {/* Chat Widget */}
      <ChatWidget ref={chatWidgetRef} />

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isUploading && setIsUploadModalOpen(false)}></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-4xl sm:w-full z-50">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-900">Upload Past Session</h3>
                  <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {uploadError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {uploadError}
                  </div>
                )}

                {!selectedExercise ? (
                  <ExerciseSelector 
                    onExerciseSelect={handleExerciseSelectForUpload} 
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center p-4 bg-primary-50 rounded-lg border border-primary-100">
                      <Target className="h-8 w-8 text-primary-600 mr-4" />
                      <div>
                        <div className="text-lg font-bold text-gray-900">{selectedExercise.name}</div>
                        <div className="text-sm text-gray-500">Selected for analysis</div>
                      </div>
                      <button 
                        onClick={() => setSelectedExercise(null)} 
                        className="ml-auto text-sm text-primary-600 font-medium hover:text-primary-700"
                      >
                        Change
                      </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Session Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration (min)</label>
                          <input
                            type="text"
                            value={uploadDuration}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) setUploadDuration(val);
                            }}
                            placeholder="e.g. 15"
                            className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                          <p className="mt-2 text-xs text-gray-500">Enter the approximate duration of the recorded video.</p>
                        </div>
                        
                        <div className="flex flex-col justify-end">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="video/*"
                            className="hidden"
                          />
                          <button
                            onClick={triggerFileSelect}
                            disabled={!uploadDuration || isUploading}
                            className={`w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white shadow-sm ${
                              uploadDuration && !isUploading ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isUploading ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 mr-2" />
                                Select Video & Upload
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
