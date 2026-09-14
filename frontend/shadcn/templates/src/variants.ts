/**
 * INTERNAL CODE — safe to edit.
 *
 * House variant definitions expressed with `cva`, the same mechanism
 * shadcn/ui uses. Defining them here (rather than inside each component) means
 * a component's look is data, not markup, and can be reused by any renderer.
 *
 * Upstream reference for the variant naming convention:
 *   frontend/shadcn/upstream/ui (registry button/badge definitions).
 *
 * These are OUR tokens. Upstream sync never rewrites this file.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  // base: applied to every button regardless of variant
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ' +
    'text-sm font-medium transition-colors focus-visible:outline-none ' +
    'focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none ' +
    'disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        default: 'h-9 px-4 py-2',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

/**
 * Status badge used by our dashboards. Deliberately aligned with the chart
 * palette in @engineering-library/chartjs-examples so a "warning" badge and a
 * "warning" series read as the same thing.
 */
export const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      tone: {
        neutral: 'border-transparent bg-secondary text-secondary-foreground',
        info: 'border-transparent bg-blue-500/15 text-blue-600',
        success: 'border-transparent bg-emerald-500/15 text-emerald-600',
        warning: 'border-transparent bg-amber-500/15 text-amber-600',
        danger: 'border-transparent bg-red-500/15 text-red-600',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type StatusBadgeVariantProps = VariantProps<typeof statusBadgeVariants>;
