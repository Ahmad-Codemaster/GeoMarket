import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as orderController from './order.controller';

const router = Router();

// Checkout is strictly customer-scoped
router.use(requireAuth);
router.use(requireRole(UserRole.CUSTOMER));

router.post('/', orderController.checkout);

export default router;
