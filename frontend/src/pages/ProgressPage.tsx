import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Award,
  BarChart3,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ChartData, DashboardStats } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ProgressPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [progressData, setProgressData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const [statsResponse, progressResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getProgressData(undefined, parseInt(timeRange))
        ]);

        if (statsResponse.success) setStats(statsResponse.data!);
        if (progressResponse.success) setProgressData(progressResponse.data!);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [timeRange]);

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  const getAverageScore = () => {
    if (progressData.length === 0) return 0;
    const total = progressData.reduce((sum, data) => sum + data.score, 0);
    return Math.round(total / progressData.length);
  };

  const getTotalReps = () => {
    return progressData.reduce((sum, data) => sum + data.reps, 0);
  };

  const getTotalDuration = () => {
    return progressData.reduce((sum, data) => sum + data.duration, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
              <p className="mt-1 text-sm text-gray-500">
                Performance metrics for the {getTimeRangeLabel(timeRange).toLowerCase()}
              </p>
            </div>
            <div className="flex space-x-2">
              {(['7', '30', '90'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    timeRange === range
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview - Premium Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-green-50 to-white overflow-hidden shadow-sm border border-green-100 rounded-2xl transition-all hover:shadow-md">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Avg Score
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900">
                    {getAverageScore()}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white overflow-hidden shadow-sm border border-blue-100 rounded-2xl transition-all hover:shadow-md">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Total Reps
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900">
                    {getTotalReps()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white overflow-hidden shadow-sm border border-purple-100 rounded-2xl transition-all hover:shadow-md">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-100 rounded-xl">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Total Time
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900">
                    {formatDuration(getTotalDuration())}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-white overflow-hidden shadow-sm border border-orange-100 rounded-2xl transition-all hover:shadow-md">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-orange-100 rounded-xl">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Sessions
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900">
                    {progressData.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart - Glassmorphism Feel */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">
              Performance Trend
            </h3>
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 bg-indigo-500 rounded-sm mr-2"></div>
                Score %
              </div>
              <div className="flex items-center text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div>
                Reps
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {progressData.length > 0 ? (
            <div className="h-72 flex items-end justify-between space-x-4">
              {progressData.map((data, index) => {
                const maxScore = 100; // Normalizing to 100%
                const maxReps = Math.max(...progressData.map(d => d.reps), 10);
                const scoreHeight = (data.score / maxScore) * 200;
                const repsHeight = (data.reps / maxReps) * 200;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group relative">
                    <div className="flex items-end space-x-1.5 mb-3">
                      <div 
                        className="w-4 bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600 shadow-sm"
                        style={{ height: `${scoreHeight}px` }}
                      ></div>
                      <div 
                        className="w-4 bg-emerald-500 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-600 shadow-sm"
                        style={{ height: `${repsHeight}px` }}
                      ></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 transform -rotate-45 mt-2 whitespace-nowrap">
                      {new Date(data.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-slate-700">
                      <p className="font-bold border-b border-slate-600 mb-1 pb-1">{new Date(data.date).toLocaleDateString()}</p>
                      <p className="flex justify-between"><span>Score:</span> <span className="ml-2 text-indigo-300">{data.score}%</span></p>
                      <p className="flex justify-between"><span>Reps:</span> <span className="ml-2 text-emerald-300">{data.reps}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <BarChart3 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">No session data yet</h3>
              <p className="mt-2 text-slate-500 max-w-xs mx-auto">
                Once you complete your first exercise, your progress analytics will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Progress Table - Modern List Style */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Recent Activity History</h3>
        </div>
        
        <div className="p-0">
          {progressData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Session Date
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Performance
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Rep Count
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Form Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {progressData.slice(0, 10).map((data, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                        {new Date(data.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            data.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                            data.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {data.score}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-600">
                        {data.reps} <span className="text-[10px] font-normal text-slate-400 ml-0.5">reps</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">
                        {formatDuration(data.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                          data.score >= 70 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {data.score >= 70 ? 'Excellent' : 'Needs Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-slate-200" />
              <h3 className="mt-2 text-sm font-semibold text-slate-800">History is empty</h3>
              <p className="mt-1 text-sm text-slate-500">
                Complete a session to start tracking your journey.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      {stats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Achievements</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <Award className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Consistency</p>
                  <p className="text-xs text-yellow-600">{stats.streakDays} day streak</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Sessions</p>
                  <p className="text-xs text-blue-600">{stats.totalSessions} completed</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">Average Score</p>
                  <p className="text-xs text-green-600">{stats.averageScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
