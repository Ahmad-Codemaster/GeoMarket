import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as productController from './product.controller';

const router = Router();

// All vendor product routes require authentication and VENDOR role
router.use(requireAuth, requireRole(UserRole.VENDOR));

router.get('/', productController.getVendorProducts);
router.post('/', productController.createProduct);

router.get('/:productId', productController.getProductById);
router.put('/:productId', productController.updateProduct);
router.delete('/:productId', productController.deleteProduct);

router.patch('/:productId/active', productController.toggleProductActive);
router.post('/:productId/active', productController.toggleProductActive);

router.patch('/:productId/stock', productController.updateStock);
router.post('/:productId/stock', productController.updateStock);

export default router;
