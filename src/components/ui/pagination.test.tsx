import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Pagination, paginate } from './pagination';

describe('paginate helper', () => {
  it('returns the correct slice for page 1', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(paginate(items, 1, 3)).toEqual([1, 2, 3]);
  });

  it('returns the correct slice for an interior page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(paginate(items, 3, 3)).toEqual([7, 8, 9]);
  });

  it('returns a partial slice for the last page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(paginate(items, 4, 3)).toEqual([10]);
  });

  it('returns empty array beyond the last page', () => {
    const items = [1, 2, 3];
    expect(paginate(items, 5, 3)).toEqual([]);
  });
});

describe('Pagination', () => {
  describe('range label', () => {
    it('shows "Showing 1–10 of 23" on page 1, pageSize 10, total 23', () => {
      const { container } = render(
        <Pagination page={1} pageSize={10} total={23} onPageChange={() => {}} />,
      );
      // The eyebrow row contains start, end, and total numbers.
      const eyebrow = container.querySelector('.eyebrow') as HTMLElement;
      expect(eyebrow).not.toBeNull();
      const numbers = Array.from(
        eyebrow.querySelectorAll('.num.text-foreground'),
      ).map((el) => el.textContent);
      expect(numbers).toEqual(['1', '10', '23']);
    });

    it('shows last-page partial range correctly', () => {
      const { container } = render(
        <Pagination page={3} pageSize={10} total={23} onPageChange={() => {}} />,
      );
      const eyebrow = container.querySelector('.eyebrow') as HTMLElement;
      const numbers = Array.from(
        eyebrow.querySelectorAll('.num.text-foreground'),
      ).map((el) => el.textContent);
      // Showing 21–23 of 23
      expect(numbers).toEqual(['21', '23', '23']);
    });

    it('shows 0–0 of 0 on empty list', () => {
      const { container } = render(
        <Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />,
      );
      const eyebrow = container.querySelector('.eyebrow') as HTMLElement;
      const numbers = Array.from(
        eyebrow.querySelectorAll('.num.text-foreground'),
      ).map((el) => el.textContent);
      expect(numbers).toEqual(['0', '0', '0']);
    });
  });

  describe('prev/next buttons', () => {
    it('Prev is disabled at page 1', () => {
      render(
        <Pagination page={1} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      expect(screen.getByLabelText('Previous page')).toBeDisabled();
    });

    it('Next is enabled when not on last page', () => {
      render(
        <Pagination page={1} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      expect(screen.getByLabelText('Next page')).not.toBeDisabled();
    });

    it('Next is disabled on the last page', () => {
      render(
        <Pagination page={5} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      expect(screen.getByLabelText('Next page')).toBeDisabled();
    });

    it('Prev is enabled past page 1', () => {
      render(
        <Pagination page={3} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
    });

    it('clicking Next jumps to page+1', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          page={2}
          pageSize={10}
          total={50}
          onPageChange={onPageChange}
        />,
      );
      fireEvent.click(screen.getByLabelText('Next page'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('clicking Prev jumps to page-1', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          page={3}
          pageSize={10}
          total={50}
          onPageChange={onPageChange}
        />,
      );
      fireEvent.click(screen.getByLabelText('Previous page'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('numbered page buttons', () => {
    it('renders all pages when totalPages <= 7', () => {
      render(
        <Pagination page={1} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      // 5 pages (50/10): 1..5
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByLabelText(`Page ${i}`)).toBeInTheDocument();
      }
    });

    it('marks the current page with aria-current="page"', () => {
      render(
        <Pagination page={3} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      const current = screen.getByLabelText('Page 3');
      expect(current).toHaveAttribute('aria-current', 'page');
      expect(screen.getByLabelText('Page 1')).not.toHaveAttribute('aria-current');
    });

    it('clicking a numbered page fires onPageChange', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          page={1}
          pageSize={10}
          total={50}
          onPageChange={onPageChange}
        />,
      );
      fireEvent.click(screen.getByLabelText('Page 4'));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('renders ellipsis when totalPages > 7', () => {
      const { container } = render(
        <Pagination page={1} pageSize={10} total={200} onPageChange={() => {}} />,
      );
      // 20 pages → low slice [1,2,3,4,5,'ellipsis',20]
      expect(screen.getByLabelText('Page 20')).toBeInTheDocument();
      // ellipsis chars present
      expect(container.textContent).toContain('…');
    });

    it('renders both ellipsis when on a middle page', () => {
      const { container } = render(
        <Pagination page={10} pageSize={10} total={200} onPageChange={() => {}} />,
      );
      // [1,'ellipsis',9,10,11,'ellipsis',20]
      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 9')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 10')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 11')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 20')).toBeInTheDocument();
      // Two ellipsis spans
      const ellipsisCount = (container.textContent?.match(/…/g) ?? []).length;
      expect(ellipsisCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('page-size selector', () => {
    it('does not render when onPageSizeChange is not supplied', () => {
      const { container } = render(
        <Pagination page={1} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      expect(container.querySelector('select')).toBeNull();
    });

    it('renders when onPageSizeChange is supplied', () => {
      const onPageSizeChange = vi.fn();
      const { container } = render(
        <Pagination
          page={1}
          pageSize={10}
          total={50}
          onPageChange={() => {}}
          onPageSizeChange={onPageSizeChange}
        />,
      );
      const select = container.querySelector('select');
      expect(select).not.toBeNull();
      expect((select as HTMLSelectElement).value).toBe('10');
    });

    it('changing the page-size select fires onPageSizeChange with a number', () => {
      const onPageSizeChange = vi.fn();
      const { container } = render(
        <Pagination
          page={1}
          pageSize={10}
          total={500}
          onPageChange={() => {}}
          onPageSizeChange={onPageSizeChange}
        />,
      );
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '50' } });
      expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });

    it('honors custom pageSizeOptions', () => {
      const onPageSizeChange = vi.fn();
      const { container } = render(
        <Pagination
          page={1}
          pageSize={5}
          total={500}
          onPageChange={() => {}}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 15, 30]}
        />,
      );
      const select = container.querySelector('select') as HTMLSelectElement;
      const opts = within(select).getAllByRole('option').map((o) => o.textContent);
      expect(opts).toEqual(['5', '15', '30']);
    });
  });

  describe('clamp behavior', () => {
    it('clamps page input below 1 to 1 (Prev disabled, current is page 1)', () => {
      render(
        <Pagination page={0} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      expect(screen.getByLabelText('Previous page')).toBeDisabled();
      expect(screen.getByLabelText('Page 1')).toHaveAttribute('aria-current', 'page');
    });

    it('clamps page input above totalPages to last (Next disabled)', () => {
      render(
        <Pagination page={99} pageSize={10} total={50} onPageChange={() => {}} />,
      );
      expect(screen.getByLabelText('Next page')).toBeDisabled();
      expect(screen.getByLabelText('Page 5')).toHaveAttribute('aria-current', 'page');
    });
  });
});
