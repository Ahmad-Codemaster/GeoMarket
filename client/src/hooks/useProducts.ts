import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorProductApi, type VendorProductFilters } from '../lib/api';
import type {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
} from '@geomarket/shared';

export const VENDOR_PRODUCTS_QUERY_KEY = ['vendor', 'products'] as const;

export function useVendorProducts(filters?: VendorProductFilters) {
  return useQuery({
    queryKey: [...VENDOR_PRODUCTS_QUERY_KEY, filters],
    queryFn: async () => {
      const res = await vendorProductApi.list(filters);
      return res.products;
    },
  });
}

export function useStoreProducts(storeId: string | undefined | null) {
  return useQuery({
    queryKey: [...VENDOR_PRODUCTS_QUERY_KEY, 'store', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID required');
      const res = await vendorProductApi.listByStore(storeId);
      return res.products;
    },
    enabled: !!storeId,
  });
}

export function useProduct(productId: string | undefined | null) {
  return useQuery({
    queryKey: [...VENDOR_PRODUCTS_QUERY_KEY, 'detail', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID required');
      const res = await vendorProductApi.get(productId);
      return res.product;
    },
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, data }: { storeId: string; data: CreateProductDto }) =>
      vendorProductApi.create(storeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: UpdateProductDto }) =>
      vendorProductApi.update(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => vendorProductApi.delete(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useToggleProductActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive?: boolean }) =>
      vendorProductApi.toggleActive(productId, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useUpdateProductStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: UpdateStockDto }) =>
      vendorProductApi.updateStock(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_PRODUCTS_QUERY_KEY });
    },
  });
}
