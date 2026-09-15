/**
 * INTERNAL CODE — safe to edit.
 *
 * Reusable Zod schemas and the two helpers every boundary needs: turn a
 * validation failure into field errors a form can render, or into an exception
 * with a useful message.
 *
 * Why these live here: every product re-invents "is this a valid email", a
 * password policy and a pagination query, and each re-invention is subtly
 * different. Import them instead — and if one does not fit, extend it HERE so
 * the next project inherits the fix.
 *
 * Upstream reference for the API: frontend/data/upstream/zod (pinned).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Field-level building blocks
// ---------------------------------------------------------------------------

/**
 * Lower-cased, trimmed email. Store what you validated, not what was typed.
 *
 * Normalise BEFORE validating, hence the pipe: `z.email().trim()` checks the
 * format first and rejects " ada@example.com " — which is what a phone
 * keyboard produces when it appends a space after autocomplete.
 */
export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'Enter a valid email address' }));

/**
 * House password policy: length first, because length is what actually
 * resists guessing; character classes are a secondary control.
 */
export const password = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(200, 'That is longer than we can store')
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v), 'Mix upper and lower case')
  .refine((v) => /\d/.test(v), 'Include at least one number');

/** URL-safe identifier: `my-team-2`. */
export const slug = z
  .string()
  .min(1, 'Required')
  .max(64, 'Too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lower-case letters, numbers and single hyphens');

export const uuid = z.uuid({ message: 'Expected a UUID' });

export const httpUrl = z.url({ message: 'Enter a valid URL' });

/** Money in MINOR units (cents/pence). Never store money as a float. */
export const moneyMinor = z
  .number()
  .int('Amounts are stored in minor units (cents), so this must be a whole number')
  .min(0, 'Cannot be negative');

export const positiveInt = z.number().int().positive();

/** A required free-text field, with the label baked into the message. */
export const requiredText = (label: string, max = 500) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

// ---------------------------------------------------------------------------
// Request-level schemas
// ---------------------------------------------------------------------------

/** How many rows a table asks for when nothing else is specified. */
export const DEFAULT_PAGE_SIZE = 25;
/** Upper bound, so a hand-edited URL cannot ask for the whole table. */
export const MAX_PAGE_SIZE = 100;

/**
 * Query parameters for a paginated, sortable list endpoint.
 *
 * Coerces, because query strings are always strings — `?page=2` must survive
 * the round trip as the number 2.
 */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sort: z.string().min(1).optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;

// ---------------------------------------------------------------------------
// Turning failures into something useful
// ---------------------------------------------------------------------------

/**
 * Flatten a ZodError into `{ fieldName: message }`.
 *
 * One message per field — the first — because that is what a form renders
 * under an input. Nested paths are dotted (`address.postcode`), which is
 * exactly the key React Hook Form uses.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_form';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Parse, or throw an Error whose message names every offending field.
 *
 * For boundaries with no UI to render errors into: server handlers, scripts,
 * queue consumers. `label` is what the message starts with, so failures are
 * greppable in logs.
 */
export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  value: unknown,
  label = 'Input',
): z.infer<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const detail = Object.entries(toFieldErrors(result.error))
    .map(([field, message]) => `${field}: ${message}`)
    .join('; ');
  throw new Error(`${label} is invalid — ${detail}`);
}

/**
 * Validate environment variables at startup rather than discovering a missing
 * one during a request. Fails with every problem listed at once, because
 * fixing deployment config one variable per deploy is miserable.
 */
export function parseEnv<S extends z.ZodType>(
  schema: S,
  source: Record<string, string | undefined> = readProcessEnv(),
): z.infer<S> {
  return parseOrThrow(schema, source, 'Environment');
}

/**
 * `process.env` without depending on Node's type definitions — this package is
 * imported by browser bundles too, where `process` does not exist.
 */
function readProcessEnv(): Record<string, string | undefined> {
  const runtime = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return runtime.process?.env ?? {};
}
