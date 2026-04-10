export type QuestionType = 'text' | 'rating' | 'multiple-choice' | 'boolean';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  startDate?: string | null;
  endDate?: string | null;
  questions: Question[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, any>;
  submittedAt: string;
  is_complete: boolean;
}

export type UserRole = 'admin' | 'manager';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  detail: string | null;
  ip_address: string | null;
  timestamp: string;
  user_email: string | null;
}
