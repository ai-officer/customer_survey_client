import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Right-side slot for primary CTAs / status indicators. */
  action?: React.ReactNode;
  className?: string;
}

export function PageHero({ eyebrow, title, description, action, className }: PageHeroProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          {/* GCG dual-color section accent — small red bar + smaller blue dot */}
          <span
            className="inline-block h-[3px] w-5 rounded-full"
            style={{ background: 'var(--gcg-red)' }}
            aria-hidden
          />
          <span
            className="inline-block h-[3px] w-2 rounded-full"
            style={{ background: 'var(--gcg-blue)' }}
            aria-hidden
          />
          <div className="eyebrow">{eyebrow}</div>
        </div>
        <h1 className="display text-[32px] text-foreground leading-tight">{title}</h1>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-1.5 max-w-lg">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
