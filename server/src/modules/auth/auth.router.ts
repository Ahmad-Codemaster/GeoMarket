import { Router } from 'express';
import * as authController from './auth.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.post('/register/customer', authController.registerCustomer);
router.post('/register/vendor', authController.registerVendor);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
