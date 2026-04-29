import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { server } from '../../tests/server';
import { AuthContext } from '@/context/AuthContext';
import SurveyForm from './SurveyForm';
import type { Survey } from '../types';

beforeAll(() => {
  // Map-backed localStorage shim (see SurveyList.test for the why).
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      get length() {
        return store.size;
      },
    },
  });

  // Radix Select polyfills for jsdom.
  if (!(HTMLElement.prototype as any).hasPointerCapture) {
    (HTMLElement.prototype as any).hasPointerCapture = () => false;
  }
  if (!(HTMLElement.prototype as any).releasePointerCapture) {
    (HTMLElement.prototype as any).releasePointerCapture = () => {};
  }
  if (!(HTMLElement.prototype as any).scrollIntoView) {
    (HTMLElement.prototype as any).scrollIntoView = () => {};
  }
});

const adminAuth = {
  user: {
    id: 'user-admin-1',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin' as const,
  },
  token: 'test-admin-token',
  login: async () => {},
  logout: () => {},
  isAdmin: true,
  isManager: false,
  canEdit: true,
};

/**
 * Render SurveyForm under a MemoryRouter so that `useParams()` resolves
 * the route's `:id`. We can't use `renderWithProviders` from test-utils
 * because we need real route params, not just a starting URL.
 */
function renderSurveyForm({
  path,
  route,
}: {
  path: string;
  route: string;
}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={adminAuth}>
        <Routes>
          <Route path={path} element={<SurveyForm />} />
          <Route path="/surveys" element={<div>SURVEYS_LIST</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('SurveyForm', () => {
  it('disables Save until the title input has a non-empty value', async () => {
    server.use(http.get('/api/departments', () => HttpResponse.json([])));
    const user = userEvent.setup();

    renderSurveyForm({ path: '/surveys/:id', route: '/surveys/new' });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    const titleInput = screen.getByPlaceholderText(/untitled survey/i);
    await user.type(titleInput, 'My new survey');
    expect(saveButton).not.toBeDisabled();

    // Whitespace-only title is treated as empty.
    await user.clear(titleInput);
    await user.type(titleInput, '   ');
    expect(saveButton).toBeDisabled();
  });

  it('adds a new question of each type when its add-button is clicked', async () => {
    server.use(http.get('/api/departments', () => HttpResponse.json([])));
    const user = userEvent.setup();

    renderSurveyForm({ path: '/surveys/:id', route: '/surveys/new' });

    // New surveys start with one default rating question, so we measure
    // deltas relative to that baseline.
    const countQuestions = () =>
      screen.getAllByText(/^Q\d{2}$/).length;
    const initialCount = countQuestions();
    expect(initialCount).toBe(1);

    const addTile = (label: RegExp) => {
      const labelEl = screen.getAllByText(label).slice(-1)[0];
      const btn = labelEl.closest('button');
      if (!btn) throw new Error(`No add tile button for ${label}`);
      return btn;
    };

    await user.click(addTile(/^short answer$/i));
    await waitFor(() => expect(countQuestions()).toBe(initialCount + 1));

    await user.click(addTile(/^rating scale$/i));
    await waitFor(() => expect(countQuestions()).toBe(initialCount + 2));

    await user.click(addTile(/^multiple choice$/i));
    await waitFor(() => expect(countQuestions()).toBe(initialCount + 3));

    await user.click(addTile(/^yes \/ no$/i));
    await waitFor(() => expect(countQuestions()).toBe(initialCount + 4));
  });

  it('toggles the Required checkbox on a question', async () => {
    server.use(http.get('/api/departments', () => HttpResponse.json([])));
    const user = userEvent.setup();

    renderSurveyForm({ path: '/surveys/:id', route: '/surveys/new' });

    // Default rating question exists with `required: true`, so the
    // checkbox is initially checked.
    const requiredCheckboxes = await screen.findAllByLabelText(/required/i);
    const firstRequired = requiredCheckboxes[0] as HTMLInputElement;
    expect(firstRequired.checked).toBe(true);

    await user.click(firstRequired);
    expect(firstRequired.checked).toBe(false);

    await user.click(firstRequired);
    expect(firstRequired.checked).toBe(true);
  });

  it('removes a question when its remove button is clicked', async () => {
    server.use(http.get('/api/departments', () => HttpResponse.json([])));
    const user = userEvent.setup();

    renderSurveyForm({ path: '/surveys/:id', route: '/surveys/new' });

    expect(screen.getAllByText(/^Q\d{2}$/).length).toBe(1);

    // Add a second question so we can verify removal of one without
    // leaving the questions list empty.
    const addShortAnswer = screen
      .getAllByText(/^short answer$/i)
      .slice(-1)[0]
      .closest('button')!;
    await user.click(addShortAnswer);
    await waitFor(() =>
      expect(screen.getAllByText(/^Q\d{2}$/).length).toBe(2),
    );

    const removeButtons = screen.getAllByRole('button', {
      name: /remove question/i,
    });
    await user.click(removeButtons[removeButtons.length - 1]);
    await waitFor(() =>
      expect(screen.getAllByText(/^Q\d{2}$/).length).toBe(1),
    );
  });

  it('saves a NEW survey via POST /api/surveys with the form payload', async () => {
    let postedBody: any = null;
    server.use(
      http.get('/api/departments', () => HttpResponse.json([])),
      http.post('/api/surveys', async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json({
          id: 'new-1',
          ...(postedBody as object),
          createdAt: '2026-04-01T00:00:00Z',
          questions: (postedBody as any).questions ?? [],
        });
      }),
    );
    const user = userEvent.setup();

    renderSurveyForm({ path: '/surveys/:id', route: '/surveys/new' });

    const titleInput = screen.getByPlaceholderText(/untitled survey/i);
    await user.type(titleInput, 'Quarterly NPS');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => expect(postedBody).not.toBeNull());
    // Default status for a new survey is 'draft'.
    expect(postedBody).toMatchObject({
      title: 'Quarterly NPS',
      status: 'draft',
    });
    expect(Array.isArray(postedBody.questions)).toBe(true);
    expect(postedBody.questions.length).toBeGreaterThan(0);

    await waitFor(() =>
      expect(screen.getByText('SURVEYS_LIST')).toBeInTheDocument(),
    );
  });

  it('saves an EDIT via PUT /api/surveys/:id with the loaded payload', async () => {
    const existing: Survey = {
      id: 'survey-42',
      title: 'Existing survey',
      description: 'desc',
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      startDate: null,
      endDate: null,
      createdBy: 'user-admin-1',
      departmentId: null,
      departmentName: null,
      customer: null,
      questions: [
        {
          id: 'q1',
          type: 'text',
          text: 'How are things?',
          required: false,
        },
      ],
      createdByName: 'Admin User',
      responseCount: 0,
    };

    let putBody: any = null;
    let putHit = false;
    server.use(
      http.get('/api/departments', () => HttpResponse.json([])),
      http.get('/api/surveys/:id', () => HttpResponse.json(existing)),
      http.put('/api/surveys/:id', async ({ request }) => {
        putHit = true;
        putBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    const user = userEvent.setup();
    renderSurveyForm({
      path: '/surveys/edit/:id',
      route: '/surveys/edit/survey-42',
    });

    await screen.findByDisplayValue('Existing survey');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(putHit).toBe(true));
    expect(putBody).toMatchObject({
      title: 'Existing survey',
      status: 'published',
    });
    expect(Array.isArray(putBody.questions)).toBe(true);
    expect(putBody.questions[0]).toMatchObject({
      id: 'q1',
      type: 'text',
      text: 'How are things?',
    });
  });
});
