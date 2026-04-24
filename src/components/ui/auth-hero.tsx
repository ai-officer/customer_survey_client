import { BrandMark, BrandLockup } from './brand-mark';

/**
 * Editorial hero panel for auth pages (Login, Register).
 * Dark ink surface with:
 *   - gradient mesh wash (teal glow, soft)
 *   - oversized watermark of the brand "C" mark as atmosphere
 *   - centered company wordmark + product subtitle
 *   - top brand lockup + bottom attribution row
 *
 * Drop-in: place <AuthHero /> as the left column of a 2-col grid.
 * Swap the watermark layer with a real photograph later by replacing
 * the inline SVG below with an <img src={...} /> + optional overlay.
 */
export function AuthHero() {
  return (
    <aside className="sidebar-dark relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
      {/* Layer 1 — soft gradient mesh wash (two radial glows + a faint linear) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(circle at 18% 22%, oklch(0.78 0.13 175 / 0.10) 0%, transparent 38%)',
            'radial-gradient(circle at 82% 78%, oklch(0.78 0.13 175 / 0.07) 0%, transparent 45%)',
            'linear-gradient(135deg, transparent 0%, oklch(0.78 0.13 175 / 0.02) 70%, transparent 100%)',
          ].join(','),
        }}
        aria-hidden
      />

      {/* Layer 2 — oversized "C" watermark, a brand crest behind the wordmark */}
      <svg
        className="absolute right-[-120px] top-1/2 -translate-y-1/2 pointer-events-none"
        width="720"
        height="720"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <defs>
          <linearGradient id="watermark-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.13 175)" stopOpacity="0.045" />
            <stop offset="100%" stopColor="oklch(0.78 0.13 175)" stopOpacity="0.015" />
          </linearGradient>
        </defs>
        <text
          x="50"
          y="78"
          textAnchor="middle"
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 94,
            letterSpacing: '-0.06em',
            fill: 'url(#watermark-grad)',
          }}
        >
          C
        </text>
      </svg>

      {/* Layer 3 — thin concentric arc decoration (top-right quadrant) */}
      <svg
        className="absolute -top-40 -right-40 pointer-events-none"
        width="420"
        height="420"
        viewBox="0 0 100 100"
        aria-hidden
      >
        {[30, 38, 46, 54].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="oklch(0.78 0.13 175)"
            strokeOpacity={0.08}
            strokeWidth={0.3}
          />
        ))}
      </svg>

      {/* Content — top brand lockup */}
      <div className="relative">
        <BrandLockup inverted size={38} />
      </div>

      {/* Content — center wordmark composition */}
      <div className="relative flex flex-col items-start gap-5 max-w-md">
        {/* small banner strip */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-surface)]/40">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--sidebar-accent)' }}
            aria-hidden
          />
          <span className="eyebrow text-[color:var(--sidebar-muted-fg)]">
            enterprise edition · 2026
          </span>
        </div>

        <div>
          <div className="display text-[52px] leading-[0.95] tracking-tight text-[color:var(--sidebar-fg)]">
            Global Officium
          </div>
          <div className="display text-[52px] leading-[0.95] tracking-tight text-[color:var(--sidebar-muted-fg)]">
            Limited.
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span
            className="h-px w-8"
            style={{ background: 'var(--sidebar-accent)' }}
            aria-hidden
          />
          <span className="eyebrow text-[color:var(--sidebar-muted-fg)]">
            customer survey system
          </span>
        </div>
      </div>

      {/* Content — attribution row */}
      <div className="relative flex items-end justify-between gap-6 text-[color:var(--sidebar-muted-fg)]">
        <div className="eyebrow">© {new Date().getFullYear()} · all rights reserved</div>
        <div className="eyebrow">Manila · Philippines</div>
      </div>
    </aside>
  );
}

/** Tiny header strip shown on mobile where the split-screen collapses. */
export function AuthHeroMobile() {
  return (
    <div className="md:hidden flex items-center gap-2.5 pb-2">
      <BrandMark size={34} />
      <div className="leading-tight">
        <div className="text-[14px] font-semibold text-foreground">Global Officium Ltd.</div>
        <div className="eyebrow mt-0.5">customer survey system</div>
      </div>
    </div>
  );
}
