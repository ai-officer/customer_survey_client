import { http, HttpResponse } from 'msw';

// Baseline JSON fixtures for the API. Individual tests can override these
// via `server.use(...)` from `./server`.

const adminUser = {
  id: 'user-admin-1',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
  is_active: true,
};

const survey = {
  id: 'survey-1',
  title: 'Sample Survey',
  description: 'A sample survey',
  status: 'published',
  createdAt: '2026-01-01T00:00:00Z',
  startDate: null,
  endDate: null,
  createdBy: adminUser.id,
  departmentId: 'dept-1',
  departmentName: 'Engineering',
  customer: null,
  questions: [],
  createdByName: adminUser.full_name,
  responseCount: 0,
};

const department = {
  id: 'dept-1',
  name: 'Engineering',
  createdAt: '2026-01-01T00:00:00Z',
};

const response = {
  id: 'response-1',
  surveyId: survey.id,
  answers: {},
  submittedAt: '2026-01-02T00:00:00Z',
  is_complete: true,
  respondentName: null,
  isAnonymous: true,
};

const auditLog = {
  id: 'audit-1',
  user_id: adminUser.id,
  action: 'login',
  resource: 'auth',
  resource_id: null,
  detail: null,
  ip_address: '127.0.0.1',
  timestamp: '2026-01-01T00:00:00Z',
  user_email: adminUser.email,
};

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ ok: true })),

  http.get('/api/auth/me', () => HttpResponse.json(adminUser)),

  http.get('/api/surveys', () => HttpResponse.json([survey])),
  http.get('/api/surveys/:id', () => HttpResponse.json(survey)),

  http.get('/api/users', () => HttpResponse.json([adminUser])),

  http.get('/api/departments', () => HttpResponse.json([department])),

  http.get('/api/analytics', () =>
    HttpResponse.json({
      totalSurveys: 1,
      totalResponses: 1,
      completionRate: 1,
    }),
  ),

  http.get('/api/responses', () => HttpResponse.json([response])),

  http.get('/api/audit-logs', () => HttpResponse.json([auditLog])),
];
