import { Request, Response, NextFunction } from 'express';
import { addToCartSchema, updateCartItemSchema, uuidParamSchema } from './cart.schemas';
import * as cartService from './cart.service';
import { CartServiceError } from './cart.service';

export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const cart = await cartService.getCart(userId);
    return res.status(200).json({ cart });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const parsed = addToCartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const cart = await cartService.addToCart(
      userId,
      parsed.data.productId,
      parsed.data.quantity,
    );

    return res.status(200).json({ cart });
  } catch (err) {
    if (err instanceof CartServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...(err.details || {}),
      });
    }
    next(err);
  }
}

export async function updateCartItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const parsedItemId = uuidParamSchema.safeParse(req.params.itemId);
    if (!parsedItemId.success) {
      return res.status(400).json({ error: 'Invalid cart item ID' });
    }

    const parsed = updateCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const cart = await cartService.updateCartItemQuantity(
      userId,
      parsedItemId.data,
      parsed.data.quantity,
    );

    return res.status(200).json({ cart });
  } catch (err) {
    if (err instanceof CartServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...(err.details || {}),
      });
    }
    next(err);
  }
}

export async function removeCartItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const parsedItemId = uuidParamSchema.safeParse(req.params.itemId);
    if (!parsedItemId.success) {
      return res.status(400).json({ error: 'Invalid cart item ID' });
    }

    const cart = await cartService.removeCartItem(userId, parsedItemId.data);
    return res.status(200).json({ cart });
  } catch (err) {
    if (err instanceof CartServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...(err.details || {}),
      });
    }
    next(err);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const cart = await cartService.clearCart(userId);
    return res.status(200).json({ cart });
  } catch (err) {
    if (err instanceof CartServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...(err.details || {}),
      });
    }
    next(err);
  }
}
