import { Request, Response, NextFunction } from 'express';
import { registerCustomerSchema, registerVendorSchema, loginSchema } from './auth.schemas';
import * as authService from './auth.service';
import { env } from '../../config/env';

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: env.JWT_EXPIRES_IN * 1000, // milliseconds
  };
}

export async function registerCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const user = await authService.registerCustomer(parsed.data);
    const token = authService.signToken(user);

    res.cookie('token', token, getCookieOptions());
    return res.status(201).json({ user });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    next(err);
  }
}

export async function registerVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const user = await authService.registerVendor(parsed.data);
    const token = authService.signToken(user);

    res.cookie('token', token, getCookieOptions());
    return res.status(201).json({ user });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const user = await authService.login(parsed.data);
    const token = authService.signToken(user);

    res.cookie('token', token, getCookieOptions());
    return res.status(200).json({ user });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: '/',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    // req.user is set by requireAuth middleware
    return res.status(200).json({ user: (req as any).user });
  } catch (err) {
    next(err);
  }
}
