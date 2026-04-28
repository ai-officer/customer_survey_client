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
      {/* Layer 1 — GCG dual-color gradient wash: red glow upper-left, blue glow
         lower-right, plus a soft blurred white-ish highlight in the middle. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(circle at 18% 22%, oklch(0.62 0.22 25 / 0.22) 0%, transparent 42%)',
            'radial-gradient(circle at 82% 78%, oklch(0.55 0.20 264 / 0.22) 0%, transparent 48%)',
            'radial-gradient(circle at 50% 50%, oklch(0.97 0.005 250 / 0.06) 0%, transparent 55%)',
            'linear-gradient(135deg, oklch(0.62 0.22 25 / 0.04) 0%, transparent 50%, oklch(0.55 0.20 264 / 0.04) 100%)',
          ].join(','),
        }}
        aria-hidden
      />

      {/* Soft blurred white spotlight — gives the "blurred light" QA asked for */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full pointer-events-none"
        style={{
          background: 'oklch(1 0 0 / 0.06)',
          filter: 'blur(80px)',
        }}
        aria-hidden
      />

      {/* Layer 2 — repeating 'gcg' wordmark texture across the panel.
         Two staggered rows per tile (offset second row) so it reads as a
         woven pattern rather than a stiff grid. Uses SVG <pattern> so the
         tile resolves once and tiles across at any panel size. */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      >
        <defs>
          <pattern
            id="gcg-watermark"
            x="0"
            y="0"
            width="120"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <text
              x="0"
              y="22"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: '0.02em',
                fill: 'oklch(0.62 0.22 25)',
                fillOpacity: 0.07,
              }}
            >
              GCG
            </text>
            <text
              x="60"
              y="54"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: '0.02em',
                fill: 'oklch(0.55 0.20 264)',
                fillOpacity: 0.07,
              }}
            >
              GCG
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gcg-watermark)" />
      </svg>

      {/* Layer 3 — thin concentric arc decoration (top-right quadrant) */}
      <svg
        className="absolute -top-40 -right-40 pointer-events-none"
        width="420"
        height="420"
        viewBox="0 0 100 100"
        aria-hidden
      >
        {[30, 38, 46, 54].map((r, i) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={i % 2 === 0 ? 'oklch(0.62 0.22 25)' : 'oklch(0.55 0.20 264)'}
            strokeOpacity={0.12}
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
            Global Comfort
          </div>
          <div className="display text-[52px] leading-[0.95] tracking-tight text-[color:var(--sidebar-muted-fg)]">
            Group.
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
        <div className="text-[14px] font-semibold text-foreground">Global Comfort Group</div>
        <div className="eyebrow mt-0.5">customer survey system</div>
      </div>
    </div>
  );
}
