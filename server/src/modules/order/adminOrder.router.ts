import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as orderController from './order.controller';

const router = Router();

// Admin Order Oversight is strictly admin-scoped
router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN));

router.get('/', orderController.getAdminOrders);
router.get('/:orderId', orderController.getAdminOrderById);

export default router;
