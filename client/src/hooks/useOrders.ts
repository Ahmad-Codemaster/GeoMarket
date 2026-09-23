import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutApi, orderApi } from '../lib/api';
import { CART_QUERY_KEY } from './useCart';
import { CheckoutInputDto, OrderStatus } from '@geomarket/shared';

export const CUSTOMER_ORDERS_QUERY_KEY = ['customer', 'orders'] as const;
export const VENDOR_ORDERS_QUERY_KEY = ['vendor', 'orders'] as const;

export function useCheckout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutInputDto) => checkoutApi.checkout(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: CART_QUERY_KEY });
      qc.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
      if (data?.order?.id) {
        qc.setQueryData(['customer', 'order', data.order.id], data.order);
        qc.setQueryData(['order', data.order.id], data);
      }
    },
  });
}

export function useCustomerOrders(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...CUSTOMER_ORDERS_QUERY_KEY, { page, pageSize }],
    queryFn: () => orderApi.getCustomerOrders(page, pageSize),
  });
}

export function useCustomerOrder(orderId: string) {
  return useQuery({
    queryKey: ['customer', 'order', orderId],
    queryFn: async () => {
      const res = await orderApi.getCustomerOrder(orderId);
      return res.order;
    },
    enabled: !!orderId,
  });
}

export function useCancelCustomerOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderApi.cancelOrder(orderId),
    onSuccess: (_data, orderId) => {
      qc.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['customer', 'order', orderId] });
      qc.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useVendorOrders(params?: {
  storeId?: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: [...VENDOR_ORDERS_QUERY_KEY, params],
    queryFn: () => orderApi.getVendorOrders(params),
  });
}

export function useVendorOrder(orderId: string) {
  return useQuery({
    queryKey: ['vendor', 'order', orderId],
    queryFn: async () => {
      const res = await orderApi.getVendorOrder(orderId);
      return res.order;
    },
    enabled: !!orderId,
  });
}

export function useUpdateVendorOrderStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      orderApi.updateVendorOrderStatus(orderId, status),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: VENDOR_ORDERS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['vendor', 'order', orderId] });
    },
  });
}
