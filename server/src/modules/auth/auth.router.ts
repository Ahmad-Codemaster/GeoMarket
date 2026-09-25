import { Router } from 'express';
import * as authController from './auth.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { authLimiter, guestLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/register/customer', authLimiter, authController.registerCustomer);
router.post('/register/vendor', authLimiter, authController.registerVendor);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/guest-session', guestLimiter, authController.guestSession);
router.get('/me', requireAuth, authController.me);

export default router;
