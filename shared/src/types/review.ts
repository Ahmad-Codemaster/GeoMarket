export enum ReviewErrorCode {
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_NOT_DELIVERED = 'ORDER_NOT_DELIVERED',
  NOT_ORDER_OWNER = 'NOT_ORDER_OWNER',
  ORDER_ALREADY_REVIEWED = 'ORDER_ALREADY_REVIEWED',
  VENDOR_CANNOT_REVIEW = 'VENDOR_CANNOT_REVIEW',
  INVALID_RATING = 'INVALID_RATING',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  INVALID_STORE_ORDER = 'INVALID_STORE_ORDER',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export interface ReviewDto {
  id: string;
  orderId?: string;
  userId?: string;
  storeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  storeName?: string;
}

export interface CreateReviewDto {
  orderId: string;
  storeId?: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface StoreReviewsResponseDto {
  reviews: ReviewDto[];
  total: number;
  averageRating: number;
  reviewCount: number;
  page: number;
  pageSize: number;
}
