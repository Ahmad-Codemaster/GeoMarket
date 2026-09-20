import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as orderController from './order.controller';

const router = Router();

// Vendor Order Management is strictly vendor-scoped
router.use(requireAuth);
router.use(requireRole(UserRole.VENDOR));

router.get('/', orderController.getVendorOrders);
router.get('/:orderId', orderController.getVendorOrderById);
router.patch('/:orderId/status', orderController.updateVendorOrderStatus);

export default router;
