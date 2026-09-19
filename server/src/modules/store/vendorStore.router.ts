import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as storeController from './store.controller';
import * as productController from '../product/product.controller';

const router = Router();

// All vendor store routes require authentication and VENDOR role
router.use(requireAuth, requireRole(UserRole.VENDOR));

router.post('/', storeController.createStore);
router.get('/', storeController.getVendorStores);
router.get('/:id', storeController.getVendorStoreById);
router.put('/:id', storeController.updateVendorStore);
router.post('/:id/resubmit', storeController.resubmitStore);
router.patch('/:id/toggle-orders', storeController.toggleOrders);
router.post('/:id/toggle-orders', storeController.toggleOrders);
router.put('/:id/operating-hours', storeController.setOperatingHours);
router.post('/:id/operating-hours', storeController.setOperatingHours);
router.get('/:id/operating-hours', storeController.getOperatingHours);

// Product routes nested under store
router.post('/:storeId/products', productController.createProduct);
router.get('/:storeId/products', productController.getStoreProducts);

export default router;

