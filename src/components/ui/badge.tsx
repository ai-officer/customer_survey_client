import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium tracking-wide uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-secondary text-foreground',
        primary: 'border-primary/30 bg-primary/10 text-foreground',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        warning: 'border-amber-300 bg-amber-100 text-amber-900',
        destructive: 'border-red-200 bg-red-50 text-red-700',
        outline: 'border-border bg-transparent text-muted-foreground',
        live: 'border-transparent bg-transparent text-foreground gap-1.5 pl-1',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
