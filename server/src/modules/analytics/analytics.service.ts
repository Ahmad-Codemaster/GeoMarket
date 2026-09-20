import { prisma } from '../../lib/prisma';
import { AnalyticsPeriod, VendorAnalyticsDto } from '@geomarket/shared';
import * as analyticsRepo from './analytics.repository';
import { formatReview } from '../review/review.service';

export class AnalyticsServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = 'AnalyticsServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function computeStartDate(
  period: AnalyticsPeriod,
  timezone: string = 'Asia/Karachi'
): Date | undefined {
  const now = new Date();
  switch (period) {
    case 'today': {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).formatToParts(now);
        const y = parts.find((p) => p.type === 'year')?.value;
        const m = parts.find((p) => p.type === 'month')?.value?.padStart(2, '0');
        const d = parts.find((p) => p.type === 'day')?.value?.padStart(2, '0');
        if (y && m && d) {
          const testDate = new Date();
          const utcDate = new Date(testDate.toLocaleString('en-US', { timeZone: 'UTC' }));
          const tzDate = new Date(testDate.toLocaleString('en-US', { timeZone: timezone }));
          const offsetMs = tzDate.getTime() - utcDate.getTime();
          const localMidnightUtc = new Date(
            new Date(`${y}-${m}-${d}T00:00:00.000Z`).getTime() - offsetMs
          );
          return localMidnightUtc;
        }
      } catch {
        // Fallback to UTC midnight if timezone string is invalid
      }
      const todayStart = new Date(now);
      todayStart.setUTCHours(0, 0, 0, 0);
      return todayStart;
    }
    case 'last_7_days': {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    case 'last_30_days': {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    case 'all_time':
    default:
      return undefined;
  }
}

export async function getVendorAnalytics(
  vendorProfileId: string,
  query: { storeId?: string; period?: AnalyticsPeriod; timezone?: string }
): Promise<VendorAnalyticsDto> {
  const period: AnalyticsPeriod = query.period || 'all_time';

  let storeIds: string[] = [];

  // Tenant isolation check
  if (query.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: query.storeId },
      select: { id: true, vendorProfileId: true, timezone: true },
    });

    if (!store || store.vendorProfileId !== vendorProfileId) {
      throw new AnalyticsServiceError('Store not found', 'STORE_NOT_FOUND', 404);
    }

    storeIds = [store.id];
  } else {
    // Aggregates across all stores belonging to the authenticated vendor
    const vendorStores = await prisma.store.findMany({
      where: { vendorProfileId },
      select: { id: true },
    });

    storeIds = vendorStores.map((s) => s.id);
  }

  const startDate = computeStartDate(period, query.timezone || 'Asia/Karachi');
  const result = await analyticsRepo.getOperationalAnalytics(storeIds, startDate);

  return {
    period,
    storeId: query.storeId,
    totalOrders: result.totalOrders,
    deliveredOrders: result.deliveredOrders,
    cancelledOrders: result.cancelledOrders,
    revenue: result.revenue,
    averageOrderValue: result.averageOrderValue,
    averageRating: result.averageRating,
    reviewCount: result.reviewCount,
    recentReviews: result.recentReviews.map((r) => formatReview(r, true)),
  };
}
