import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '../../tests/server';
import SurveyResponse from './SurveyResponse';
import type { Survey } from '../types';

beforeAll(() => {
  // Map-backed localStorage shim for the api wrapper.
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
});

const surveyFixture: Survey = {
  id: 'survey-abc',
  title: 'Customer Pulse',
  description: 'Tell us how it went.',
  status: 'published',
  createdAt: '2026-01-01T00:00:00Z',
  startDate: null,
  endDate: null,
  createdBy: null,
  departmentId: null,
  departmentName: null,
  customer: null,
  questions: [
    {
      id: 'q-text',
      type: 'text',
      text: 'Anything else?',
      required: true,
    },
    {
      id: 'q-rating',
      type: 'rating',
      text: 'How would you rate us?',
      required: false,
    },
    {
      id: 'q-mc',
      type: 'multiple-choice',
      text: 'Which channel?',
      required: false,
      options: ['Email', 'Phone', 'Chat'],
    },
    {
      id: 'q-bool',
      type: 'boolean',
      text: 'Would you recommend us?',
      required: false,
    },
  ],
};

/**
 * Variant of `surveyFixture` with the (only) required question stripped,
 * used by the submit-flow tests so they can submit with empty answers.
 */
const surveyWithoutRequired: Survey = {
  ...surveyFixture,
  questions: surveyFixture.questions.filter((q) => !q.required),
};

/**
 * Render the public survey-taker at `/s/:id`. The component reads `:id`
 * via `useParams` and `?t=` via `useSearchParams`.
 */
function renderResponseAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/s/:id" element={<SurveyResponse />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SurveyResponse', () => {
  it('renders an input for each of the four question types', async () => {
    server.use(
      http.get('/api/surveys/:id', () => HttpResponse.json(surveyFixture)),
      // No URL token => the component mints a scan token.
      http.post('/api/surveys/:id/scan-token', () =>
        HttpResponse.json({ token: 'minted-scan-token' }),
      ),
    );

    renderResponseAt('/s/survey-abc');

    await screen.findByRole('heading', { name: /customer pulse/i });

    expect(screen.getByPlaceholderText(/your answer/i)).toBeInTheDocument();

    for (const n of [1, 2, 3, 4, 5]) {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`rate ${n} out of 5`, 'i'),
        }),
      ).toBeInTheDocument();
    }

    expect(screen.getByRole('button', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Phone' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('blocks submit when a required text question is unanswered', async () => {
    let postedBody: any = null;
    server.use(
      http.get('/api/surveys/:id', () => HttpResponse.json(surveyFixture)),
      http.post('/api/surveys/:id/scan-token', () =>
        HttpResponse.json({ token: 'minted-scan-token' }),
      ),
      http.post('/api/responses', async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    const user = userEvent.setup();
    renderResponseAt('/s/survey-abc');

    await screen.findByRole('heading', { name: /customer pulse/i });

    // Submit anonymously so the name-required branch doesn't trip first.
    await user.click(screen.getByLabelText(/submit anonymously/i));

    await user.click(
      screen.getByRole('button', { name: /submit response/i }),
    );

    // The textarea has the native `required` attribute, so the browser
    // refuses to submit and no POST is issued. Non-text question types
    // aren't gated client-side today.
    const textarea = screen.getByPlaceholderText(
      /your answer/i,
    ) as HTMLTextAreaElement;
    expect(textarea.required).toBe(true);
    expect(postedBody).toBeNull();

    // Once we fill the required text question, the POST goes through.
    await user.type(
      screen.getByPlaceholderText(/your answer/i),
      'Everything was great',
    );
    await user.click(
      screen.getByRole('button', { name: /submit response/i }),
    );

    await waitFor(() => expect(postedBody).not.toBeNull());
    expect(postedBody.answers['q-text']).toBe('Everything was great');
  });

  it('forwards the ?t= invite token in the submit payload', async () => {
    let postedBody: any = null;
    server.use(
      http.get('/api/surveys/:id', () =>
        HttpResponse.json(surveyWithoutRequired),
      ),
      http.post('/api/responses', async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
      // The component should NOT mint a scan-token when ?t= is present,
      // but adding the handler keeps the test resilient to future
      // changes and avoids a spurious unhandled-request error.
      http.post('/api/surveys/:id/scan-token', () =>
        HttpResponse.json({ token: 'unexpected-mint' }),
      ),
    );

    const user = userEvent.setup();
    renderResponseAt('/s/survey-abc?t=invite-xyz');

    await screen.findByRole('heading', { name: /customer pulse/i });

    await user.click(screen.getByLabelText(/submit anonymously/i));
    await user.click(
      screen.getByRole('button', { name: /submit response/i }),
    );

    await waitFor(() => expect(postedBody).not.toBeNull());
    expect(postedBody.token).toBe('invite-xyz');
    expect(postedBody.surveyId).toBe('survey-abc');
    expect(postedBody.is_anonymous).toBe(true);
  });

  it('mints a per-scan token when no ?t= is present', async () => {
    let postedBody: any = null;
    let scanTokenHits = 0;
    server.use(
      http.get('/api/surveys/:id', () =>
        HttpResponse.json(surveyWithoutRequired),
      ),
      http.post('/api/surveys/:id/scan-token', () => {
        scanTokenHits += 1;
        return HttpResponse.json({ token: 'minted-scan-token' });
      }),
      http.post('/api/responses', async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    const user = userEvent.setup();
    renderResponseAt('/s/survey-abc');

    await screen.findByRole('heading', { name: /customer pulse/i });

    // Wait for the mint to settle so the token is available at submit.
    await waitFor(() => expect(scanTokenHits).toBeGreaterThan(0));

    await user.click(screen.getByLabelText(/submit anonymously/i));
    await user.click(
      screen.getByRole('button', { name: /submit response/i }),
    );

    await waitFor(() => expect(postedBody).not.toBeNull());
    expect(postedBody.token).toBe('minted-scan-token');
  });

  it('shows the "Thank you" success screen after a successful submit', async () => {
    server.use(
      http.get('/api/surveys/:id', () =>
        HttpResponse.json(surveyWithoutRequired),
      ),
      http.post('/api/surveys/:id/scan-token', () =>
        HttpResponse.json({ token: 'minted-scan-token' }),
      ),
      http.post('/api/responses', () => HttpResponse.json({ ok: true })),
    );

    const user = userEvent.setup();
    renderResponseAt('/s/survey-abc?t=abc');

    await screen.findByRole('heading', { name: /customer pulse/i });

    await user.click(screen.getByLabelText(/submit anonymously/i));
    await user.click(
      screen.getByRole('button', { name: /submit response/i }),
    );

    // Form is replaced by the thank-you screen.
    await screen.findByRole('heading', { name: /thank you!?/i });
    expect(
      screen.queryByRole('button', { name: /submit response/i }),
    ).not.toBeInTheDocument();
  });
});
