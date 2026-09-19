import { Request, Response, NextFunction } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  inventoryOperationSchema,
  toggleProductActiveSchema,
  uuidParamSchema,
} from './product.schemas';
import * as productService from './product.service';

// ==========================================
// Vendor Product Controllers
// ==========================================

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const storeId = req.params.storeId || req.body.storeId || req.body.store_id;
    const storeIdValid = uuidParamSchema.safeParse(storeId);
    if (!storeIdValid.success) {
      return res.status(400).json({ error: 'Invalid store ID' });
    }

    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const product = await productService.createProduct(
      vendorProfileId,
      storeIdValid.data,
      parsed.data,
    );

    return res.status(201).json({ product });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'STORE_NOT_FOUND') {
        return res.status(404).json({ error: 'Store not found' });
      }
      if (err.message === 'CATEGORY_NOT_FOUND') {
        return res.status(400).json({ error: 'Product category not found' });
      }
    }
    next(err);
  }
}

export async function getStoreProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const storeIdValid = uuidParamSchema.safeParse(req.params.storeId);
    if (!storeIdValid.success) {
      return res.status(400).json({ error: 'Invalid store ID' });
    }

    const products = await productService.getStoreProducts(vendorProfileId, storeIdValid.data);
    return res.status(200).json({ products });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    next(err);
  }
}

export async function getVendorProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const storeId = req.query.storeId;
    const categoryId = req.query.categoryId || req.query.productCategoryId;
    const { search, isActive } = req.query;

    const filters: {
      storeId?: string;
      productCategoryId?: string;
      search?: string;
      isActive?: boolean;
    } = {};

    if (storeId && typeof storeId === 'string') {
      const parsedStoreId = uuidParamSchema.safeParse(storeId);
      if (!parsedStoreId.success) {
        return res.status(400).json({ error: 'Invalid store ID' });
      }
      filters.storeId = parsedStoreId.data;
    }

    if (categoryId && typeof categoryId === 'string') {
      const parsedCatId = uuidParamSchema.safeParse(categoryId);
      if (!parsedCatId.success) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
      filters.productCategoryId = parsedCatId.data;
    }

    if (search && typeof search === 'string') {
      filters.search = search.trim();
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true' || isActive === '1';
    }

    const products = await productService.getVendorProducts(vendorProfileId, filters);
    return res.status(200).json({ products });
  } catch (err) {
    if (err instanceof Error && err.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found' });
    }
    next(err);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const productId = req.params.productId || req.params.id;
    const parsedId = uuidParamSchema.safeParse(productId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await productService.getProductById(vendorProfileId, parsedId.data);
    return res.status(200).json({ product });
  } catch (err) {
    if (err instanceof Error && err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Product not found' });
    }
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const productId = req.params.productId || req.params.id;
    const parsedId = uuidParamSchema.safeParse(productId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const product = await productService.updateProduct(
      vendorProfileId,
      parsedId.data,
      parsed.data,
    );

    return res.status(200).json({ product });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (err.message === 'CATEGORY_NOT_FOUND') {
        return res.status(400).json({ error: 'Product category not found' });
      }
    }
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const productId = req.params.productId || req.params.id;
    const parsedId = uuidParamSchema.safeParse(productId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    await productService.deleteProduct(vendorProfileId, parsedId.data);
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (err instanceof Error && err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Product not found' });
    }
    if ((err as any)?.code === 'P2003' || (err as any)?.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete product with existing references' });
    }
    next(err);
  }
}

export async function toggleProductActive(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const productId = req.params.productId || req.params.id;
    const parsedId = uuidParamSchema.safeParse(productId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const parsed = toggleProductActiveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const product = await productService.toggleProductActive(
      vendorProfileId,
      parsedId.data,
      parsed.data.isActive,
    );

    return res.status(200).json({ product });
  } catch (err) {
    if (err instanceof Error && err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Product not found' });
    }
    next(err);
  }
}

export async function updateStock(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user?.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const productId = req.params.productId || req.params.id;
    const parsedId = uuidParamSchema.safeParse(productId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const parsed = inventoryOperationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const product = await productService.updateStock(
      vendorProfileId,
      parsedId.data,
      parsed.data,
    );

    return res.status(200).json({ product });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (err.message === 'INSUFFICIENT_STOCK') {
        return res.status(400).json({ error: 'Resulting stock quantity cannot be negative' });
      }
      if (err.message === 'INVALID_OPERATION') {
        return res.status(400).json({ error: 'Invalid inventory operation' });
      }
    }
    next(err);
  }
}
