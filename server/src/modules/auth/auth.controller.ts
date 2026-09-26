import { Request, Response, NextFunction } from 'express';
import { registerCustomerSchema, registerVendorSchema, loginSchema, guestSessionSchema } from './auth.schemas';
import * as authService from './auth.service';
import { transferGuestData } from '../cart/cart.service';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

export function getCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd || env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: env.JWT_EXPIRES_IN * 1000, // milliseconds
  };
}

async function extractGuestUserId(req: Request): Promise<string | null> {
  const previousToken =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!previousToken) return null;

  try {
    const decoded = authService.verifyToken(previousToken);
    if (decoded?.sub) {
      const prevUser = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (prevUser && (prevUser as any).isGuest) {
        return prevUser.id;
      }
    }
  } catch {
    // Ignore invalid or expired tokens
  }
  return null;
}

export async function registerCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const guestUserId = await extractGuestUserId(req);
    const user = await authService.registerCustomer(parsed.data);

    if (guestUserId && guestUserId !== user.id) {
      await transferGuestData(guestUserId, user.id);
    }

    const token = authService.signToken(user);

    res.cookie('token', token, getCookieOptions());
    return res.status(201).json({ user, token });
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
    return res.status(201).json({ user, token });
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

    const guestUserId = await extractGuestUserId(req);
    const user = await authService.login(parsed.data);

    if (guestUserId && guestUserId !== user.id) {
      await transferGuestData(guestUserId, user.id);
    }

    const token = authService.signToken(user);

    res.cookie('token', token, getCookieOptions());
    return res.status(200).json({ user, token });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  const isProd = env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd || env.COOKIE_SECURE,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
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

export async function guestSession(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = guestSessionSchema.safeParse(req.body || {});
    const input = parsed.success ? parsed.data : undefined;
    const user = await authService.createOrRestoreGuestSession(input);
    const token = authService.signToken(user);

    res.cookie('token', token, getCookieOptions());
    return res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}
