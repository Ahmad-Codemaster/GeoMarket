import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as storeController from './store.controller';

const router = Router();

// All admin store routes require authentication and ADMIN role
router.use(requireAuth, requireRole(UserRole.ADMIN));

router.get('/', storeController.getStoresAdmin);
router.get('/:id', storeController.getStoreByIdAdmin);
router.post('/:id/approve', storeController.approveStore);
router.post('/:id/reject', storeController.rejectStore);
router.post('/:id/suspend', storeController.suspendStore);
router.post('/:id/restore', storeController.restoreStore);

export default router;
