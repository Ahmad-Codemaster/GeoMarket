import { Router } from 'express';
import * as locationController from './location.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

// Location endpoints require an authenticated user
router.use(requireAuth);

router.post('/reverse', locationController.handleReverseGeocode);
router.post('/forward', locationController.handleForwardGeocode);

export default router;
