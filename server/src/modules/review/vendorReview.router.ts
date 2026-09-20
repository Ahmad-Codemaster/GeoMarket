import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as reviewController from './review.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.VENDOR));

router.get('/', reviewController.getVendorReviews);

export default router;
