import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as adminController from './admin.controller';

const router = Router();

router.use(requireAuth, requireRole(UserRole.ADMIN));

router.get('/stats', adminController.getPlatformStats);
router.get('/users', adminController.getAdminUsers);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);
router.post('/change-password', adminController.changeAdminPassword);

export default router;
