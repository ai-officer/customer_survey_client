import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: number;
  /** Darken the tile and invert mark colors when placed on dark surfaces. */
  inverted?: boolean;
  className?: string;
}

/**
 * Identity mark: a single upright "C" in Instrument Sans on a dark tile with
 * an accent dot. Uses the brand typography so the mark and the wordmark
 * stay coherent at all sizes.
 */
export function BrandMark({ size = 36, inverted = false, className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-md',
        inverted ? 'bg-sidebar-fg' : 'bg-foreground',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="font-sans font-bold leading-none"
        style={{
          fontSize: size * 0.55,
          color: inverted ? 'var(--sidebar-bg)' : 'var(--primary)',
          letterSpacing: '-0.04em',
          marginTop: -1,
        }}
      >
        C
      </span>
      <span
        className="absolute rounded-full"
        style={{
          bottom: size * 0.12,
          right: size * 0.12,
          width: size * 0.13,
          height: size * 0.13,
          background: inverted ? 'var(--sidebar-bg)' : 'var(--primary)',
        }}
      />
    </span>
  );
}

/** Small wordmark: mark + stacked brand name. Used in sidebar / mobile header. */
export function BrandLockup({
  inverted = false,
  compact = false,
  size = 32,
}: {
  inverted?: boolean;
  compact?: boolean;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={size} inverted={inverted} />
      {!compact && (
        <span className="leading-tight">
          <span
            className={cn(
              'block text-[14px] font-semibold tracking-tight',
              inverted ? 'text-[color:var(--sidebar-fg)]' : 'text-foreground',
            )}
          >
            Customer Survey
          </span>
          <span
            className={cn(
              'block text-[10.5px] font-medium uppercase tracking-[0.11em] mt-0.5',
              inverted ? 'text-[color:var(--sidebar-muted-fg)]' : 'text-muted-foreground',
            )}
          >
            Global Officium
          </span>
        </span>
      )}
    </span>
  );
}
