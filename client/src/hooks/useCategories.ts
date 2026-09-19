import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../lib/api';
import type {
  CreateStoreCategoryDto,
  UpdateStoreCategoryDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from '@geomarket/shared';

export const STORE_CATEGORIES_QUERY_KEY = ['categories', 'stores'] as const;
export const PRODUCT_CATEGORIES_QUERY_KEY = ['categories', 'products'] as const;

// ─── Query Hooks ──────────────────────────────────────────────────────────────

export function useStoreCategories() {
  return useQuery({
    queryKey: STORE_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const res = await categoryApi.getStoreCategories();
      return res.categories;
    },
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: PRODUCT_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const res = await categoryApi.getProductCategories();
      return res.categories;
    },
  });
}

// ─── Admin Store Category Mutations ───────────────────────────────────────────

export function useAdminCreateStoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStoreCategoryDto) =>
      categoryApi.adminCreateStoreCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORE_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useAdminUpdateStoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreCategoryDto }) =>
      categoryApi.adminUpdateStoreCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORE_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useAdminDeleteStoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.adminDeleteStoreCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORE_CATEGORIES_QUERY_KEY });
    },
  });
}

// ─── Admin Product Category Mutations ─────────────────────────────────────────

export function useAdminCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductCategoryDto) =>
      categoryApi.adminCreateProductCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useAdminUpdateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductCategoryDto }) =>
      categoryApi.adminUpdateProductCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useAdminDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.adminDeleteProductCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_CATEGORIES_QUERY_KEY });
    },
  });
}
