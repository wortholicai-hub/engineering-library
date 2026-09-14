import { describe, it, expect } from 'vitest';
import { cn } from './cn.js';
import { buttonVariants, statusBadgeVariants } from './variants.js';

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('supports conditional object syntax', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });

  it('lets a later Tailwind utility override an earlier conflicting one', () => {
    // This is the whole reason twMerge exists — without it the result would
    // be "px-2 px-4" and the winner would depend on CSS source order.
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('keeps non-conflicting utilities from the same family', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('makes components overridable via a className prop', () => {
    const componentClasses = 'bg-primary px-4';
    const userOverride = 'bg-red-500';
    expect(cn(componentClasses, userOverride)).toBe('px-4 bg-red-500');
  });
});

describe('buttonVariants', () => {
  it('applies default variant and size when none given', () => {
    const cls = buttonVariants();
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('h-9 px-4 py-2');
  });

  it('honours an explicit variant', () => {
    expect(buttonVariants({ variant: 'destructive' })).toContain('bg-destructive');
    expect(buttonVariants({ variant: 'ghost' })).not.toContain('bg-primary');
  });

  it('honours an explicit size', () => {
    expect(buttonVariants({ size: 'icon' })).toContain('h-9 w-9');
    expect(buttonVariants({ size: 'lg' })).toContain('px-8');
  });

  it('always includes the shared base classes', () => {
    for (const variant of ['default', 'outline', 'link'] as const) {
      expect(buttonVariants({ variant })).toContain('inline-flex');
      expect(buttonVariants({ variant })).toContain('disabled:opacity-50');
    }
  });
});

describe('statusBadgeVariants', () => {
  it('defaults to the neutral tone', () => {
    expect(statusBadgeVariants()).toContain('bg-secondary');
  });

  it('exposes one class set per tone', () => {
    const tones = ['info', 'success', 'warning', 'danger'] as const;
    const results = tones.map((tone) => statusBadgeVariants({ tone }));
    expect(new Set(results).size).toBe(tones.length);
  });

  it('composes with cn without leaving conflicting utilities', () => {
    const cls = cn(statusBadgeVariants({ tone: 'success' }), 'px-4');
    expect(cls).toContain('px-4');
    expect(cls).not.toContain('px-2.5');
  });
});
