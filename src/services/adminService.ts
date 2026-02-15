import axios from 'axios';
import API_BASE_URL from '../config/api';
import type {
  User,
  Lesson,
  Quiz,
  QuizAttempt,
  QuizResult,
  DashboardStats,
  PaginatedResponse,
  QualityQueueResponse,
  FunnelResponse,
  AiObservabilityResponse,
  UserJourney,
} from '../types/admin';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/stats');
    return response.data;
  },

  async getQualityQueue(limit = 25): Promise<QualityQueueResponse> {
    const response = await api.get('/quality-queue', { params: { limit } });
    return response.data;
  },

  async getFunnel(days: number | 'all' = 7): Promise<FunnelResponse> {
    const response = await api.get('/funnel', { params: { days } });
    return response.data;
  },

  async getAiObservability(days: number | 'all' = 7): Promise<AiObservabilityResponse> {
    const response = await api.get('/ai-observability', { params: { days } });
    return response.data;
  },

  // Users
  async getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<PaginatedResponse<User>> {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateUser(id: number, data: { email?: string; role?: 'user' | 'admin' }): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getUserLessons(userId: number): Promise<Lesson[]> {
    const response = await api.get(`/users/${userId}/lessons`);
    return response.data;
  },

  async getUserQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    const response = await api.get(`/users/${userId}/quiz-attempts`);
    return response.data;
  },

  async getUserJourney(userId: number, params?: { limit?: number; offset?: number }): Promise<UserJourney> {
    const response = await api.get(`/users/${userId}/journey`, { params });
    return response.data;
  },

  // Lessons
  async getLessons(params?: { page?: number; limit?: number; search?: string; category?: string; user_id?: number }): Promise<PaginatedResponse<Lesson>> {
    const response = await api.get('/lessons', { params });
    return response.data;
  },

  async getLesson(id: number): Promise<Lesson> {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  async createLesson(data: { topic: string; category: string; summary: string; quiz_data?: any; key_points?: string[]; user_id?: number }): Promise<Lesson> {
    const response = await api.post('/lessons', data);
    return response.data;
  },

  async updateLesson(id: number, data: { topic?: string; category?: string; summary?: string; quiz_data?: any }): Promise<Lesson> {
    const response = await api.put(`/lessons/${id}`, data);
    return response.data;
  },

  async deleteLesson(id: number): Promise<void> {
    await api.delete(`/lessons/${id}`);
  },

  // Quizzes
  async getQuizzes(params?: { page?: number; limit?: number; search?: string; category?: string; difficulty?: string; is_active?: string }): Promise<PaginatedResponse<Quiz>> {
    const response = await api.get('/quizzes', { params });
    return response.data;
  },

  async getQuiz(id: number): Promise<Quiz> {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  async createQuiz(data: { question: string; options: string[]; correct_answer: string; explanation?: string; category?: string; difficulty?: 'easy' | 'medium' | 'hard' }): Promise<Quiz> {
    const response = await api.post('/quizzes', data);
    return response.data;
  },

  async updateQuiz(id: number, data: { question?: string; options?: string[]; correct_answer?: string; explanation?: string; category?: string; difficulty?: 'easy' | 'medium' | 'hard'; is_active?: boolean }): Promise<Quiz> {
    const response = await api.put(`/quizzes/${id}`, data);
    return response.data;
  },

  async deleteQuiz(id: number): Promise<void> {
    await api.delete(`/quizzes/${id}`);
  },

  // Quiz Attempts
  async getQuizAttempts(params?: { page?: number; limit?: number; user_id?: number; quiz_id?: number; is_correct?: string }): Promise<PaginatedResponse<QuizAttempt>> {
    const response = await api.get('/quiz-attempts', { params });
    return response.data;
  },

  async getQuizAttempt(id: number): Promise<QuizAttempt> {
    const response = await api.get(`/quiz-attempts/${id}`);
    return response.data;
  },

  async deleteQuizAttempt(id: number): Promise<void> {
    await api.delete(`/quiz-attempts/${id}`);
  },

  // Quiz Results
  async getQuizResults(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<QuizResult>> {
    const response = await api.get('/quiz-results', { params });
    return response.data;
  },

  // Batch Delete
  async batchDeleteUsers(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    const response = await api.post('/users/batch-delete', { ids });
    return response.data;
  },

  async batchDeleteLessons(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    const response = await api.post('/lessons/batch-delete', { ids });
    return response.data;
  },

  async batchDeleteQuizzes(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    const response = await api.post('/quizzes/batch-delete', { ids });
    return response.data;
  },

  async batchDeleteQuizAttempts(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    const response = await api.post('/quiz-attempts/batch-delete', { ids });
    return response.data;
  },

  // Topic Generation
  async previewTopics(data: { count: number; category?: string; progressId?: string }): Promise<{
    message: string;
    topics: Array<{ topic: string; category: string; index: number }>;
    errors?: Array<{ index: number; error: string }>;
    totalRequested: number;
    totalPreviewed: number;
    progressId?: string;
  }> {
    const response = await api.post('/preview-topics', data);
    return response.data;
  },

  async generateTopicsFromList(data: { topics: Array<{ topic: string; category: string }>; userId?: number; progressId?: string }): Promise<{
    message: string;
    generated: Lesson[];
    errors?: Array<{ topic: string; error: string }>;
    totalRequested: number;
    totalGenerated: number;
    progressId?: string;
  }> {
    const response = await api.post('/generate-topics-from-list', data);
    return response.data;
  },

  async getGenerationProgress(progressId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    current: string | null;
    generated: Lesson[];
    errors: Array<{ topic: string; error: string }>;
    topicStatuses?: Array<{
      topic: string;
      category: string;
      status: 'pending' | 'generating' | 'completed' | 'failed';
      error: string | null;
    }>;
    status: 'generating' | 'completed';
  }> {
    const response = await api.get(`/generate-progress/${progressId}`);
    return response.data;
  },

  async generateTopics(data: { count: number; category?: string; userId?: number }): Promise<{
    message: string;
    generated: Lesson[];
    errors?: Array<{ index: number; error: string }>;
    totalRequested: number;
    totalGenerated: number;
  }> {
    const response = await api.post('/generate-topics', data);
    return response.data;
  },
};
