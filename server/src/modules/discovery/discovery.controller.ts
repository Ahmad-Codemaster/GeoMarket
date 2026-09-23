import { Request, Response } from 'express';
import * as discoveryService from './discovery.service';
import {
  storeDiscoveryQuerySchema,
  storeProductsQuerySchema,
  productsDiscoveryQuerySchema,
} from './discovery.schemas';
import { z } from 'zod';

export async function getDiscoveredStores(req: Request, res: Response) {
  try {
    const parsed = storeDiscoveryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid discovery parameters',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const result = await discoveryService.discoverStores(parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Store discovery error:', error);
    return res.status(500).json({ error: 'Internal server error during store discovery' });
  }
}

export async function getDiscoveredStoreById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    let coords: { latitude: number; longitude: number } | undefined;

    if (req.query.latitude !== undefined || req.query.longitude !== undefined) {
      const coordSchema = z.object({
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180),
      });
      const parsedCoords = coordSchema.safeParse(req.query);
      if (!parsedCoords.success) {
        return res.status(400).json({ error: 'Invalid coordinates provided' });
      }
      coords = parsedCoords.data;
    }

    const store = await discoveryService.getDiscoveredStore(id, coords);
    return res.status(200).json({ store });
  } catch (error: any) {
    if (error.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found or unavailable' });
    }
    console.error('Store detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDiscoveredStoreProducts(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parsed = storeProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid product query parameters',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const result = await discoveryService.getDiscoveredStoreProducts(id, parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({ error: 'Store not found or unavailable' });
    }
    console.error('Store products error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDiscoveredProducts(req: Request, res: Response) {
  try {
    const parsed = productsDiscoveryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const result = await discoveryService.searchDiscoveredProducts(parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Products discovery error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDiscoveredProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await discoveryService.getDiscoveredProductById(id);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }
    console.error('Product detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
