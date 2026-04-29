import React from 'react';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../tests/test-utils';
import { server } from '../../tests/server';
import Dashboard from './Dashboard';

beforeAll(() => {
  // Radix Select pointer handlers throw in jsdom without these.
  if (!(HTMLElement.prototype as any).hasPointerCapture) {
    (HTMLElement.prototype as any).hasPointerCapture = () => false;
  }
  if (!(HTMLElement.prototype as any).releasePointerCapture) {
    (HTMLElement.prototype as any).releasePointerCapture = () => {};
  }
  if (!(HTMLElement.prototype as any).scrollIntoView) {
    (HTMLElement.prototype as any).scrollIntoView = () => {};
  }

  // Node 22+ ships a `localStorage` global that's a plain Object with no
  // methods, shadowing jsdom's Storage. Replace it so `api.ts` calls work.
  const memStorage = (() => {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
      setItem: (k: string, v: string) => { map.set(k, String(v)); },
      removeItem: (k: string) => { map.delete(k); },
      clear: () => { map.clear(); },
      key: (i: number) => Array.from(map.keys())[i] ?? null,
      get length() { return map.size; },
    } as unknown as Storage;
  })();
  Object.defineProperty(globalThis, 'localStorage', {
    value: memStorage,
    configurable: true,
    writable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: memStorage,
      configurable: true,
      writable: true,
    });
  }
});

// Two surveys so we can pick a non-default option from the selector.
const surveysFixture = [
  {
    id: 'survey-1',
    title: 'Sample Survey',
    description: 'A sample survey',
    status: 'published',
    createdAt: '2026-01-01T00:00:00Z',
    questions: [],
  },
  {
    id: 'survey-2',
    title: 'Onboarding Pulse',
    description: 'Onboarding feedback',
    status: 'published',
    createdAt: '2026-01-01T00:00:00Z',
    questions: [],
  },
];

function mockSurveys() {
  server.use(
    http.get('/api/surveys', () => HttpResponse.json(surveysFixture)),
  );
}

// Records search params of every /api/analytics call; tests assert on the
// returned array.
function spyAnalytics(body: Record<string, any> = {}): URLSearchParams[] {
  const calls: URLSearchParams[] = [];
  server.use(
    http.get('/api/analytics', ({ request }) => {
      calls.push(new URL(request.url).searchParams);
      return HttpResponse.json(body);
    }),
  );
  return calls;
}

beforeEach(() => {
  mockSurveys();
});

describe('Dashboard', () => {
  it('renders KPI tiles with default zero state when analytics returns empty', async () => {
    spyAnalytics({});
    renderWithProviders(<Dashboard />, { auth: 'admin', route: '/' });

    // After load, syncing → live transition confirms request resolved.
    await screen.findByText('live');

    // "Total responses" tile shows 0 once `fmt(undefined) -> 0`.
    const totalLabel = screen.getByText('Total responses');
    const totalCell = totalLabel.parentElement!;
    expect(within(totalCell).getByText('0')).toBeInTheDocument();

    // Completion rate renders as "0%".
    const completionLabel = screen.getByText('Completion rate');
    const completionCell = completionLabel.parentElement!;
    expect(within(completionCell).getByText('0%')).toBeInTheDocument();

    // CSAT and NPS coerce missing values via `Number(stats?.x ?? 0)` →
    // toFixed(1), so empty analytics renders as "0.0".
    const csatLabel = screen.getByText('Avg. CSAT');
    expect(within(csatLabel.parentElement!).getByText('0.0')).toBeInTheDocument();

    const npsLabel = screen.getByText('NPS score');
    expect(within(npsLabel.parentElement!).getByText('0.0')).toBeInTheDocument();
  });

  it('formats KPI values from analytics payload (totalResponses, csat, nps)', async () => {
    spyAnalytics({ totalResponses: 42, csat: 4.2, nps: 33 });
    renderWithProviders(<Dashboard />, { auth: 'admin', route: '/' });

    await screen.findByText('live');

    const totalCell = screen.getByText('Total responses').parentElement!;
    expect(within(totalCell).getByText('42')).toBeInTheDocument();

    // csat: Number(4.2).toFixed(1) === "4.2"
    const csatCell = screen.getByText('Avg. CSAT').parentElement!;
    expect(within(csatCell).getByText('4.2')).toBeInTheDocument();

    // nps: Number(33).toFixed(1) === "33.0", and trend === 'pos' (>= 0)
    // -> renders the emerald dot before "net promoter".
    const npsCell = screen.getByText('NPS score').parentElement!;
    expect(within(npsCell).getByText('33.0')).toBeInTheDocument();
    const subtitle = within(npsCell).getByText('net promoter');
    // The positive trend dot is the previous sibling span with bg-emerald-600.
    const dot = subtitle.previousElementSibling as HTMLElement | null;
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('bg-emerald-600');
  });

  it('toggles between "syncing" and "live" indicator labels around the fetch lifecycle', async () => {
    // Hold the response until we resolve manually so we can observe the
    // syncing state.
    let resolveFn: (value: unknown) => void = () => {};
    const blocker = new Promise((resolve) => { resolveFn = resolve; });
    server.use(
      http.get('/api/analytics', async () => {
        await blocker;
        return HttpResponse.json({ totalResponses: 7 });
      }),
    );

    renderWithProviders(<Dashboard />, { auth: 'admin', route: '/' });

    // While the request is in flight, the eyebrow label reads "syncing".
    expect(await screen.findByText('syncing')).toBeInTheDocument();

    // Release the analytics response.
    resolveFn(undefined);

    // After the request resolves, the label flips to "live".
    await screen.findByText('live');
    expect(screen.queryByText('syncing')).toBeNull();
  });

  it('refetches analytics when the survey selector changes, with survey_id in the query string', async () => {
    const calls = spyAnalytics({});

    renderWithProviders(<Dashboard />, { auth: 'admin', route: '/' });

    await screen.findByText('live');
    await waitFor(() => {
      expect(calls.length).toBeGreaterThanOrEqual(1);
    });
    const initialCalls = calls.length;

    const user = userEvent.setup();

    // Two filter Selects render: status (default "All statuses") and survey
    // (default "All surveys"). Pick the survey one by visible label.
    const triggers = screen.getAllByRole('combobox');
    const surveyTrigger = triggers.find((el) => /All surveys/i.test(el.textContent || ''))!;
    expect(surveyTrigger).toBeDefined();

    await user.click(surveyTrigger);
    const onboardingOption = await screen.findByRole('option', { name: 'Onboarding Pulse' });
    await user.click(onboardingOption);

    await waitFor(() => {
      expect(calls.length).toBeGreaterThan(initialCalls);
    });

    const last = calls[calls.length - 1];
    expect(last.get('survey_id')).toBe('survey-2');
  });

  it('refetches analytics with from/to query params when a date preset is applied', async () => {
    const calls = spyAnalytics({});

    renderWithProviders(<Dashboard />, { auth: 'admin', route: '/' });

    await screen.findByText('live');
    await waitFor(() => {
      expect(calls.length).toBeGreaterThanOrEqual(1);
    });
    const initialCalls = calls.length;

    const user = userEvent.setup();

    const dateTrigger = screen.getByRole('button', { name: /All time/i });
    await user.click(dateTrigger);

    // "Last 7 days" populates both startDate and endDate, which fires the
    // refetch with both start_date and end_date params.
    const last7 = await screen.findByRole('button', { name: 'Last 7 days' });
    await user.click(last7);

    await waitFor(() => {
      expect(calls.length).toBeGreaterThan(initialCalls);
    });

    const last = calls[calls.length - 1];
    expect(last.get('start_date')).toBeTruthy();
    expect(last.get('end_date')).toBeTruthy();
    // start_date should be an ISO string (yyyy-mm-ddT...Z).
    expect(last.get('start_date')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(last.get('end_date')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('renders the Rating distribution card with metadata when rating data is present', async () => {
    spyAnalytics({
      totalResponses: 10,
      ratingDistribution: [
        { rating: 1, count: 1 },
        { rating: 2, count: 0 },
        { rating: 3, count: 2 },
        { rating: 4, count: 3 },
        { rating: 5, count: 4 },
      ],
    });

    renderWithProviders(<Dashboard />, { auth: 'admin', route: '/' });

    await screen.findByText('live');

    expect(screen.getByText('Rating distribution')).toBeInTheDocument();
    // Scope to the rating card — "responses" is also a MiniStat eyebrow
    // under the trend chart.
    const ratingHeading = screen.getByText('Rating distribution');
    const ratingCard = ratingHeading.closest('div')!.parentElement!;
    expect(within(ratingCard).getByText(/responses/i)).toBeInTheDocument();
    expect(within(ratingCard).getByText(/1.{0,2}5/)).toBeInTheDocument();
  });
});
