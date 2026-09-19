import { Router } from 'express';
import * as addressController from './address.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';

const router = Router();

// Address management is strictly for authenticated CUSTOMER users
router.use(requireAuth, requireRole(UserRole.CUSTOMER));

router.post('/', addressController.createAddress);
router.get('/', addressController.getAddresses);
router.get('/:id', addressController.getAddressById);
router.put('/:id', addressController.updateAddress);
router.patch('/:id/default', addressController.setDefaultAddress);
router.delete('/:id', addressController.deleteAddress);

export default router;
