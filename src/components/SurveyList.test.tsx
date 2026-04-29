import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/server';
import { renderWithProviders } from '../../tests/test-utils';
import SurveyList from './SurveyList';
import type { Survey } from '../types';

beforeAll(() => {
  // Node 25 ships a stub `localStorage` global that lacks the standard
  // methods. The api wrapper calls `localStorage.getItem('token')`, so
  // give it a real Map-backed shim for the duration of these tests.
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

  // Radix Select in jsdom needs these to mount without throwing.
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

function makeSurvey(overrides: Partial<Survey>): Survey {
  return {
    id: 'survey-x',
    title: 'A survey',
    description: 'desc',
    status: 'published',
    createdAt: '2026-01-01T00:00:00Z',
    startDate: null,
    endDate: null,
    createdBy: 'user-admin-1',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    customer: null,
    questions: [],
    createdByName: 'Admin User',
    responseCount: 0,
    ...overrides,
  };
}

const fixture: Survey[] = [
  makeSurvey({
    id: 'pub-1',
    title: 'Customer Pulse',
    status: 'published',
    responseCount: 12,
    createdAt: '2026-03-10T00:00:00Z',
  }),
  makeSurvey({
    id: 'draft-1',
    title: 'Onboarding Draft',
    status: 'draft',
    responseCount: 0,
    createdAt: '2026-02-15T00:00:00Z',
  }),
  makeSurvey({
    id: 'arch-1',
    title: 'Legacy NPS',
    status: 'archived',
    responseCount: 7,
    createdAt: '2026-01-05T00:00:00Z',
  }),
];

function useFixtureHandlers() {
  server.use(
    http.get('/api/surveys', () => HttpResponse.json(fixture)),
    http.get('/api/departments', () => HttpResponse.json([])),
  );
}

describe('SurveyList', () => {
  it('filters by tab status', async () => {
    useFixtureHandlers();
    const user = userEvent.setup();
    renderWithProviders(<SurveyList />, { auth: 'admin' });

    // The list renders both a desktop table and a mobile card view (the
    // second is hidden via `md:hidden` but jsdom doesn't apply CSS), so
    // each visible row appears twice in the DOM. Hence `getAllByText`.
    await waitFor(() => {
      expect(screen.getAllByText('Customer Pulse').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Onboarding Draft')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy NPS')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^drafts/i }));
    await waitFor(() => {
      expect(screen.queryByText('Customer Pulse')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Onboarding Draft').length).toBeGreaterThan(0);
    expect(screen.queryByText('Legacy NPS')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^archived/i }));
    await waitFor(() => {
      expect(screen.queryByText('Onboarding Draft')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Legacy NPS').length).toBeGreaterThan(0);
    expect(screen.queryByText('Customer Pulse')).not.toBeInTheDocument();
  });

  it('renders correct counts in the summary ribbon', async () => {
    useFixtureHandlers();
    renderWithProviders(<SurveyList />, { auth: 'admin' });

    // Wait for the surveys fetch to resolve so the ribbon swaps from "—"
    // to the actual counts.
    await waitFor(() =>
      expect(screen.getAllByText('Customer Pulse').length).toBeGreaterThan(0),
    );

    const cellFor = (label: string) => {
      const labelEl = screen.getByText(label, { selector: '.eyebrow' });
      const cell = labelEl.parentElement!;
      return within(cell);
    };

    // 1 published, 1 draft, 1 archived in the fixture.
    expect(cellFor('Active').getByText('1')).toBeInTheDocument();
    expect(cellFor('Drafts').getByText('1')).toBeInTheDocument();
    expect(cellFor('Archived').getByText('1')).toBeInTheDocument();
    // Total responses: 12 + 0 + 7 = 19.
    expect(cellFor('Total responses').getByText('19')).toBeInTheDocument();
  });

  it('filters visible rows when typing into search', async () => {
    server.use(
      http.get('/api/surveys', () =>
        HttpResponse.json([
          makeSurvey({ id: 'a', title: 'Alpha report', status: 'published' }),
          makeSurvey({ id: 'b', title: 'Beta inquiry', status: 'published' }),
        ]),
      ),
      http.get('/api/departments', () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    renderWithProviders(<SurveyList />, { auth: 'admin' });

    await waitFor(() =>
      expect(screen.getAllByText('Alpha report').length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText('Beta inquiry').length).toBeGreaterThan(0);

    const searchInput = screen.getByPlaceholderText(/search surveys/i);
    await user.type(searchInput, 'alpha');

    await waitFor(() => {
      expect(screen.queryByText('Beta inquiry')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Alpha report').length).toBeGreaterThan(0);
  });

  it('toggles ascending/descending when a sort header is clicked', async () => {
    server.use(
      http.get('/api/surveys', () =>
        HttpResponse.json([
          makeSurvey({ id: 'b', title: 'Banana feedback', status: 'published' }),
          makeSurvey({ id: 'a', title: 'Apple insights', status: 'published' }),
          makeSurvey({ id: 'c', title: 'Cherry survey', status: 'published' }),
        ]),
      ),
      http.get('/api/departments', () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    renderWithProviders(<SurveyList />, { auth: 'admin' });

    await waitFor(() =>
      expect(screen.getAllByText('Apple insights').length).toBeGreaterThan(0),
    );

    // Read row order from the desktop table so we don't double-count
    // the mobile card view (which renders the same titles).
    const desktopTable = document.querySelector('table')!;
    const titleHeader = within(desktopTable).getByRole('button', {
      name: /survey/i,
    });

    const titlesInTable = () =>
      Array.from(desktopTable.querySelectorAll('tbody tr td:first-child'))
        .map((cell) => cell.textContent || '')
        .filter((t) => /Apple|Banana|Cherry/.test(t));

    // Ascending after first click: Apple, Banana, Cherry.
    await user.click(titleHeader);
    await waitFor(() => {
      const titles = titlesInTable();
      expect(titles[0]).toMatch(/Apple/);
      expect(titles[titles.length - 1]).toMatch(/Cherry/);
    });

    // Descending after second click: Cherry, Banana, Apple.
    await user.click(titleHeader);
    await waitFor(() => {
      const titles = titlesInTable();
      expect(titles[0]).toMatch(/Cherry/);
      expect(titles[titles.length - 1]).toMatch(/Apple/);
    });
  });

  it('calls /api/surveys/:id/remind and shows the response message via alert', async () => {
    let remindCalled = false;
    server.use(
      http.get('/api/surveys', () =>
        HttpResponse.json([
          makeSurvey({ id: 'pub-1', title: 'Pulse', status: 'published' }),
        ]),
      ),
      http.get('/api/departments', () => HttpResponse.json([])),
      http.post('/api/surveys/:id/remind', ({ params }) => {
        remindCalled = true;
        return HttpResponse.json({
          message: `Reminders queued for ${params.id}`,
        });
      }),
    );

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<SurveyList />, { auth: 'admin' });

    await waitFor(() =>
      expect(screen.getAllByText('Pulse').length).toBeGreaterThan(0),
    );

    // Open a row's overflow menu (multiple exist because of duplicate
    // desktop+mobile views), then click "Send reminders".
    const moreButtons = screen.getAllByRole('button', { name: /more actions/i });
    await user.click(moreButtons[0]);
    const remindersItem = await screen.findByText(/send reminders/i);
    await user.click(remindersItem);

    await waitFor(() => expect(remindCalled).toBe(true));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Reminders queued for pub-1'),
    );

    alertSpy.mockRestore();
  });
});
