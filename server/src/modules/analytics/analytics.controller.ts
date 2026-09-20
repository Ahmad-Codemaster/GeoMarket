import { Request, Response, NextFunction } from 'express';
import { vendorAnalyticsQuerySchema } from './analytics.schemas';
import * as analyticsService from './analytics.service';
import { AnalyticsServiceError } from './analytics.service';

export async function getVendorAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const vendorProfileId = req.user!.vendorProfileId;
    if (!vendorProfileId) {
      return res.status(403).json({ error: 'Vendor profile not found' });
    }

    const parsedQuery = vendorAnalyticsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsedQuery.error.flatten(),
      });
    }

    const analytics = await analyticsService.getVendorAnalytics(vendorProfileId, parsedQuery.data);
    return res.status(200).json({ analytics });
  } catch (err) {
    if (err instanceof AnalyticsServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
}
