import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../lib/api';
import { AnalyticsPeriod } from '@geomarket/shared';

export const ANALYTICS_QUERY_KEY = ['vendor', 'analytics'] as const;

export function useVendorAnalytics(params?: { storeId?: string; period?: AnalyticsPeriod }) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await analyticsApi.getVendorAnalytics(params);
      return res.analytics;
    },
  });
}
