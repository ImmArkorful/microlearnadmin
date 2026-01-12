export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  lessons_count?: number;
  quiz_attempts_count?: number;
  correct_attempts_count?: number;
}

export interface Lesson {
  id: number;
  topic: string;
  category: string;
  summary: string;
  quiz_data?: any;
  key_points?: string[];
  user_id: number;
  user_email?: string;
  created_at: string;
}

export interface Quiz {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  created_at: string;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  user_email?: string;
  quiz_id: number;
  quiz_question?: string;
  quiz_category?: string;
  selected_answer: string;
  correct_answer?: string;
  is_correct: boolean;
  attempted_at: string;
}

export interface QuizResult {
  id: number;
  user_id: number;
  user_email?: string;
  lesson_id?: number;
  quiz_data?: any;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at: string;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
  };
  lessons: {
    total: number;
    byCategory: Array<{ category: string; count: string }>;
  };
  quizzes: {
    total: number;
    active: number;
  };
  quizAttempts: {
    total: number;
    successRate: number;
  };
  recentActivity: Array<{
    type: string;
    user_id: number;
    related_id: number;
    description: string;
    created_at: string;
  }>;
}

export interface PaginatedResponse<T> {
  users?: T[];
  lessons?: T[];
  quizzes?: T[];
  attempts?: T[];
  results?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
