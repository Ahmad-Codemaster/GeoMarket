import { Request, Response, NextFunction } from 'express';
import {
  checkoutSchema,
  updateOrderStatusSchema,
  uuidParamSchema,
  orderQuerySchema,
} from './order.schemas';
import * as orderService from './order.service';
import { OrderServiceError } from './order.service';

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const order = await orderService.checkout(userId, parsed.data.addressId);
    return res.status(201).json({ order });
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...(err.details || {}),
      });
    }
    next(err);
  }
}

// ─── Customer Handlers ────────────────────────────────────────────────────────

export async function getCustomerOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsedQuery = orderQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsedQuery.error.flatten(),
      });
    }

    const result = await orderService.getCustomerOrders(userId, {
      page: parsedQuery.data.page,
      pageSize: parsedQuery.data.pageSize,
    });
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function getCustomerOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsedId = uuidParamSchema.safeParse(req.params.orderId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderService.getCustomerOrderById(userId, parsedId.data);
    return res.status(200).json({ order });
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function cancelCustomerOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsedId = uuidParamSchema.safeParse(req.params.orderId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderService.cancelCustomerOrder(userId, parsedId.data);
    return res.status(200).json({ order });
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

// ─── Vendor Handlers ──────────────────────────────────────────────────────────

export async function getVendorOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user!.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const parsedQuery = orderQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsedQuery.error.flatten(),
      });
    }

    const result = await orderService.getVendorOrders(vendorProfileId, parsedQuery.data);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function getVendorOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user!.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const parsedId = uuidParamSchema.safeParse(req.params.orderId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderService.getVendorOrderById(vendorProfileId, parsedId.data);
    return res.status(200).json({ order });
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function updateVendorOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user!.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const parsedId = uuidParamSchema.safeParse(req.params.orderId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const parsedBody = updateOrderStatusSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsedBody.error.flatten(),
      });
    }

    const order = await orderService.updateVendorOrderStatus(
      vendorProfileId,
      parsedId.data,
      parsedBody.data.status
    );
    return res.status(200).json({ order });
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

// ─── Admin Handlers ───────────────────────────────────────────────────────────

export async function getAdminOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedQuery = orderQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsedQuery.error.flatten(),
      });
    }

    const result = await orderService.getAdminOrders(parsedQuery.data);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function getAdminOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedId = uuidParamSchema.safeParse(req.params.orderId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderService.getAdminOrderById(parsedId.data);
    return res.status(200).json({ order });
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}
