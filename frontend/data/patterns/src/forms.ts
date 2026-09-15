/**
 * INTERNAL CODE — safe to edit.
 *
 * React Hook Form wired to Zod, the way we do it everywhere:
 *
 *   const form = useForm(zodForm(loginSchema, { email: '', password: '' }));
 *
 * One schema validates the form in the browser AND the payload on the server,
 * so the two can never disagree.
 *
 * Upstream reference: frontend/data/upstream/react-hook-form (pinned).
 */

import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Path, UseFormProps, UseFormSetError } from 'react-hook-form';
import type { z } from 'zod';

/**
 * Form options for a Zod-validated form.
 *
 * `mode: 'onTouched'` is the house default: validating on every keystroke
 * shouts at someone halfway through typing their email, and validating only on
 * submit hides the problem until the end.
 */
export function zodForm<TInput extends FieldValues, TOutput = TInput>(
  schema: z.ZodType<TOutput, TInput>,
  defaultValues: TInput,
  overrides: Omit<UseFormProps<TInput>, 'resolver' | 'defaultValues'> = {},
): UseFormProps<TInput> {
  return {
    // The form is generic over the schema's *input* type: what the user types
    // is not always what the schema outputs (coercion, defaults, transforms
    // such as trim/lowercase). The cast is contained here so no caller needs
    // one — the public signature above stays precise.
    resolver: zodResolver(
      schema as unknown as z.ZodType<FieldValues, FieldValues>,
    ) as unknown as UseFormProps<TInput>['resolver'],
    defaultValues: defaultValues as UseFormProps<TInput>['defaultValues'],
    mode: 'onTouched',
    ...overrides,
  };
}

/**
 * Push server-side validation errors back onto the right inputs.
 *
 * A server can reject something the client could not know about — an email
 * already registered, a coupon that just expired. Without this the user sees a
 * generic banner and no idea which field to fix.
 *
 * Keys that do not match a field (`_form`, or anything unrecognised) are
 * returned so the caller can show them at form level.
 */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string>,
  knownFields?: readonly Path<T>[],
): string[] {
  const formLevel: string[] = [];
  for (const [field, message] of Object.entries(fieldErrors)) {
    const isKnown = knownFields ? knownFields.includes(field as Path<T>) : field !== '_form';
    if (!isKnown) {
      formLevel.push(message);
      continue;
    }
    setError(field as Path<T>, { type: 'server', message });
  }
  return formLevel;
}

/**
 * The first error message in a form, for a summary banner or a toast.
 * Walks nested error objects, because RHF mirrors the shape of the form.
 */
export function firstErrorMessage(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object') return null;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
    const nested = firstErrorMessage(value);
    if (nested) return nested;
  }
  return null;
}
