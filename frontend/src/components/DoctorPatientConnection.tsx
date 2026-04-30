import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  CheckCircle,
  BarChart3,
  Send,
  Eye
} from 'lucide-react';
import { Patient, Doctor } from '../types';
import apiService from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface DoctorPatientConnectionProps {
  userRole: 'patient' | 'doctor';
  userId: string;
}

interface PatientProgress {
  id: string;
  patientId: string;
  patientName: string;
  totalSessions: number;
  averageScore: number;
  lastSessionDate: string;
  improvementRate: number;
  currentStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface DoctorSuggestion {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  suggestion: string;
  type: 'exercise' | 'form' | 'schedule' | 'general';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'read' | 'implemented';
  createdAt: string;
}

const DoctorPatientConnection: React.FC<DoctorPatientConnectionProps> = ({
  userRole,
  userId
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientProgress, setPatientProgress] = useState<PatientProgress[]>([]);
  const [suggestions, setSuggestions] = useState<DoctorSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'patients' | 'progress' | 'suggestions'>('patients');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    patientId: '',
    suggestion: '',
    type: 'general' as const,
    priority: 'medium' as const
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (userRole === 'doctor') {
        const [patientsResponse, progressResponse, suggestionsResponse] = await Promise.all([
          apiService.getPatients(),
          apiService.getMyProgress(),
          apiService.getSuggestions()
        ]);
        
        if (patientsResponse.success) setPatients(patientsResponse.data || []);
        if (progressResponse.success) setPatientProgress(progressResponse.data || []);
        if (suggestionsResponse.success) setSuggestions(suggestionsResponse.data || []);
      } else {
        const [doctorsResponse, suggestionsResponse] = await Promise.all([
          apiService.getDoctors(),
          apiService.getSuggestions()
        ]);
        
        if (doctorsResponse.success) setDoctors(doctorsResponse.data || []);
        if (suggestionsResponse.success) setSuggestions(suggestionsResponse.data || []);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnectPatient = async (patientId: string) => {
    try {
      const response = await apiService.assignPatient(patientId, 'Patient requested connection');
      if (response.success) {
        fetchData();
        setShowConnectModal(false);
      }
    } catch (error) {
      
    }
  };

  const handleConnectDoctor = async (doctorId: string) => {
    try {
      // For patients connecting to doctors, we need to send a request
      const response = await apiService.requestDoctorConnection(doctorId, 'Patient requested connection for exercise guidance');
      if (response.success) {
        fetchData();
      }
    } catch (error) {
      
    }
  };

  const handleSendSuggestion = async () => {
    try {
      const response = await apiService.createSuggestion(newSuggestion);
      if (response.success) {
        setNewSuggestion({
          patientId: '',
          suggestion: '',
          type: 'general',
          priority: 'medium'
        });
        fetchData();
      }
    } catch (error) {
      
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'text-green-600 bg-green-50';
      case 'read': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {userRole === 'doctor' ? 'Patient Management' : 'Doctor Connection'}
          </h3>
          {userRole === 'doctor' && (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Connect Patient
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'patients'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {userRole === 'doctor' ? 'Patients' : 'Doctors'}
          </button>
          {userRole === 'doctor' && (
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'progress'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Progress
            </button>
          )}
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Suggestions
          </button>
        </div>

        {/* Patients/Doctors Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            {userRole === 'doctor' ? (
              patients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No patients connected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Connect with patients to monitor their progress
                  </p>
                </div>
              ) : (
                patients.map((patient) => (
                  <div key={patient.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {patient.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">{patient.name}</h4>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Avg Score: {patient.averageScore || 0}%</span>
                            <span>Sessions: {patient.totalSessions || 0}</span>
                            <span>Status: {patient.status || 'Active'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                          <Eye className="h-3 w-3 mr-1" />
                          View Progress
                        </button>
                        <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              doctors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors connected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Connect with a doctor for personalized guidance
                  </p>
                </div>
              ) : (
                doctors.map((doctor) => (
                  <div key={doctor.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {doctor.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">{doctor.name}</h4>
                          <p className="text-sm text-gray-500">{doctor.email}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Specialization: {doctor.specialization || 'General'}</span>
                            <span>Patients: {doctor.patients?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleConnectDoctor(doctor.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}

        {/* Progress Tab (Doctor only) */}
        {activeTab === 'progress' && userRole === 'doctor' && (
          <div className="space-y-4">
            {patientProgress.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No progress data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Patient progress will appear here once they start exercising
                </p>
              </div>
            ) : (
              patientProgress.map((progress) => (
                <div key={progress.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{progress.patientName}</h4>
                    <span className="text-xs text-gray-500">
                      Last session: {new Date(progress.lastSessionDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{progress.totalSessions}</div>
                      <div className="text-xs text-gray-500">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{progress.averageScore}%</div>
                      <div className="text-xs text-gray-500">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{progress.currentStreak}</div>
                      <div className="text-xs text-gray-500">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{progress.improvementRate}%</div>
                      <div className="text-xs text-gray-500">Improvement</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Weekly Progress</span>
                      <span>{progress.weeklyProgress}/{progress.weeklyGoal}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(progress.weeklyProgress / progress.weeklyGoal) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {userRole === 'doctor' && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Send Suggestion</h4>
                <div className="space-y-3">
                  <select
                    value={newSuggestion.patientId}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, patientId: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newSuggestion.type}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, type: e.target.value as any })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="general">General</option>
                    <option value="exercise">Exercise</option>
                    <option value="form">Form</option>
                    <option value="schedule">Schedule</option>
                  </select>
                  <select
                    value={newSuggestion.priority}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, priority: e.target.value as any })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <textarea
                    value={newSuggestion.suggestion}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, suggestion: e.target.value })}
                    placeholder="Enter your suggestion..."
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={handleSendSuggestion}
                    disabled={!newSuggestion.patientId || !newSuggestion.suggestion}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Suggestion
                  </button>
                </div>
              </div>
            )}

            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {userRole === 'doctor' ? 'Send suggestions to your patients' : 'Your doctor will send suggestions here'}
                </p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900 mr-2">
                          {userRole === 'doctor' ? suggestion.patientName : suggestion.doctorName}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(suggestion.status)}`}>
                          {suggestion.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.suggestion}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{suggestion.type}</span>
                        <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {userRole === 'patient' && suggestion.status === 'pending' && (
                      <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatientConnection;
