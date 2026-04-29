import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Rating, DotCount } from './rating';

describe('Rating', () => {
  it('renders 5 segments by default', () => {
    render(<Rating value={3.5} />);
    const segmentRow = screen.getByRole('meter').querySelector(
      'span:first-child',
    ) as HTMLElement;
    expect(segmentRow.children.length).toBe(5);
  });

  it('respects custom max', () => {
    render(<Rating value={2} max={10} showValue={false} />);
    const segmentRow = screen.getByRole('meter').querySelector(
      'span:first-child',
    ) as HTMLElement;
    expect(segmentRow.children.length).toBe(10);
  });

  it('exposes aria-valuenow when value is set', () => {
    render(<Rating value={4.3} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '4.3');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '5');
  });

  it('renders the numeric value rounded to one decimal by default', () => {
    render(<Rating value={4.27} />);
    expect(screen.getByText('4.3')).toBeInTheDocument();
  });

  it('hides the numeric value when showValue=false', () => {
    render(<Rating value={3.0} showValue={false} />);
    expect(screen.queryByText('3.0')).toBeNull();
  });

  it('shows em dash and omits aria-valuenow when value is null', () => {
    render(<Rating value={null} />);
    const meter = screen.getByRole('meter');
    expect(meter).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows em dash when value is undefined', () => {
    render(<Rating value={undefined} />);
    const meter = screen.getByRole('meter');
    expect(meter).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('clamps values above max', () => {
    render(<Rating value={42} max={5} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('clamps negative values to 0', () => {
    render(<Rating value={-3} max={5} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('renders fractional fill via inline transform on segment fill', () => {
    const { container } = render(<Rating value={2.5} max={5} showValue={false} />);
    // The fill is the absolutely positioned span inside each segment
    const fills = container.querySelectorAll<HTMLElement>('span[style*="scaleX"]');
    expect(fills.length).toBe(5);
    // Segment 1: full
    expect(fills[0].getAttribute('style')).toContain('scaleX(1)');
    // Segment 3: half (2.5 - 2 = 0.5)
    expect(fills[2].getAttribute('style')).toContain('scaleX(0.5)');
    // Segment 5: empty
    expect(fills[4].getAttribute('style')).toContain('scaleX(0)');
  });

  it('uses sm size classes', () => {
    render(<Rating value={3} size="sm" showValue />);
    const segmentRow = screen.getByRole('meter').querySelector(
      'span:first-child',
    ) as HTMLElement;
    const segment = segmentRow.children[0] as HTMLElement;
    expect(segment.className).toContain('h-[5px]');
    expect(segment.className).toContain('w-[10px]');
  });

  it('uses md size classes by default', () => {
    render(<Rating value={3} />);
    const segmentRow = screen.getByRole('meter').querySelector(
      'span:first-child',
    ) as HTMLElement;
    const segment = segmentRow.children[0] as HTMLElement;
    expect(segment.className).toContain('h-[7px]');
    expect(segment.className).toContain('w-3');
  });

  it('uses custom aria-label when provided', () => {
    render(<Rating value={3} label="Customer satisfaction" />);
    expect(screen.getByLabelText('Customer satisfaction')).toBeInTheDocument();
  });

  it('default aria-label reflects value', () => {
    render(<Rating value={4} />);
    expect(screen.getByLabelText('Rating 4 out of 5')).toBeInTheDocument();
  });

  it('default aria-label says unavailable when null', () => {
    render(<Rating value={null} />);
    expect(screen.getByLabelText('Rating unavailable')).toBeInTheDocument();
  });
});

describe('DotCount', () => {
  it('renders max=10 dots by default', () => {
    const { container } = render(<DotCount value={3} />);
    const dots = container.querySelectorAll('span > span');
    expect(dots.length).toBe(10);
  });

  it('fills exactly value dots with primary class', () => {
    const { container } = render(<DotCount value={3} max={5} />);
    const dots = container.querySelectorAll<HTMLElement>('span > span');
    expect(dots.length).toBe(5);
    expect(dots[0].className).toContain('bg-primary');
    expect(dots[1].className).toContain('bg-primary');
    expect(dots[2].className).toContain('bg-primary');
    expect(dots[3].className).toContain('bg-border');
    expect(dots[4].className).toContain('bg-border');
  });

  it('clamps value above max', () => {
    const { container } = render(<DotCount value={50} max={5} />);
    const dots = container.querySelectorAll<HTMLElement>('span > span');
    dots.forEach((dot) => expect(dot.className).toContain('bg-primary'));
  });

  it('clamps negative value to 0', () => {
    const { container } = render(<DotCount value={-5} max={3} />);
    const dots = container.querySelectorAll<HTMLElement>('span > span');
    dots.forEach((dot) => expect(dot.className).toContain('bg-border'));
  });
});
