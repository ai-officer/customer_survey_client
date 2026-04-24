import * as React from 'react';
import { ChevronLeft, ChevronRight } from '../../lib/icons';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Optional: expose page-size selector. Omit to hide. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Controls the spacing treatment. 'footer' adds a top border + muted bg
   *  (sits inside a Card below a Table). 'inline' keeps it transparent. */
  variant?: 'footer' | 'inline';
  className?: string;
}

/**
 * Enterprise pagination strip: "1–10 of 23" range label, optional
 * rows-per-page select, numbered page buttons with ellipsis, prev/next.
 * Uses mono numerals (Geist Mono via .num) and tokens throughout.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  variant = 'footer',
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (clamped - 1) * pageSize + 1;
  const end = Math.min(clamped * pageSize, total);

  const buttons = getPageButtons(clamped, totalPages);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 px-4 py-2.5',
        variant === 'footer' && 'border-t border-border bg-secondary/30',
        className,
      )}
    >
      <div className="eyebrow flex items-center gap-1">
        <span>Showing</span>
        <span className="num text-foreground">{start}</span>
        <span>–</span>
        <span className="num text-foreground">{end}</span>
        <span>of</span>
        <span className="num text-foreground">{total}</span>
      </div>

      <div className="flex items-center gap-3">
        {onPageSizeChange && pageSizeOptions.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="eyebrow">rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-card px-2 pr-6 text-[12px] num text-foreground outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background appearance-none cursor-pointer bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundPosition: 'right 6px center',
              }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-0.5">
          <PageNav
            disabled={clamped <= 1}
            onClick={() => onPageChange(clamped - 1)}
            label="Previous page"
          >
            <ChevronLeft size={14} />
          </PageNav>

          {buttons.map((btn, i) =>
            btn === 'ellipsis' ? (
              <span
                key={`e${i}`}
                className="w-6 text-center num text-[12px] text-muted-foreground/70 select-none"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={btn}
                type="button"
                onClick={() => onPageChange(btn)}
                className={cn(
                  'h-7 min-w-7 px-1.5 rounded-md num text-[12px] transition-colors',
                  btn === clamped
                    ? 'bg-foreground text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
                aria-label={`Page ${btn}`}
                aria-current={btn === clamped ? 'page' : undefined}
              >
                {btn}
              </button>
            ),
          )}

          <PageNav
            disabled={clamped >= totalPages}
            onClick={() => onPageChange(clamped + 1)}
            label="Next page"
          >
            <ChevronRight size={14} />
          </PageNav>
        </div>
      </div>
    </div>
  );
}

function PageNav({
  disabled, onClick, label, children,
}: {
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
        'text-muted-foreground hover:bg-secondary hover:text-foreground',
        'disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed',
      )}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function getPageButtons(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', total];
  }
  if (current >= total - 3) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

/** Slice data for the current page. Convenience for client-side pagination. */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
