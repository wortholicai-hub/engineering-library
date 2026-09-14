/**
 * INTERNAL CODE — safe to edit.
 *
 * The `cn` helper every shadcn/ui component depends on.
 *
 * It does two things that plain string concatenation cannot:
 *   1. clsx  — resolves conditional / array / object class expressions
 *   2. twMerge — resolves *conflicting* Tailwind utilities so the last one
 *      wins (`px-2 px-4` -> `px-4`), which is what makes shadcn components
 *      overridable via a `className` prop.
 *
 * Upstream reference: frontend/shadcn/upstream/ui — see the `lib/utils.ts`
 * file inside each app in that submodule.
 * We keep our own copy rather than importing from the submodule because the
 * submodule is a pnpm monorepo that we deliberately do not build.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };
