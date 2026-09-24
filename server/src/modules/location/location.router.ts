import { Router } from 'express';
import * as locationController from './location.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

// Geocoding endpoints are public so customers and guests can search addresses and reverse-geocode
router.post('/reverse', locationController.handleReverseGeocode);
router.post('/forward', locationController.handleForwardGeocode);

export default router;
