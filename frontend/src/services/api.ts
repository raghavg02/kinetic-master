import axios, { AxiosInstance } from 'axios';
import { 
  User, 
  Patient, 
  Doctor,
  Exercise, 
  ExerciseSession, 
  ApiResponse,
  DashboardStats,
  ChartData,
  Notification
  
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 300000, // 5 minutes for video uploads
      headers: {
        'Content-Type': 'application/json',
      },
    });


    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: Partial<User> & { password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    localStorage.removeItem('authToken');
  }

  // User Management
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/user/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put('/user/profile', userData);
    return response.data;
  }

  // Exercise Management
  async getExercises(): Promise<ApiResponse<Exercise[]>> {
    const response = await this.api.get('/exercises');
    return response.data;
  }

  async getExercise(id: string): Promise<ApiResponse<Exercise>> {
    const response = await this.api.get(`/exercises/${id}`);
    return response.data;
  }

  // Session Management
  async startSession(exerciseId: string, scheduledDuration?: number): Promise<ApiResponse<ExerciseSession>> {
    const response = await this.api.post('/sessions/start', { exerciseId, scheduledDuration });
    return response.data;
  }

  async endSession(sessionId: string, endData?: any): Promise<ApiResponse<ExerciseSession>> {
    const response = await this.api.post(`/sessions/${sessionId}/end`, endData);
    return response.data;
  }

  async uploadSessionVideo(sessionId: string, videoFile: File): Promise<ApiResponse<{ videoUrl: string }>> {
    const formData = new FormData();
    formData.append('video', videoFile);
    
    const response = await this.api.post(`/sessions/${sessionId}/video`, formData, {
      headers: { 'Content-Type': null }
    });
    return response.data;
  }

  // Pose Analysis with ML backend
async analyzePose(sessionId: string, landmarks: number[][]): Promise<ApiResponse<{
  accuracy: number;
  feedback: string[];
  primaryCoaching?: string;
  repCount?: number;
  isCorrectForm: boolean;
  confidence: number;
}>> {
  const response = await this.api.post(`/sessions/${sessionId}/analyze-pose`, {
    landmarks,
  });
  return response.data;
}

  // Progress and Analytics
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  async getProgressData(exerciseId?: string, days?: number): Promise<ApiResponse<ChartData[]>> {
    const params = new URLSearchParams();
    if (exerciseId) params.append('exerciseId', exerciseId);
    if (days) params.append('days', days.toString());
    
    const response = await this.api.get(`/dashboard/progress?${params}`);
    return response.data;
  }
  
  async getRecentActivity(limit?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.api.get(`/dashboard/recent-activity?${params}`);
    return response.data;
  }

  async getSessionHistory(limit?: number, offset?: number): Promise<ApiResponse<ExerciseSession[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await this.api.get(`/sessions/history?${params}`);
    return response.data;
  }

  // Doctor-specific endpoints
  async getPatients(): Promise<ApiResponse<Patient[]>> {
    const response = await this.api.get('/doctor/patients');
    return response.data;
  }

  async getPatientProgress(patientId: string): Promise<ApiResponse<ChartData[]>> {
    const response = await this.api.get(`/doctor/patients/${patientId}/progress`);
    return response.data;
  }

  async sendRecommendation(patientId: string, message: string): Promise<ApiResponse<void>> {
    const response = await this.api.post(`/doctor/patients/${patientId}/recommendations`, { message });
    return response.data;
  }
  
  async getConnectionRequests(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/doctor/connection-requests');
    return response.data;
  }

  async getPracticeSessions(limit?: number, offset?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await this.api.get(`/sessions/practice/history?${params}`);
    return response.data;
  }

  async getPracticeProgress(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/doctor/progress');
    return response.data;
  }

  async updateConnectionStatus(patientId: string, status: 'active' | 'terminated'): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/doctor/patients/${patientId}/status`, { status });
    return response.data;
  }

  async getMyProgress(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/doctor/my-progress');
    return response.data;
  }

  async getSuggestions(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/suggestions');
    return response.data;
  }
  
  async createSuggestion(suggestionData: {
    patientId: string;
    suggestion: string;
    type: 'exercise' | 'form' | 'schedule' | 'general';
    priority: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<any>> {
    const response = await this.api.post('/suggestions', suggestionData);
    return response.data;
  }

  async getDoctors(): Promise<ApiResponse<Doctor[]>> {
    const response = await this.api.get('/doctor/doctors');
    return response.data;
  }
  
  async getOnlineDoctors(): Promise<ApiResponse<Doctor[]>> {
    const response = await this.api.get('/doctor/online-doctors');
    return response.data;
  }

  async assignPatient(patientId: string, reason: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/doctor/assign-patient', { patientId, reason });
    return response.data;
  }
  
  async requestDoctorConnection(doctorId: string, reason: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/doctor/request-connection', { doctorId, reason });
    return response.data;
  }
  
  async disconnectFromDoctor(): Promise<ApiResponse<any>> {
    const response = await this.api.post('/doctor/disconnect');
    return response.data;
  }
  
  async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse<any>> {
    const response = await this.api.post('/user/online-status', { isOnline });
    return response.data;
  }
  
  async cancelConnectionRequest(): Promise<ApiResponse<any>> {
    const response = await this.api.post('/doctor/cancel-connection');
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    const response = await this.api.get('/notifications');
    return response.data;
  }
  
  async getPatientConnectionStatus(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/doctor/patient/connection-status');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // File upload utility
  async uploadFile(file: File, endpoint: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.api.post(endpoint, formData, {
      headers: { 'Content-Type': null }
    });
    return response.data;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
