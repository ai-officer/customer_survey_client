import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker, rangeForPreset } from './DateRangePicker';

// Frozen reference: 2026-04-29 noon UTC. Most preset assertions hold
// regardless of host timezone because the source's day-arithmetic uses
// `setDate(getDate() - N)` which respects local time, and the resulting
// `.toISOString().slice(0,10)` matches as long as the frozen instant
// straddles noon (well clear of midnight in any timezone).
const FROZEN_NOW = new Date('2026-04-29T12:00:00.000Z');

// `thisMonth`/`lastMonth` use `new Date(year, month, 1)` (LOCAL midnight),
// then `toISOString()` (UTC) — so the resulting ISO day depends on host
// offset. Compute expectations the same way the source does so the assertion
// stays correct regardless of the runner's timezone.
function isoForLocalMonthStart(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toISOString().slice(0, 10);
}
function isoForLocalMonthLastDay(year: number, monthIndex: number): string {
  // day 0 of next month = last day of given month
  return new Date(year, monthIndex + 1, 0).toISOString().slice(0, 10);
}

describe('rangeForPreset (pure helper)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('today returns same start/end (today)', () => {
    expect(rangeForPreset('today')).toEqual({
      startDate: '2026-04-29',
      endDate: '2026-04-29',
    });
  });

  it('yesterday returns same start/end (yesterday)', () => {
    expect(rangeForPreset('yesterday')).toEqual({
      startDate: '2026-04-28',
      endDate: '2026-04-28',
    });
  });

  it('7d spans 7 days inclusive ending today', () => {
    // 6 days back + today = 7 days
    expect(rangeForPreset('7d')).toEqual({
      startDate: '2026-04-23',
      endDate: '2026-04-29',
    });
  });

  it('30d spans 30 days inclusive', () => {
    expect(rangeForPreset('30d')).toEqual({
      startDate: '2026-03-31',
      endDate: '2026-04-29',
    });
  });

  it('90d spans 90 days inclusive', () => {
    expect(rangeForPreset('90d')).toEqual({
      startDate: '2026-01-30',
      endDate: '2026-04-29',
    });
  });

  it('thisMonth runs from the 1st of current month to today', () => {
    // Computed to match the source's local-Date construction, regardless
    // of host timezone. (See module comment.)
    const now = new Date();
    expect(rangeForPreset('thisMonth')).toEqual({
      startDate: isoForLocalMonthStart(now.getFullYear(), now.getMonth()),
      endDate: '2026-04-29',
    });
  });

  it('lastMonth runs from the 1st to the last day of previous month', () => {
    const now = new Date();
    expect(rangeForPreset('lastMonth')).toEqual({
      startDate: isoForLocalMonthStart(now.getFullYear(), now.getMonth() - 1),
      endDate: isoForLocalMonthLastDay(now.getFullYear(), now.getMonth() - 1),
    });
  });

  it('all returns empty start/end', () => {
    expect(rangeForPreset('all')).toEqual({ startDate: '', endDate: '' });
  });

  it('custom returns empty start/end (no math performed)', () => {
    expect(rangeForPreset('custom')).toEqual({ startDate: '', endDate: '' });
  });
});

describe('DateRangePicker (component)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the trigger with the current preset label when closed', () => {
    render(
      <DateRangePicker
        value={{ startDate: '', endDate: '', preset: 'all' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /All time/i })).toBeInTheDocument();
    // Menu is closed
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('clicking the trigger reveals the preset menu', () => {
    render(
      <DateRangePicker
        value={{ startDate: '', endDate: '', preset: 'all' }}
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /All time/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
  });

  it('selecting a preset fires onChange with the resolved ISO range and preset key', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        value={{ startDate: '', endDate: '', preset: 'all' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /All time/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      startDate: '2026-04-23',
      endDate: '2026-04-29',
      preset: '7d',
    });
  });

  it('selecting today closes the menu after firing onChange', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        value={{ startDate: '', endDate: '', preset: 'all' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /All time/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenCalledWith({
      startDate: '2026-04-29',
      endDate: '2026-04-29',
      preset: 'today',
    });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('selecting custom keeps menu open and reveals two date inputs', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        value={{ startDate: '', endDate: '', preset: 'all' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /All time/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Custom range' }));
    // onChange fired with preset 'custom'
    expect(onChange).toHaveBeenCalledWith({
      startDate: '',
      endDate: '',
      preset: 'custom',
    });
  });

  it('custom mode renders two ISO date inputs synced with value', () => {
    render(
      <DateRangePicker
        value={{ startDate: '2026-04-01', endDate: '2026-04-15', preset: 'custom' }}
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Apr 1, 2026/ }));
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    expect(dateInputs.length).toBe(2);
    expect(dateInputs[0].value).toBe('2026-04-01');
    expect(dateInputs[1].value).toBe('2026-04-15');
  });

  it('custom Apply button fires onChange with the typed range', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        value={{ startDate: '2026-04-01', endDate: '2026-04-15', preset: 'custom' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Apr 1, 2026/ }));
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-02-10' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-02-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({
      startDate: '2026-02-10',
      endDate: '2026-02-20',
      preset: 'custom',
    });
  });

  it('custom Apply with empty range collapses to "all"', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        value={{ startDate: '', endDate: '', preset: 'custom' }}
        onChange={onChange}
      />,
    );
    // 'custom' with empty range: trigger label uses preset label
    fireEvent.click(screen.getByRole('button', { name: /Custom range/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({
      startDate: '',
      endDate: '',
      preset: 'all',
    });
  });

  it('Clear empties the custom inputs without closing the menu', () => {
    render(
      <DateRangePicker
        value={{ startDate: '2026-04-01', endDate: '2026-04-15', preset: 'custom' }}
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Apr 1, 2026/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    expect(dateInputs[0].value).toBe('');
    expect(dateInputs[1].value).toBe('');
    // Menu still open
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
