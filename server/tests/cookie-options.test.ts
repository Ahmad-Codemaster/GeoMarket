import { describe, it, expect } from 'vitest';
import { getCookieOptions } from '../src/modules/auth/auth.controller';

describe('Auth Cookie Hardening', () => {
  it('should use SameSite=lax for CSRF protection on unified origin', () => {
    const options = getCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe('/');
    expect(options.sameSite).toBe('lax');
  });
});
