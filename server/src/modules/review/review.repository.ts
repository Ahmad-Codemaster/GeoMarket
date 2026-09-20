import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export const reviewIncludeDetails = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  store: {
    select: {
      id: true,
      name: true,
      vendorProfileId: true,
    },
  },
};

export type ReviewWithDetails = Prisma.ReviewGetPayload<{
  include: typeof reviewIncludeDetails;
}>;

export async function findReviewById(id: string): Promise<ReviewWithDetails | null> {
  return prisma.review.findUnique({
    where: { id },
    include: reviewIncludeDetails,
  });
}

export async function findReviewByOrderId(orderId: string): Promise<ReviewWithDetails | null> {
  return prisma.review.findUnique({
    where: { orderId },
    include: reviewIncludeDetails,
  });
}

export async function findReviewsByStoreId(
  storeId: string,
  options: { page: number; pageSize: number }
): Promise<{ reviews: ReviewWithDetails[]; total: number }> {
  const skip = (options.page - 1) * options.pageSize;
  const take = options.pageSize;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { storeId },
      include: reviewIncludeDetails,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({
      where: { storeId },
    }),
  ]);

  return { reviews, total };
}

export async function findReviewsByVendorProfileId(
  vendorProfileId: string,
  options: { storeId?: string; page: number; pageSize: number }
): Promise<{ reviews: ReviewWithDetails[]; total: number }> {
  const skip = (options.page - 1) * options.pageSize;
  const take = options.pageSize;

  const where: Prisma.ReviewWhereInput = {
    store: {
      vendorProfileId,
    },
    ...(options.storeId ? { storeId: options.storeId } : {}),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewIncludeDetails,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  return { reviews, total };
}

export async function createReviewTransaction(data: {
  orderId: string;
  userId: string;
  storeId: string;
  rating: number;
  comment?: string | null;
}): Promise<ReviewWithDetails> {
  return prisma.$transaction(async (tx) => {
    // 1. Create review
    const review = await tx.review.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        storeId: data.storeId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
      include: reviewIncludeDetails,
    });

    // 2. Aggregate new store metrics
    const agg = await tx.review.aggregate({
      where: { storeId: data.storeId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0;
    const totalReviews = agg._count.id;

    // 3. Update store denormalized aggregate
    await tx.store.update({
      where: { id: data.storeId },
      data: {
        averageRating,
        totalReviews,
      },
    });

    return review;
  });
}

export async function updateReviewTransaction(
  reviewId: string,
  data: { rating?: number; comment?: string | null }
): Promise<ReviewWithDetails> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    const updated = await tx.review.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.comment !== undefined ? { comment: data.comment } : {}),
      },
      include: reviewIncludeDetails,
    });

    // Re-aggregate store rating
    const agg = await tx.review.aggregate({
      where: { storeId: existing.storeId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0;
    const totalReviews = agg._count.id;

    await tx.store.update({
      where: { id: existing.storeId },
      data: {
        averageRating,
        totalReviews,
      },
    });

    return updated;
  });
}

export async function deleteReviewTransaction(reviewId: string): Promise<{ storeId: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    await tx.review.delete({
      where: { id: reviewId },
    });

    // Re-aggregate store metrics
    const agg = await tx.review.aggregate({
      where: { storeId: existing.storeId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0;
    const totalReviews = agg._count.id;

    await tx.store.update({
      where: { id: existing.storeId },
      data: {
        averageRating,
        totalReviews,
      },
    });

    return { storeId: existing.storeId };
  });
}
