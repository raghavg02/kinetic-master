import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search, ChevronRight, Activity, Calendar, X } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../SereneWellness.css';

const DoctorReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await apiService.getPatients();
        if (response.success) {
          setPatients(response.data || []);
        }
      } catch (error) {
        
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        // If 'all', we use the practice sessions endpoint. 
        // If a specific patient, we might need a separate endpoint or filter the practice sessions.
        // For now, let's just use the practice sessions and filter on client side for simplicity, 
        // or we could add a query param to getPracticeSessions.
        const response = await apiService.getPracticeSessions();
        if (response.success) {
          let data = response.data || [];
          if (selectedPatientId !== 'all') {
            data = data.filter((s: any) => s.userId === selectedPatientId);
          }
          setSessions(data);
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [selectedPatientId]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl serene-title mb-2">Exercise Reports</h1>
          <p className="serene-subtitle text-lg">In-depth clinical reports generated from AI-analyzed sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Case Filter:</span>
          <select 
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-white/50 border border-white px-4 py-2 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all shadow-sm"
          >
            <option value="all">All Patients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/30">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Generation History</h2>
            <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-widest">
              {sessions.length} Total
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <Filter className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Report Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clinical Score</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                          {session.patientName?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{session.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2 text-rose-400" />
                        {session.exerciseName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(session.startTime).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${session.score >= 80 ? 'bg-emerald-500' : session.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${session.score || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{session.score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                        session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedSession(session);
                          setShowReportModal(true);
                        }}
                        className="p-2 rounded-xl hover:bg-violet-50 text-violet-600 transition-all"
                        title="View Full Clinical Report"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button 
                        disabled={!session.videoUrl}
                        onClick={() => session.videoUrl && window.open(session.videoUrl, '_blank')}
                        className="p-2 rounded-xl hover:bg-rose-50 text-rose-600 transition-all disabled:opacity-30"
                        title="View Session Video"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    No exercise sessions found in your practice records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-center">
          <button className="text-sm font-bold text-violet-600 hover:text-violet-700 uppercase tracking-widest flex items-center gap-2">
            Load More Archives
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clinical Report Modal */}
      {showReportModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowReportModal(false)} />
          <div className="glass-card w-full max-w-2xl p-8 relative shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-violet-100 text-violet-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Session Analysis Report</h3>
                  <p className="text-sm text-gray-500">Generated on {new Date(selectedSession.startTime).toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Reps</p>
                <p className="text-2xl font-bold text-gray-900">{selectedSession.reps || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy Score</p>
                <p className="text-2xl font-bold text-emerald-600">{selectedSession.score || 0}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor((selectedSession.duration || 0) / 60)}m {(selectedSession.duration || 0) % 60}s
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-500" />
                  Clinical Observations
                </h4>
                <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100">
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    {selectedSession.feedback || "No specific feedback recorded for this session."}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => selectedSession.videoUrl && window.open(selectedSession.videoUrl, '_blank')}
                  disabled={!selectedSession.videoUrl}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Download Media
                </button>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReports;
