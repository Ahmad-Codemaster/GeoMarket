import { useQuery } from '@tanstack/react-query';
import { discoveryApi, DiscoveryStoresParams, StoreProductsParams } from '../lib/api';

export const DISCOVERY_QUERY_KEYS = {
  stores: (params: DiscoveryStoresParams) => ['discovery', 'stores', params] as const,
  store: (idOrSlug: string, coords?: { latitude: number; longitude: number }) =>
    ['discovery', 'store', idOrSlug, coords] as const,
  products: (idOrSlug: string, params?: StoreProductsParams) =>
    ['discovery', 'store-products', idOrSlug, params] as const,
};

export function useDiscoveredStores(
  params: DiscoveryStoresParams | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: params ? DISCOVERY_QUERY_KEYS.stores(params) : ['discovery', 'stores', 'idle'],
    queryFn: async () => {
      if (!params) throw new Error('Parameters required');
      return discoveryApi.getStores(params);
    },
    enabled: Boolean(params && options?.enabled !== false),
    staleTime: 30 * 1000, // 30s
  });
}

export function useDiscoveredStore(
  idOrSlug: string,
  coords?: { latitude: number; longitude: number },
) {
  return useQuery({
    queryKey: DISCOVERY_QUERY_KEYS.store(idOrSlug, coords),
    queryFn: async () => {
      const res = await discoveryApi.getStore(idOrSlug, coords);
      return res.store;
    },
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
}

export function useStoreProducts(
  idOrSlug: string,
  params?: StoreProductsParams,
) {
  return useQuery({
    queryKey: DISCOVERY_QUERY_KEYS.products(idOrSlug, params),
    queryFn: async () => {
      return discoveryApi.getStoreProducts(idOrSlug, params);
    },
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
}
