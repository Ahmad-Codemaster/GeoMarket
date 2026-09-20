import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../lib/api';
import { useCurrentUser } from './useAuth';
import { UserRole, AddToCartDto } from '@geomarket/shared';

export const CART_QUERY_KEY = ['cart'] as const;

/**
 * Hook to fetch the customer's shopping cart.
 * Derived from server state with TanStack Query.
 */
export function useCart() {
  const { data: user } = useCurrentUser();
  const isCustomer = user?.role === UserRole.CUSTOMER;

  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const res = await cartApi.getCart();
      return res.cart;
    },
    enabled: !!user && isCustomer,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation to add a product to the cart.
 */
export function useAddToCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToCartDto) => cartApi.addToCart(data),
    onSuccess: (res) => {
      qc.setQueryData(CART_QUERY_KEY, res.cart);
    },
  });
}

/**
 * Mutation to update a line item's quantity.
 */
export function useUpdateCartItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateCartItem(itemId, { quantity }),
    onSuccess: (res) => {
      qc.setQueryData(CART_QUERY_KEY, res.cart);
    },
  });
}

/**
 * Mutation to remove a line item from the cart.
 */
export function useRemoveCartItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeCartItem(itemId),
    onSuccess: (res) => {
      qc.setQueryData(CART_QUERY_KEY, res.cart);
    },
  });
}

/**
 * Mutation to clear the entire cart.
 */
export function useClearCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: (res) => {
      qc.setQueryData(CART_QUERY_KEY, res.cart);
    },
  });
}
