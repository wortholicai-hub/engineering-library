import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  email,
  password,
  slug,
  paginationQuery,
  parseEnv,
  parseOrThrow,
  toFieldErrors,
  DEFAULT_PAGE_SIZE,
} from './schemas.js';

describe('email', () => {
  it('normalises what it accepts', () => {
    expect(email.parse('  Ada@Example.COM ')).toBe('ada@example.com');
  });

  it('rejects a non-address with our message, not Zod default text', () => {
    const result = email.safeParse('ada@');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('Enter a valid email address');
  });
});

describe('password', () => {
  it('accepts a long mixed password', () => {
    expect(password.safeParse('correcthorseBattery9').success).toBe(true);
  });

  it.each([
    ['short1A', 'Use at least 12 characters'],
    ['alllowercase1234', 'Mix upper and lower case'],
    ['NoDigitsInHereAtAll', 'Include at least one number'],
  ])('rejects %s', (value, message) => {
    const result = password.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(message);
  });
});

describe('slug', () => {
  it.each(['team', 'my-team-2'])('accepts %s', (value) => {
    expect(slug.safeParse(value).success).toBe(true);
  });

  it.each(['My-Team', 'double--hyphen', '-leading', 'trailing-'])('rejects %s', (value) => {
    expect(slug.safeParse(value).success).toBe(false);
  });
});

describe('paginationQuery', () => {
  it('coerces query strings and applies defaults', () => {
    expect(paginationQuery.parse({ page: '3' })).toEqual({
      page: 3,
      pageSize: DEFAULT_PAGE_SIZE,
      order: 'asc',
    });
  });

  it('refuses a page size big enough to dump the whole table', () => {
    expect(paginationQuery.safeParse({ pageSize: '5000' }).success).toBe(false);
  });
});

describe('toFieldErrors', () => {
  const schema = z.object({
    name: z.string().min(1, 'Required'),
    address: z.object({ postcode: z.string().min(1, 'Postcode required') }),
  });

  it('keys messages by dotted path, ready for React Hook Form', () => {
    const result = schema.safeParse({ name: '', address: { postcode: '' } });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error)).toEqual({
        name: 'Required',
        'address.postcode': 'Postcode required',
      });
    }
  });

  it('keeps only the first message per field', () => {
    const strict = z.object({ pin: z.string().min(4, 'Too short').regex(/^\d+$/, 'Digits only') });
    const result = strict.safeParse({ pin: 'ab' });
    if (!result.success) expect(toFieldErrors(result.error).pin).toBe('Too short');
  });
});

describe('parseOrThrow', () => {
  const schema = z.object({ port: z.coerce.number().int() });

  it('returns parsed data on success', () => {
    expect(parseOrThrow(schema, { port: '8080' })).toEqual({ port: 8080 });
  });

  it('names the offending field in the message', () => {
    expect(() => parseOrThrow(schema, { port: 'nope' }, 'Config')).toThrowError(/^Config is invalid — port: /);
  });
});

describe('parseEnv', () => {
  const schema = z.object({
    DATABASE_URL: z.string().min(1, 'Required'),
    STRIPE_KEY: z.string().min(1, 'Required'),
  });

  it('reports every missing variable at once, not just the first', () => {
    try {
      parseEnv(schema, {});
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as Error).message).toContain('DATABASE_URL');
      expect((err as Error).message).toContain('STRIPE_KEY');
    }
  });

  it('reads from an explicit source so it is testable without process.env', () => {
    expect(parseEnv(schema, { DATABASE_URL: 'postgres://', STRIPE_KEY: 'sk_test' })).toEqual({
      DATABASE_URL: 'postgres://',
      STRIPE_KEY: 'sk_test',
    });
  });
});
