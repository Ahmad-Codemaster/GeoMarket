import { prisma } from '../../lib/prisma';
import {
  OrderStatus,
  UserRole,
  AuthUser,
  ReviewDto,
  StoreReviewsResponseDto,
  ReviewErrorCode,
} from '@geomarket/shared';
import * as reviewRepo from './review.repository';
import { ReviewWithDetails } from './review.repository';
import { CreateReviewInput, UpdateReviewInput } from './review.schemas';

export class ReviewServiceError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'ReviewServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function formatReview(
  review: ReviewWithDetails,
  isPublic: boolean = false
): ReviewDto {
  // Format customer name sanitizing private identity for public & vendor contexts
  let customerName = 'Customer';
  if (review.user) {
    const first = review.user.firstName || '';
    const last = review.user.lastName || '';
    if (first && last) {
      customerName = `${first} ${last[0]}.`;
    } else if (first) {
      customerName = first;
    }
  }

  const dto: ReviewDto = {
    id: review.id,
    storeId: review.storeId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    customerName,
    storeName: review.store?.name,
  };

  // Never expose another customer's private orderId or userId in public contexts
  if (!isPublic) {
    dto.orderId = review.orderId;
    dto.userId = review.userId;
  }

  return dto;
}

/**
 * Authoritative Customer Review Creation
 */
export async function createCustomerReview(
  userId: string,
  input: CreateReviewInput
): Promise<ReviewDto> {
  // 1. Fetch order with store ownership and existing review
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      store: {
        include: {
          vendorProfile: true,
        },
      },
      review: true,
    },
  });

  if (!order) {
    throw new ReviewServiceError('Order not found', ReviewErrorCode.ORDER_NOT_FOUND, 404);
  }

  // 2. Eligibility: Order belongs to the store being reviewed
  if (input.storeId && order.storeId !== input.storeId) {
    throw new ReviewServiceError(
      'Order does not belong to the store being reviewed',
      ReviewErrorCode.INVALID_STORE_ORDER,
      400
    );
  }

  // 3. Eligibility: Customer must own the order
  if (order.userId !== userId) {
    throw new ReviewServiceError(
      'You can only review your own orders',
      ReviewErrorCode.NOT_ORDER_OWNER,
      403
    );
  }

  // 4. Eligibility: Order status must be DELIVERED
  if (order.status !== OrderStatus.DELIVERED) {
    throw new ReviewServiceError(
      'Only delivered orders can be reviewed',
      ReviewErrorCode.ORDER_NOT_DELIVERED,
      400
    );
  }

  // 5. Authorization: Vendor cannot review their own store
  if (order.store?.vendorProfile?.userId === userId) {
    throw new ReviewServiceError(
      'Vendors cannot create reviews for their own stores',
      ReviewErrorCode.VENDOR_CANNOT_REVIEW,
      403
    );
  }

  // 6. Invariant: One review per order
  if (order.review) {
    throw new ReviewServiceError(
      'A review has already been submitted for this order',
      ReviewErrorCode.ORDER_ALREADY_REVIEWED,
      409
    );
  }

  // 6. Create review and atomically update store aggregates
  try {
    const created = await reviewRepo.createReviewTransaction({
      orderId: order.id,
      userId,
      storeId: order.storeId,
      rating: input.rating,
      comment: input.comment,
    });

    return formatReview(created);
  } catch (err: any) {
    // Catch database-level unique constraint collision (P2002)
    if (err.code === 'P2002') {
      throw new ReviewServiceError(
        'A review has already been submitted for this order',
        ReviewErrorCode.ORDER_ALREADY_REVIEWED,
        409
      );
    }
    throw err;
  }
}

/**
 * Get review for a specific order (Customer, Store Vendor, or Admin)
 */
export async function getReviewByOrderId(
  user: AuthUser,
  orderId: string
): Promise<ReviewDto | null> {
  const review = await reviewRepo.findReviewByOrderId(orderId);
  if (!review) {
    return null;
  }

  // Authorization check
  if (user.role === UserRole.CUSTOMER && review.userId !== user.id) {
    throw new ReviewServiceError('Order not found', ReviewErrorCode.REVIEW_NOT_FOUND, 404);
  }

  if (
    user.role === UserRole.VENDOR &&
    review.store?.vendorProfileId !== user.vendorProfileId
  ) {
    throw new ReviewServiceError('Order not found', ReviewErrorCode.REVIEW_NOT_FOUND, 404);
  }

  return formatReview(review);
}

/**
 * Get review by ID
 */
export async function getReviewById(user: AuthUser, reviewId: string): Promise<ReviewDto> {
  const review = await reviewRepo.findReviewById(reviewId);
  if (!review) {
    throw new ReviewServiceError('Review not found', ReviewErrorCode.REVIEW_NOT_FOUND, 404);
  }

  if (user.role === UserRole.CUSTOMER && review.userId !== user.id) {
    throw new ReviewServiceError('Review not found', ReviewErrorCode.REVIEW_NOT_FOUND, 404);
  }

  if (
    user.role === UserRole.VENDOR &&
    review.store?.vendorProfileId !== user.vendorProfileId
  ) {
    throw new ReviewServiceError('Review not found', ReviewErrorCode.REVIEW_NOT_FOUND, 404);
  }

  return formatReview(review);
}

/**
 * Customer update own review
 */
export async function updateCustomerReview(
  userId: string,
  reviewId: string,
  input: UpdateReviewInput
): Promise<ReviewDto> {
  const review = await reviewRepo.findReviewById(reviewId);
  if (!review) {
    throw new ReviewServiceError('Review not found', ReviewErrorCode.REVIEW_NOT_FOUND, 404);
  }

  if (review.userId !== userId) {
    throw new ReviewServiceError(
      'You can only modify your own reviews',
      ReviewErrorCode.UNAUTHORIZED,
      403
    );
  }

  const updated = await reviewRepo.updateReviewTransaction(reviewId, input);
  return formatReview(updated);
}

/**
 * Customer delete own review (or Admin)
 */
export async function deleteCustomerReview(
  user: AuthUser,
  reviewId: string
): Promise<{ success: boolean }> {
  const review = await reviewRepo.findReviewById(reviewId);
  if (!review) {
    throw new ReviewServiceError('Review not found', ReviewErrorCode.REVIEW_NOT_FOUND, 404);
  }

  if (user.role !== UserRole.ADMIN && review.userId !== user.id) {
    throw new ReviewServiceError(
      'You can only delete your own reviews',
      ReviewErrorCode.UNAUTHORIZED,
      403
    );
  }

  await reviewRepo.deleteReviewTransaction(reviewId);
  return { success: true };
}

/**
 * Public Store Reviews with Aggregated Ratings
 */
export async function getStorePublicReviews(
  storeIdOrSlug: string,
  options: { page: number; pageSize: number }
): Promise<StoreReviewsResponseDto> {
  const store = await prisma.store.findFirst({
    where: {
      OR: [{ id: storeIdOrSlug }, { slug: storeIdOrSlug }],
    },
    select: { id: true, averageRating: true, totalReviews: true },
  });

  if (!store) {
    throw new ReviewServiceError('Store not found', ReviewErrorCode.STORE_NOT_FOUND, 404);
  }

  const { reviews, total } = await reviewRepo.findReviewsByStoreId(store.id, options);

  // Derive dynamic authoritative aggregation directly from Review records
  const agg = await prisma.review.aggregate({
    where: { storeId: store.id },
    _avg: { rating: true },
    _count: { id: true },
  });

  const averageRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0;
  const reviewCount = agg._count.id;

  return {
    reviews: reviews.map((r) => formatReview(r, true)),
    total,
    averageRating,
    reviewCount,
    page: options.page,
    pageSize: options.pageSize,
  };
}

/**
 * Vendor Reviews Scoped to Owned Stores
 */
export async function getVendorReviews(
  vendorProfileId: string,
  options: { storeId?: string; page: number; pageSize: number }
): Promise<{ reviews: ReviewDto[]; total: number; page: number; pageSize: number }> {
  if (options.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: options.storeId },
      select: { vendorProfileId: true },
    });

    if (!store || store.vendorProfileId !== vendorProfileId) {
      throw new ReviewServiceError('Store not found', ReviewErrorCode.STORE_NOT_FOUND, 404);
    }
  }

  const { reviews, total } = await reviewRepo.findReviewsByVendorProfileId(
    vendorProfileId,
    options
  );

  return {
    reviews: reviews.map((r) => formatReview(r, false)),
    total,
    page: options.page,
    pageSize: options.pageSize,
  };
}
