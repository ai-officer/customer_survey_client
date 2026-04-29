import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: number;
  /** Darken the tile and invert mark colors when placed on dark surfaces. */
  inverted?: boolean;
  className?: string;
}

/**
 * Identity mark: the dual-color "GCG" monogram on a tile. G (blue) · C (red) ·
 * G (blue) — uses the brand typography so the mark and wordmark stay coherent
 * at all sizes. Tile aspect is wider than tall to fit the three glyphs.
 */
export function BrandMark({ size = 36, inverted = false, className }: BrandMarkProps) {
  // Wider tile so the three glyphs read clearly with breathing room.
  const width = size * 2.1;
  // Inverted (on dark sidebar): tile is transparent so it inherits the
  // surrounding sidebar surface (incl. atmospheric overlay) seamlessly.
  // Default (on light surface): dark tile with full-saturation brand glyphs.
  const tileBg = inverted ? 'transparent' : 'var(--foreground)';
  const blue = inverted ? 'var(--sidebar-accent-secondary)' : 'var(--gcg-blue)';
  const red = inverted ? 'oklch(0.74 0.20 25)' : 'var(--gcg-red)';
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-md',
        className,
      )}
      style={{ width, height: size, paddingInline: size * 0.15, background: tileBg }}
      aria-hidden
    >
      <span
        className="font-sans font-bold leading-none"
        style={{
          fontSize: size * 0.6,
          letterSpacing: '-0.03em',
          marginTop: -1,
        }}
      >
        <span style={{ color: blue }}>G</span>
        <span style={{ color: red }}>C</span>
        <span style={{ color: blue }}>G</span>
      </span>
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
            Global Comfort Group
          </span>
        </span>
      )}
    </span>
  );
}
