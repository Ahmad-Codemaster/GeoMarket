import { Request, Response, NextFunction } from 'express';
import {
  createStoreCategorySchema,
  updateStoreCategorySchema,
  createProductCategorySchema,
  updateProductCategorySchema,
} from './category.schemas';
import * as categoryService from './category.service';

// ==========================================
// Store Categories Handlers
// ==========================================

export async function getActiveStoreCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getActiveStoreCategories();
    return res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function getAllStoreCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getAllStoreCategories();
    return res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function getStoreCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const category = await categoryService.getStoreCategoryById(id);
    return res.status(200).json({ category });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({ error: 'Store category not found' });
    }
    next(err);
  }
}

export async function createStoreCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createStoreCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const category = await categoryService.createStoreCategory(parsed.data);
    return res.status(201).json({ category });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NAME_EXISTS') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    next(err);
  }
}

export async function updateStoreCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = updateStoreCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const category = await categoryService.updateStoreCategory(id, parsed.data);
    return res.status(200).json({ category });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({ error: 'Store category not found' });
    }
    if (err instanceof Error && err.message === 'CATEGORY_NAME_EXISTS') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    next(err);
  }
}

export async function deleteStoreCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await categoryService.deleteStoreCategory(id);
    return res.status(200).json({ message: 'Store category deleted successfully' });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({ error: 'Store category not found' });
    }
    if (err instanceof Error && err.message === 'CATEGORY_IN_USE') {
      return res.status(409).json({ error: 'Cannot delete category that has stores assigned to it' });
    }
    next(err);
  }
}

// ==========================================
// Product Categories Handlers
// ==========================================

export async function getProductCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getProductCategories();
    return res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function getProductCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const category = await categoryService.getProductCategoryById(id);
    return res.status(200).json({ category });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({ error: 'Product category not found' });
    }
    next(err);
  }
}

export async function createProductCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createProductCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const category = await categoryService.createProductCategory(parsed.data);
    return res.status(201).json({ category });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NAME_EXISTS') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    next(err);
  }
}

export async function updateProductCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = updateProductCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const category = await categoryService.updateProductCategory(id, parsed.data);
    return res.status(200).json({ category });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({ error: 'Product category not found' });
    }
    if (err instanceof Error && err.message === 'CATEGORY_NAME_EXISTS') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    next(err);
  }
}

export async function deleteProductCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await categoryService.deleteProductCategory(id);
    return res.status(200).json({ message: 'Product category deleted successfully' });
  } catch (err) {
    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return res.status(404).json({ error: 'Product category not found' });
    }
    if (err instanceof Error && err.message === 'CATEGORY_IN_USE') {
      return res.status(409).json({ error: 'Cannot delete category that has products assigned to it' });
    }
    next(err);
  }
}
