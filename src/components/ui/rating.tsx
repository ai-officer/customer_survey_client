import { cn } from '@/lib/utils';

interface RatingProps {
  value: number | null | undefined;
  max?: number;
  /** Show the numeric value after the segments. */
  showValue?: boolean;
  /** 'sm' for inline table use, 'md' for KPI / card use. */
  size?: 'sm' | 'md';
  /** Optional aria-label override. */
  label?: string;
  className?: string;
}

/**
 * Signature domain primitive: renders a rating as a 5-segment bar.
 * Partial fill for fractional values (e.g. 4.3 -> last segment 30% filled).
 * Used everywhere a numeric rating appears — the one element that makes
 * this unmistakably a survey/feedback tool rather than a generic dashboard.
 */
export function Rating({
  value,
  max = 5,
  showValue = true,
  size = 'md',
  label,
  className,
}: RatingProps) {
  const empty = value == null;
  const safe = empty ? 0 : Math.max(0, Math.min(max, value));
  const segmentFills = Array.from({ length: max }, (_, i) =>
    Math.max(0, Math.min(1, safe - i)),
  );

  const segHeight = size === 'sm' ? 'h-[5px]' : 'h-[7px]';
  const segWidth = size === 'sm' ? 'w-[10px]' : 'w-3';
  const valueClass = size === 'sm' ? 'text-[11px]' : 'text-[12.5px]';

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      role="meter"
      aria-label={label ?? `Rating ${empty ? 'unavailable' : `${safe} out of ${max}`}`}
      aria-valuenow={empty ? undefined : safe}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span className="inline-flex gap-[2px]">
        {segmentFills.map((fill, i) => (
          <span
            key={i}
            className={cn(
              segHeight,
              segWidth,
              'rounded-[1.5px] overflow-hidden relative',
              empty ? 'bg-border' : 'bg-muted',
            )}
          >
            <span
              className="absolute inset-0 bg-primary origin-left transition-transform duration-300"
              style={{ transform: `scaleX(${fill})` }}
            />
          </span>
        ))}
      </span>
      {showValue && (
        <span className={cn('num text-muted-foreground', valueClass)}>
          {empty ? '—' : safe.toFixed(1)}
        </span>
      )}
    </span>
  );
}

/**
 * Inline counter bar — N dots where active are filled. Used for response
 * counts, question counts, anything that benefits from glance-able density.
 */
export function DotCount({
  value,
  max = 10,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(max, value));
  return (
    <span className={cn('inline-flex items-center gap-[3px]', className)}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 w-1 rounded-full',
            i < safe ? 'bg-primary' : 'bg-border',
          )}
        />
      ))}
    </span>
  );
}
