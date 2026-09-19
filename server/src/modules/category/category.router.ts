import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import * as categoryController from './category.controller';

export const publicCategoryRouter = Router();

// Public routes
publicCategoryRouter.get('/stores', categoryController.getActiveStoreCategories);
publicCategoryRouter.get('/products', categoryController.getProductCategories);

export const adminCategoryRouter = Router();

// Admin routes (all require authentication and ADMIN role)
adminCategoryRouter.use(requireAuth, requireRole(UserRole.ADMIN));

// Store categories
adminCategoryRouter.get('/stores', categoryController.getAllStoreCategories);
adminCategoryRouter.get('/stores/:id', categoryController.getStoreCategoryById);
adminCategoryRouter.post('/stores', categoryController.createStoreCategory);
adminCategoryRouter.put('/stores/:id', categoryController.updateStoreCategory);
adminCategoryRouter.delete('/stores/:id', categoryController.deleteStoreCategory);

// Product categories
adminCategoryRouter.get('/products', categoryController.getProductCategories);
adminCategoryRouter.get('/products/:id', categoryController.getProductCategoryById);
adminCategoryRouter.post('/products', categoryController.createProductCategory);
adminCategoryRouter.put('/products/:id', categoryController.updateProductCategory);
adminCategoryRouter.delete('/products/:id', categoryController.deleteProductCategory);

export const categoryRouter = {
  public: publicCategoryRouter,
  admin: adminCategoryRouter,
};

export default categoryRouter;
