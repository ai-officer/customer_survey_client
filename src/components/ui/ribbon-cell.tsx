import * as React from 'react';
import { cn } from '@/lib/utils';

interface RibbonCellProps {
  label: string;
  value?: React.ReactNode;
  subtitle?: string;
  trend?: 'pos' | 'neg';
  /** When provided, replaces the default `.num` value rendering — used for cells that show a Rating bar etc. */
  children?: React.ReactNode;
  className?: string;
}

export function RibbonCell({
  label, value, subtitle, trend, children, className,
}: RibbonCellProps) {
  return (
    <div className={cn('px-5 py-5 flex flex-col gap-1.5', className)}>
      <div className="eyebrow">{label}</div>
      {children ?? (
        <div className="num text-[26px] font-semibold text-foreground leading-none mt-1">
          {value}
        </div>
      )}
      {subtitle && (
        <div className="text-[11.5px] text-muted-foreground mt-1 flex items-center gap-1.5">
          {trend === 'pos' && <span className="h-1 w-1 rounded-full bg-emerald-600" aria-hidden />}
          {trend === 'neg' && <span className="h-1 w-1 rounded-full bg-amber-500" aria-hidden />}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
