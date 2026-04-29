import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import DepartmentManagement from './DepartmentManagement';
import { server } from '../../tests/server';
import { renderWithProviders } from '../../tests/test-utils';
import type { Department } from '../types';

const engineering: Department = {
  id: 'dept-1',
  name: 'Engineering',
  createdAt: '2026-01-01T00:00:00Z',
};

const finance: Department = {
  id: 'dept-2',
  name: 'Finance',
  createdAt: '2026-01-15T00:00:00Z',
};

function useDepartmentList(depts: Department[]) {
  server.use(
    http.get('/api/departments', () => HttpResponse.json(depts)),
  );
}

function useEmptySurveys() {
  server.use(http.get('/api/surveys', () => HttpResponse.json([])));
}

describe('DepartmentManagement', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    useEmptySurveys();
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('renders the list of departments', async () => {
    useDepartmentList([engineering, finance]);

    renderWithProviders(<DepartmentManagement />, {
      auth: 'admin',
      route: '/settings/departments',
    });

    // List renders both departments (alphabetised: Engineering, Finance).
    expect((await screen.findAllByText('Engineering')).length).toBeGreaterThan(0);
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('creates a department: enter name, submit, POST /api/departments, new row appears', async () => {
    const user = userEvent.setup();
    useDepartmentList([engineering]);

    let postedBody: any = null;
    server.use(
      http.post('/api/departments', async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json(
          {
            id: 'dept-new',
            name: postedBody.name,
            createdAt: '2026-04-29T00:00:00Z',
          },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(<DepartmentManagement />, {
      auth: 'admin',
      route: '/settings/departments',
    });

    await waitFor(() => expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0));

    // Open the add form.
    await user.click(screen.getByRole('button', { name: /new department/i }));

    const input = await screen.findByPlaceholderText(/department name/i);
    await user.type(input, 'Legal');

    // The "Create" button (with the Plus icon) submits the form.
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(postedBody).toEqual({ name: 'Legal' });
    });

    // The new department appears (in both the list and the auto-selected detail panel).
    await waitFor(() => {
      expect(screen.getAllByText('Legal').length).toBeGreaterThan(0);
    });
  });

  it('edits a department name and PUTs to /api/departments/:id', async () => {
    const user = userEvent.setup();
    useDepartmentList([engineering, finance]);

    let putUrl: string | null = null;
    let putBody: any = null;
    server.use(
      http.put('/api/departments/:id', async ({ request, params }) => {
        putUrl = `/api/departments/${params.id}`;
        putBody = await request.json();
        return HttpResponse.json({
          id: params.id,
          name: putBody.name,
          createdAt: engineering.createdAt,
        });
      }),
    );

    renderWithProviders(<DepartmentManagement />, {
      auth: 'admin',
      route: '/settings/departments',
    });

    await waitFor(() => expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0));

    // Engineering should be auto-selected (first in sort order). Click Rename.
    await user.click(screen.getByRole('button', { name: /rename/i }));

    // Find the rename input in the detail panel — it's autoFocused after Rename.
    const renameInputs = await screen.findAllByDisplayValue('Engineering');
    // The detail-panel input appears after clicking Rename; pick the autofocused one.
    const detailInput = renameInputs.find(el => el.tagName === 'INPUT' && (el as HTMLInputElement).matches(':focus'))
      ?? (renameInputs[renameInputs.length - 1] as HTMLInputElement);

    await user.clear(detailInput);
    await user.type(detailInput, 'Engineering Renamed');

    // Save button in the rename strip.
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(putUrl).toBe('/api/departments/dept-1');
      expect(putBody).toEqual({ name: 'Engineering Renamed' });
    });

    // The list and detail panel both update with the new name.
    await waitFor(() => {
      expect(screen.getAllByText('Engineering Renamed').length).toBeGreaterThan(0);
    });
  });

  it('deletes a department: confirm, DELETE /api/departments/:id, row removed', async () => {
    const user = userEvent.setup();
    useDepartmentList([engineering, finance]);

    let deleteUrl: string | null = null;
    server.use(
      http.delete('/api/departments/:id', ({ params }) => {
        deleteUrl = `/api/departments/${params.id}`;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<DepartmentManagement />, {
      auth: 'admin',
      route: '/settings/departments',
    });

    await waitFor(() => expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0));

    // Engineering is selected by default; click Delete in detail header.
    const deleteBtn = screen.getByRole('button', { name: /delete department/i });
    await user.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0]?.[0]).toMatch(/delete department/i);

    await waitFor(() => {
      expect(deleteUrl).toBe('/api/departments/dept-1');
    });

    // Engineering removed from the left list; Finance remains.
    await waitFor(() => {
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Finance').length).toBeGreaterThan(0);
  });
});
