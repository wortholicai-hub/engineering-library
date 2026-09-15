import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { applyServerErrors, firstErrorMessage, zodForm } from './forms.js';
import { email, password } from './schemas.js';

const loginSchema = z.object({ email, password });
type Login = z.input<typeof loginSchema>;

describe('zodForm', () => {
  it('returns options React Hook Form can consume directly', () => {
    const options = zodForm(loginSchema, { email: '', password: '' });
    expect(typeof options.resolver).toBe('function');
    expect(options.defaultValues).toEqual({ email: '', password: '' });
    expect(options.mode).toBe('onTouched');
  });

  it('validates through the same schema the server would use', async () => {
    const { resolver } = zodForm(loginSchema, { email: '', password: '' });
    const result = await resolver!(
      { email: 'nope', password: 'short' } as Login,
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(result.errors).toHaveProperty('email');
    expect(result.errors).toHaveProperty('password');
  });

  it('accepts valid input and hands back parsed values', async () => {
    const { resolver } = zodForm(loginSchema, { email: '', password: '' });
    const result = await resolver!(
      { email: ' Ada@Example.com ', password: 'correcthorseBattery9' } as Login,
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({ email: 'ada@example.com' });
  });

  it('lets a caller override the validation mode without losing the resolver', () => {
    const options = zodForm(loginSchema, { email: '', password: '' }, { mode: 'onSubmit' });
    expect(options.mode).toBe('onSubmit');
    expect(typeof options.resolver).toBe('function');
  });
});

describe('applyServerErrors', () => {
  it('sets each field error on the form', () => {
    const setError = vi.fn();
    const unhandled = applyServerErrors<Login>(setError, { email: 'Already registered' });
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Already registered' });
    expect(unhandled).toEqual([]);
  });

  it('returns form-level messages instead of inventing a field', () => {
    const setError = vi.fn();
    const unhandled = applyServerErrors<Login>(setError, { _form: 'Your session expired' });
    expect(setError).not.toHaveBeenCalled();
    expect(unhandled).toEqual(['Your session expired']);
  });

  it('treats an unknown field as form-level when the field list is given', () => {
    const setError = vi.fn();
    const unhandled = applyServerErrors<Login>(setError, { couponCode: 'Expired' }, ['email', 'password']);
    expect(setError).not.toHaveBeenCalled();
    expect(unhandled).toEqual(['Expired']);
  });
});

describe('firstErrorMessage', () => {
  it('finds a top-level message', () => {
    expect(firstErrorMessage({ email: { message: 'Enter a valid email address' } })).toBe(
      'Enter a valid email address',
    );
  });

  it('descends into nested field groups', () => {
    expect(firstErrorMessage({ address: { postcode: { message: 'Postcode required' } } })).toBe(
      'Postcode required',
    );
  });

  it('returns null when the form is clean', () => {
    expect(firstErrorMessage({})).toBeNull();
    expect(firstErrorMessage(undefined)).toBeNull();
  });
});
