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
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h1 className="display text-[32px] text-foreground leading-tight">{title}</h1>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-1.5 max-w-lg">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
