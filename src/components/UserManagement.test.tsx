import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import UserManagement from './UserManagement';
import { server } from '../../tests/server';
import { renderWithProviders } from '../../tests/test-utils';
import type { User } from '../types';

const adminFixture: User = {
  id: 'user-admin-1',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
  is_active: true,
};

const activeManager: User = {
  id: 'user-manager-1',
  email: 'manager@example.com',
  full_name: 'Manager Active',
  role: 'manager',
  is_active: true,
};

const inactiveManager: User = {
  id: 'user-manager-2',
  email: 'inactive@example.com',
  full_name: 'Manager Inactive',
  role: 'manager',
  is_active: false,
};

function useUserListHandler(users: User[]) {
  server.use(
    http.get('/api/users', () => HttpResponse.json(users)),
  );
}

describe('UserManagement', () => {
  // jsdom does not implement window.confirm; the component calls it for deactivate.
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('renders all three users with role badge and status', async () => {
    useUserListHandler([adminFixture, activeManager, inactiveManager]);

    renderWithProviders(<UserManagement />, {
      auth: 'admin',
      route: '/settings/users',
    });

    // Wait for the loading row to disappear and rows to render.
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // All three names render.
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Manager Active')).toBeInTheDocument();
    expect(screen.getByText('Manager Inactive')).toBeInTheDocument();

    // Role badges: one "admin", two "manager".
    expect(screen.getAllByText('admin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('manager').length).toBe(2);

    // Status badges: two active rows, one deactivated row.
    expect(screen.getAllByText('active').length).toBe(2);
    expect(screen.getByText('deactivated')).toBeInTheDocument();
  });

  it('opens add-user modal, validates required fields, and prepends new user on POST', async () => {
    const user = userEvent.setup();
    useUserListHandler([adminFixture]);

    let postedBody: any = null;
    server.use(
      http.post('/api/users', async ({ request }) => {
        postedBody = await request.json();
        const created: User = {
          id: 'user-new-1',
          email: postedBody.email,
          full_name: postedBody.full_name,
          role: postedBody.role,
          is_active: true,
        };
        // After save, the component re-fetches /api/users — return the new user too.
        useUserListHandler([created, adminFixture]);
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    renderWithProviders(<UserManagement />, { auth: 'admin', route: '/settings/users' });

    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());

    // Open the modal.
    await user.click(screen.getByRole('button', { name: /new user/i }));

    // Modal heading is visible.
    expect(await screen.findByRole('heading', { name: /create user/i })).toBeInTheDocument();

    // Required-field validation: clicking submit with empty fields should NOT POST.
    const submit = screen.getByRole('button', { name: /create user/i });
    await user.click(submit);
    // Modal still open, no POST happened.
    expect(postedBody).toBeNull();
    expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument();

    // Fill the form.
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'New Person');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');

    // Submit succeeds.
    await user.click(submit);

    await waitFor(() => {
      expect(postedBody).toEqual({
        email: 'new@example.com',
        full_name: 'New Person',
        role: 'manager',
        password: 'secret123',
      });
    });

    // Modal closes and the new user appears (prepended in the refreshed list).
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create user/i })).not.toBeInTheDocument();
    });
    expect(await screen.findByText('New Person')).toBeInTheDocument();
  });

  it('opens edit form prefilled with user data and submits PUT', async () => {
    const user = userEvent.setup();
    useUserListHandler([adminFixture, activeManager]);

    let putBody: any = null;
    let putUrl: string | null = null;
    server.use(
      http.put('/api/users/:id', async ({ request, params }) => {
        putUrl = `/api/users/${params.id}`;
        putBody = await request.json();
        const updated: User = {
          ...activeManager,
          full_name: putBody.full_name,
          role: putBody.role,
        };
        useUserListHandler([adminFixture, updated]);
        return HttpResponse.json(updated);
      }),
    );

    renderWithProviders(<UserManagement />, { auth: 'admin', route: '/settings/users' });

    await waitFor(() => expect(screen.getByText('Manager Active')).toBeInTheDocument());

    // Find the manager row, click its Edit pencil.
    const managerRow = screen.getByText('Manager Active').closest('tr')!;
    const editBtn = within(managerRow).getByRole('button', { name: /edit/i });
    await user.click(editBtn);

    // Modal opens in edit mode with prefilled name.
    expect(await screen.findByRole('heading', { name: /edit user/i })).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Manager Active');

    // Email field is hidden in edit mode (only shown for create).
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();

    // Update the name and save.
    await user.clear(nameInput);
    await user.type(nameInput, 'Manager Renamed');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(putUrl).toBe(`/api/users/${activeManager.id}`);
      expect(putBody).toMatchObject({
        full_name: 'Manager Renamed',
        role: 'manager',
      });
    });

    // The list refreshes and shows the renamed user.
    expect(await screen.findByText('Manager Renamed')).toBeInTheDocument();
  });

  it('confirms then DELETEs and updates the row to inactive', async () => {
    const user = userEvent.setup();
    useUserListHandler([adminFixture, activeManager]);

    let deleteUrl: string | null = null;
    server.use(
      http.delete('/api/users/:id', ({ params }) => {
        deleteUrl = `/api/users/${params.id}`;
        // After deactivation, server reflects is_active: false.
        useUserListHandler([
          adminFixture,
          { ...activeManager, is_active: false },
        ]);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<UserManagement />, { auth: 'admin', route: '/settings/users' });

    await waitFor(() => expect(screen.getByText('Manager Active')).toBeInTheDocument());

    const row = screen.getByText('Manager Active').closest('tr')!;
    const deactivateBtn = within(row).getByRole('button', { name: /deactivate/i });

    await user.click(deactivateBtn);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0]?.[0]).toMatch(/deactivate/i);

    await waitFor(() => {
      expect(deleteUrl).toBe(`/api/users/${activeManager.id}`);
    });

    // The row updates to show "deactivated" and hides the deactivate icon.
    await waitFor(() => {
      const updatedRow = screen.getByText('Manager Active').closest('tr')!;
      expect(within(updatedRow).getByText('deactivated')).toBeInTheDocument();
      expect(within(updatedRow).queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
    });
  });
});
