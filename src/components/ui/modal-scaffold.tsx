import * as React from 'react';
import { motion } from 'motion/react';
import { X } from '@/lib/icons';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-4xl',
};

/**
 * Stacking tier for the modal. Most modals live at the default `z-50` /
 * `/60` backdrop tint. A few (delete confirms, password change) sit on top
 * of other modals or portaled menus, so they bump up.
 */
type ModalTier = 'default' | 'over' | 'top';
const TIER_CLASS: Record<ModalTier, { z: string; backdrop: string }> = {
  default: { z: 'z-50', backdrop: 'bg-[color:var(--sidebar-bg)]/60' },
  over:    { z: 'z-60', backdrop: 'bg-[color:var(--sidebar-bg)]/60' },
  top:     { z: 'z-70', backdrop: 'bg-[color:var(--sidebar-bg)]/70' },
};

interface ModalScaffoldProps {
  onClose: () => void;
  /** Small uppercase eyebrow rendered above the title (e.g. "account · edit"). */
  eyebrow?: string;
  title?: string;
  /** Set true to omit the built-in header AND padding/spacing (caller renders their own layout). */
  bare?: boolean;
  size?: ModalSize;
  /** When set, overrides the default padding behaviour (true = `p-6 space-y-5`, false = no padding). Defaults to !bare. */
  padded?: boolean;
  /** Stacking tier — controls z-index and backdrop opacity. */
  tier?: ModalTier;
  /** Allow the modal body to scroll when content exceeds viewport height. */
  scrollable?: boolean;
  /** Extra classes on the inner motion card. */
  className?: string;
  /**
   * Override the default mount/animate/exit transition. The default mirrors the
   * legacy `{ opacity: 0, scale: 0.96, y: 8 }` → `{ 1, 1, 0 }` arc.
   */
  initial?: React.ComponentProps<typeof motion.div>['initial'];
  animate?: React.ComponentProps<typeof motion.div>['animate'];
  exit?: React.ComponentProps<typeof motion.div>['exit'];
  children: React.ReactNode;
}

/**
 * Shared overlay + motion card chrome used by every modal in the app.
 *
 * Rendering pattern: callers wrap this in `<AnimatePresence>{cond && <ModalScaffold ...>...</ModalScaffold>}</AnimatePresence>`
 * so exit animations fire on unmount, exactly matching the legacy hand-rolled
 * modal blocks.
 */
export function ModalScaffold({
  onClose,
  eyebrow,
  title,
  bare = false,
  size = 'md',
  padded,
  tier = 'default',
  scrollable = false,
  className,
  initial = { opacity: 0, scale: 0.96, y: 8 },
  animate = { opacity: 1, scale: 1, y: 0 },
  exit = { opacity: 0, scale: 0.96, y: 8 },
  children,
}: ModalScaffoldProps) {
  const isPadded = padded ?? !bare;
  const tierClass = TIER_CLASS[tier];

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm',
        tierClass.z,
        tierClass.backdrop,
        scrollable && 'overflow-y-auto',
      )}
    >
      <motion.div
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{ duration: 0.15 }}
        className={cn(
          'bg-card border border-border rounded-xl shadow-pop w-full',
          SIZE_CLASS[size],
          isPadded && 'p-6 space-y-5',
          className,
        )}
      >
        {!bare && (title || eyebrow) && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              {title && (
                <h3 className="heading text-[18px] font-semibold mt-1 leading-tight truncate">
                  {title}
                </h3>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors -mr-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}
