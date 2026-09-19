import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorStoreApi, adminStoreApi, type AdminStoreFilters } from '../lib/api';
import type {
  CreateStoreDto,
  UpdateStoreDto,
  OperatingHourItemDto,
} from '@geomarket/shared';

export const VENDOR_STORES_QUERY_KEY = ['vendor', 'stores'] as const;
export const ADMIN_STORES_QUERY_KEY = ['admin', 'stores'] as const;

// ─── Vendor Hooks ─────────────────────────────────────────────────────────────

export function useVendorStores() {
  return useQuery({
    queryKey: VENDOR_STORES_QUERY_KEY,
    queryFn: async () => {
      const res = await vendorStoreApi.list();
      return res.stores;
    },
  });
}

export function useVendorStore(id: string | undefined | null) {
  return useQuery({
    queryKey: [...VENDOR_STORES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID required');
      const res = await vendorStoreApi.get(id);
      return res.store;
    },
    enabled: !!id,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStoreDto) => vendorStoreApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_STORES_QUERY_KEY });
    },
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreDto }) =>
      vendorStoreApi.update(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: VENDOR_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...VENDOR_STORES_QUERY_KEY, variables.id] });
    },
  });
}

export function useToggleStoreOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorStoreApi.toggleOrders(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: VENDOR_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...VENDOR_STORES_QUERY_KEY, id] });
    },
  });
}

export function useUpdateStoreOperatingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hours }: { id: string; hours: OperatingHourItemDto[] }) =>
      vendorStoreApi.updateOperatingHours(id, hours),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: VENDOR_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...VENDOR_STORES_QUERY_KEY, variables.id] });
    },
  });
}

export function useResubmitStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorStoreApi.resubmit(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: VENDOR_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...VENDOR_STORES_QUERY_KEY, id] });
    },
  });
}

// ─── Admin Hooks ──────────────────────────────────────────────────────────────

export function useAdminStores(filters?: AdminStoreFilters) {
  return useQuery({
    queryKey: [...ADMIN_STORES_QUERY_KEY, filters],
    queryFn: async () => {
      const res = await adminStoreApi.list(filters);
      return res.stores;
    },
  });
}

export function useAdminStore(id: string | undefined | null) {
  return useQuery({
    queryKey: [...ADMIN_STORES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID required');
      const res = await adminStoreApi.get(id);
      return res.store;
    },
    enabled: !!id,
  });
}

export function useApproveStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminStoreApi.approve(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...ADMIN_STORES_QUERY_KEY, id] });
    },
  });
}

export function useRejectStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminStoreApi.reject(id, reason),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...ADMIN_STORES_QUERY_KEY, variables.id] });
    },
  });
}

export function useSuspendStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminStoreApi.suspend(id, reason),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...ADMIN_STORES_QUERY_KEY, variables.id] });
    },
  });
}

export function useRestoreStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminStoreApi.restore(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...ADMIN_STORES_QUERY_KEY, id] });
    },
  });
}
