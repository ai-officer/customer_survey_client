import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import AuditLogs from './AuditLogs';
import { server } from '../../tests/server';
import { renderWithProviders } from '../../tests/test-utils';
import type { AuditLog } from '../types';

const loginEvent: AuditLog = {
  id: 'audit-login-1',
  user_id: 'user-admin-1',
  action: 'LOGIN',
  resource: 'auth',
  resource_id: null,
  detail: null,
  ip_address: '127.0.0.1',
  timestamp: '2026-01-01T08:00:00Z',
  user_email: 'admin@example.com',
};

const createSurveyEvent: AuditLog = {
  id: 'audit-survey-1',
  user_id: 'user-admin-1',
  action: 'CREATE_SURVEY',
  resource: 'survey',
  resource_id: 'survey-42',
  detail: 'Created “Customer NPS Q1”',
  ip_address: '10.0.0.5',
  timestamp: '2026-02-15T13:30:00Z',
  user_email: 'admin@example.com',
};

const deleteUserEvent: AuditLog = {
  id: 'audit-user-1',
  user_id: 'user-admin-1',
  action: 'DEACTIVATE_USER',
  resource: 'user',
  resource_id: 'user-99',
  detail: 'Deactivated user@example.com',
  ip_address: '10.0.0.7',
  timestamp: '2026-03-10T09:15:00Z',
  user_email: 'manager@example.com',
};

function useAuditLogs(rows: AuditLog[]) {
  server.use(
    http.get('/api/audit-logs', () => HttpResponse.json(rows)),
  );
}

function useAuditLogsCapturingURL(rows: AuditLog[], capture: { lastUrl: string | null }) {
  server.use(
    http.get('/api/audit-logs', ({ request }) => {
      capture.lastUrl = request.url;
      return HttpResponse.json(rows);
    }),
  );
}

describe('AuditLogs', () => {
  it('renders timestamp, actor, action, resource, and IP for each row', async () => {
    useAuditLogs([loginEvent, createSurveyEvent, deleteUserEvent]);

    renderWithProviders(<AuditLogs />, { auth: 'admin', route: '/settings/audit' });

    // Wait for at least one of the rows to render.
    await waitFor(() => {
      expect(screen.getByText('login')).toBeInTheDocument();
    });

    // Action labels (badge text is lowercased with underscores → spaces).
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('create survey')).toBeInTheDocument();
    expect(screen.getByText('deactivate user')).toBeInTheDocument();

    // Actor (user_email).
    expect(screen.getAllByText('admin@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('manager@example.com')).toBeInTheDocument();

    // Resource (capitalised in CSS but text node is the raw value).
    expect(screen.getByText('auth')).toBeInTheDocument();
    expect(screen.getAllByText(/survey/i).length).toBeGreaterThan(0);
    expect(screen.getByText('user')).toBeInTheDocument();

    // IP addresses.
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.7')).toBeInTheDocument();

    // Timestamp is formatted via date-fns (matches "MMM d, yyyy HH:mm:ss").
    // Just check the year and month appear in some cell.
    expect(screen.getByText(/Jan 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Feb 15, 2026/)).toBeInTheDocument();
  });

  it('shows an empty state when MSW returns no logs', async () => {
    useAuditLogs([]);

    renderWithProviders(<AuditLogs />, { auth: 'admin', route: '/settings/audit' });

    expect(await screen.findByText(/no events yet\./i)).toBeInTheDocument();
  });

  it('action filter narrows the visible rows', async () => {
    const user = userEvent.setup();
    useAuditLogs([loginEvent, createSurveyEvent, deleteUserEvent]);

    renderWithProviders(<AuditLogs />, { auth: 'admin', route: '/settings/audit' });

    // Wait for table to populate (all three rows visible).
    await waitFor(() => expect(screen.getByText('login')).toBeInTheDocument());
    expect(screen.getByText('create survey')).toBeInTheDocument();
    expect(screen.getByText('deactivate user')).toBeInTheDocument();

    // The action search filter narrows by free-text on the action name.
    // (The source filters client-side; the GET path stays /api/audit-logs?limit=200.)
    const search = screen.getByPlaceholderText(/search by action, actor, or detail/i);
    await user.type(search, 'login');

    // After filtering, only the LOGIN action row remains; the survey/user
    // action rows are hidden.
    await waitFor(() => {
      expect(screen.queryByText('create survey')).not.toBeInTheDocument();
      expect(screen.queryByText('deactivate user')).not.toBeInTheDocument();
    });
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('issues a GET to /api/audit-logs with a limit query param on mount', async () => {
    const capture = { lastUrl: null as string | null };
    useAuditLogsCapturingURL([loginEvent], capture);

    renderWithProviders(<AuditLogs />, { auth: 'admin', route: '/settings/audit' });

    await waitFor(() => {
      expect(capture.lastUrl).not.toBeNull();
    });

    // The component requests with `?limit=200` to bound the result set.
    const url = new URL(capture.lastUrl!);
    expect(url.pathname).toBe('/api/audit-logs');
    expect(url.searchParams.get('limit')).toBe('200');

    // Search box also acts as a free-text narrowing filter (used to drill down
    // by actor, action, or detail — including timestamp fragments). Typing a
    // string that no row matches collapses the table to the empty filtered state.
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getByText('login')).toBeInTheDocument());

    const search = screen.getByPlaceholderText(/search by action, actor, or detail/i);
    await user.type(search, 'no-such-actor-zzz');

    await waitFor(() => {
      expect(screen.getByText(/no events match these filters\./i)).toBeInTheDocument();
    });
  });
});
