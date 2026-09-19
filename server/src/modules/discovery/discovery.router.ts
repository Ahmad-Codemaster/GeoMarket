import { Router } from 'express';
import * as discoveryController from './discovery.controller';

const router = Router();

// Customer store discovery and browsing (public / location-driven)
router.get('/stores', discoveryController.getDiscoveredStores);
router.get('/stores/:id', discoveryController.getDiscoveredStoreById);
router.get('/stores/:id/products', discoveryController.getDiscoveredStoreProducts);

export default router;
