import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../lib/api';
import { CreateReviewDto, UpdateReviewDto } from '@geomarket/shared';

export const REVIEWS_QUERY_KEY = ['reviews'] as const;

export function useOrderReview(orderId: string, enabled = true) {
  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, 'order', orderId],
    queryFn: async () => {
      try {
        const res = await reviewApi.getOrderReview(orderId);
        return res.review;
      } catch (err: any) {
        if (err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!orderId && enabled,
    retry: false,
  });
}

export function useStoreReviews(storeId: string, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, 'store', storeId, { page, pageSize }],
    queryFn: () => reviewApi.getStoreReviews(storeId, page, pageSize),
    enabled: !!storeId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewDto) => reviewApi.createReview(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [...REVIEWS_QUERY_KEY, 'order', data.review.orderId] });
      qc.invalidateQueries({ queryKey: [...REVIEWS_QUERY_KEY, 'store', data.review.storeId] });
      qc.invalidateQueries({ queryKey: ['discovery'] });
      qc.invalidateQueries({ queryKey: ['customer', 'orders'] });
      qc.invalidateQueries({ queryKey: ['customer', 'order', data.review.orderId] });
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: UpdateReviewDto }) =>
      reviewApi.updateReview(reviewId, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [...REVIEWS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.deleteReview(reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...REVIEWS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
}
