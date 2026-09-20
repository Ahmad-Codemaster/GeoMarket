import { ReviewDto } from './review';

export type AnalyticsPeriod = 'today' | 'last_7_days' | 'last_30_days' | 'all_time';

export interface VendorAnalyticsDto {
  period: AnalyticsPeriod;
  storeId?: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  averageOrderValue: number;
  averageRating: number;
  reviewCount: number;
  recentReviews: ReviewDto[];
}
