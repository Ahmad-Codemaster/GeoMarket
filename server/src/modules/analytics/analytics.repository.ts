import { prisma } from '../../lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { reviewIncludeDetails, ReviewWithDetails } from '../review/review.repository';

export interface RawAnalyticsResult {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  averageOrderValue: number;
  averageRating: number;
  reviewCount: number;
  recentReviews: ReviewWithDetails[];
}

export async function getOperationalAnalytics(
  storeIds: string[],
  startDate?: Date
): Promise<RawAnalyticsResult> {
  if (storeIds.length === 0) {
    return {
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      revenue: 0,
      averageOrderValue: 0,
      averageRating: 0,
      reviewCount: 0,
      recentReviews: [],
    };
  }

  const orderWhere: Prisma.OrderWhereInput = {
    storeId: { in: storeIds },
    ...(startDate ? { createdAt: { gte: startDate } } : {}),
  };

  const reviewWhere: Prisma.ReviewWhereInput = {
    storeId: { in: storeIds },
    ...(startDate ? { createdAt: { gte: startDate } } : {}),
  };

  const [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    revenueAgg,
    reviewAgg,
    recentReviews,
  ] = await Promise.all([
    prisma.order.count({ where: orderWhere }),
    prisma.order.count({
      where: {
        ...orderWhere,
        status: OrderStatus.DELIVERED,
      },
    }),
    prisma.order.count({
      where: {
        ...orderWhere,
        status: OrderStatus.CANCELLED,
      },
    }),
    prisma.order.aggregate({
      where: {
        ...orderWhere,
        status: OrderStatus.DELIVERED,
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.review.aggregate({
      where: reviewWhere,
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.review.findMany({
      where: reviewWhere,
      include: reviewIncludeDetails,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const revenue = revenueAgg._sum.totalAmount ? Number(revenueAgg._sum.totalAmount) : 0;
  const averageOrderValue = deliveredOrders > 0 ? Number((revenue / deliveredOrders).toFixed(2)) : 0;
  const averageRating = reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(2)) : 0;
  const reviewCount = reviewAgg._count.id;

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    revenue,
    averageOrderValue,
    averageRating,
    reviewCount,
    recentReviews,
  };
}
