import { Router, Request, Response } from 'express';
import authRouter from '../modules/auth/auth.router';
import addressRouter from '../modules/address/address.router';
import locationRouter from '../modules/location/location.router';
import categoryRouter from '../modules/category/category.router';
import vendorStoreRouter from '../modules/store/vendorStore.router';
import adminStoreRouter from '../modules/store/adminStore.router';
import vendorProductRouter from '../modules/product/vendorProduct.router';
import discoveryRouter from '../modules/discovery/discovery.router';
import cartRouter from '../modules/cart/cart.router';
import checkoutRouter from '../modules/order/checkout.router';
import orderRouter from '../modules/order/order.router';
import vendorOrderRouter from '../modules/order/vendorOrder.router';
import adminOrderRouter from '../modules/order/adminOrder.router';
import { prisma } from '../lib/prisma';

const router = Router();

// Health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

router.use('/auth', authRouter);
router.use('/addresses', addressRouter);
router.use('/location', locationRouter);
router.use('/categories', categoryRouter.public);
router.use('/admin/categories', categoryRouter.admin);
router.use('/vendor/stores', vendorStoreRouter);
router.use('/vendor/products', vendorProductRouter);
router.use('/admin/stores', adminStoreRouter);
router.use('/discovery', discoveryRouter);
router.use('/cart', cartRouter);
router.use('/checkout', checkoutRouter);
router.use('/orders', orderRouter);
router.use('/vendor/orders', vendorOrderRouter);
router.use('/admin/orders', adminOrderRouter);

export default router;
