import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as orderController from './order.controller';

const router = Router();

// Customer Orders are strictly customer-scoped
router.use(requireAuth);
router.use(requireRole(UserRole.CUSTOMER));

router.get('/', orderController.getCustomerOrders);
router.get('/:orderId', orderController.getCustomerOrderById);
router.patch('/:orderId/cancel', orderController.cancelCustomerOrder);
router.post('/:orderId/cancel', orderController.cancelCustomerOrder);

export default router;
