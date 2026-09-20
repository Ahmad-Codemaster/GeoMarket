import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as analyticsController from './analytics.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.VENDOR));

router.get('/', analyticsController.getVendorAnalytics);

export default router;
