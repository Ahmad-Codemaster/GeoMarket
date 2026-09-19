import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@geomarket/shared';

/**
 * RBAC middleware factory.
 * Must be composed AFTER requireAuth.
 * Authorization is always derived from the verified backend token — never from the request body.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
