import { Request, Response, NextFunction } from 'express';
import {
  createStoreSchema,
  updateStoreSchema,
  batchOperatingHoursSchema,
  reasonActionSchema,
} from './store.schemas';
import * as storeService from './store.service';
import { StoreStatus } from '@geomarket/shared';

// ==========================================
// Vendor Controllers
// ==========================================

export async function createStore(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const parsed = createStoreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const store = await storeService.createStore(vendorProfileId, parsed.data);
    return res.status(201).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_CATEGORY_NOT_FOUND') {
      return res.status(400).json({ error: 'Store category not found' });
    }
    next(err);
  }
}

export async function getVendorStores(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const stores = await storeService.getVendorStores(vendorProfileId);
    return res.status(200).json({ stores });
  } catch (err) {
    next(err);
  }
}

export async function getVendorStoreById(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const { id } = req.params;
    const store = await storeService.getVendorStoreById(id, vendorProfileId);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    next(err);
  }
}

export async function updateVendorStore(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const { id } = req.params;
    const parsed = updateStoreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const store = await storeService.updateVendorStore(id, vendorProfileId, parsed.data);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    if (err instanceof Error && err.message === 'STORE_CATEGORY_NOT_FOUND') {
      return res.status(400).json({ error: 'Store category not found' });
    }
    next(err);
  }
}

export async function resubmitStore(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const { id } = req.params;
    const store = await storeService.resubmitStore(id, vendorProfileId);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Only rejected stores can be resubmitted' });
    }
    next(err);
  }
}

export async function toggleOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const { id } = req.params;
    const store = await storeService.toggleVendorStoreOrders(id, vendorProfileId);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    next(err);
  }
}

export async function setOperatingHours(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const { id } = req.params;
    const parsed = batchOperatingHoursSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const operatingHours = await storeService.setOperatingHours(id, vendorProfileId, parsed.data);
    return res.status(200).json({ operatingHours });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    next(err);
  }
}

export async function getOperatingHours(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const { id } = req.params;
    const operatingHours = await storeService.getOperatingHours(id, vendorProfileId);
    return res.status(200).json({ operatingHours });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    next(err);
  }
}

// ==========================================
// Admin Controllers
// ==========================================

export async function getStoresAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, categoryId, city } = req.query;
    const stores = await storeService.getStoresAdmin({
      status: status as StoreStatus | undefined,
      categoryId: categoryId as string | undefined,
      city: city as string | undefined,
    });
    return res.status(200).json({ stores });
  } catch (err) {
    next(err);
  }
}

export async function getStoreByIdAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const store = await storeService.getStoreByIdAdmin(id);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    next(err);
  }
}

export async function approveStore(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const store = await storeService.approveStoreAdmin(id);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Cannot approve store in current status' });
    }
    next(err);
  }
}

export async function rejectStore(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = reasonActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const store = await storeService.rejectStoreAdmin(id, parsed.data.reason);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Cannot reject store in current status' });
    }
    if (err instanceof Error && err.message === 'REASON_REQUIRED') {
      return res.status(400).json({ error: 'Rejection reason of at least 5 characters is required' });
    }
    next(err);
  }
}

export async function suspendStore(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = reasonActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const store = await storeService.suspendStoreAdmin(id, parsed.data.reason);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Cannot suspend store in current status' });
    }
    if (err instanceof Error && err.message === 'REASON_REQUIRED') {
      return res.status(400).json({ error: 'Suspension reason of at least 5 characters is required' });
    }
    next(err);
  }
}

export async function restoreStore(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const store = await storeService.restoreStoreAdmin(id);
    return res.status(200).json({ store });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Cannot restore store in current status' });
    }
    next(err);
  }
}
