import { Request, Response, NextFunction } from 'express';
import {
  createReviewSchema,
  updateReviewSchema,
  storeReviewsQuerySchema,
  vendorReviewsQuerySchema,
  uuidParamSchema,
} from './review.schemas';
import * as reviewService from './review.service';
import { ReviewServiceError } from './review.service';

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const review = await reviewService.createCustomerReview(userId, parsed.data);
    return res.status(201).json({ review });
  } catch (err) {
    if (err instanceof ReviewServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...(err.details || {}),
      });
    }
    next(err);
  }
}

export async function getReviewByOrderId(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const parsedId = uuidParamSchema.safeParse(req.params.orderId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const review = await reviewService.getReviewByOrderId(user, parsedId.data);
    if (!review) {
      return res.status(404).json({ error: 'Review not found', code: 'REVIEW_NOT_FOUND' });
    }
    return res.status(200).json({ review });
  } catch (err) {
    if (err instanceof ReviewServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function getReviewById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const parsedId = uuidParamSchema.safeParse(req.params.reviewId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const review = await reviewService.getReviewById(user, parsedId.data);
    return res.status(200).json({ review });
  } catch (err) {
    if (err instanceof ReviewServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function updateReview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsedId = uuidParamSchema.safeParse(req.params.reviewId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const parsed = updateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const review = await reviewService.updateCustomerReview(userId, parsedId.data, parsed.data);
    return res.status(200).json({ review });
  } catch (err) {
    if (err instanceof ReviewServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const parsedId = uuidParamSchema.safeParse(req.params.reviewId);
    if (!parsedId.success) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const result = await reviewService.deleteCustomerReview(user, parsedId.data);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof ReviewServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function getStoreReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const storeIdOrSlug = req.params.storeId;
    if (!storeIdOrSlug) {
      return res.status(400).json({ error: 'Store identifier is required' });
    }

    const parsedQuery = storeReviewsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsedQuery.error.flatten(),
      });
    }

    const result = await reviewService.getStorePublicReviews(storeIdOrSlug, parsedQuery.data);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof ReviewServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}

export async function getVendorReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user!.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const parsedQuery = vendorReviewsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsedQuery.error.flatten(),
      });
    }

    const result = await reviewService.getVendorReviews(vendorProfileId, parsedQuery.data);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof ReviewServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}
