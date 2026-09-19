import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginInput, type RegisterCustomerInput, type RegisterVendorInput } from '../lib/api';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Single source of truth for the authenticated user.
 * Reads from GET /api/v1/auth/me via the HttpOnly cookie.
 * Returns undefined when unauthenticated (401).
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const res = await authApi.me();
      return res.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/** Login mutation — invalidates the auth query on success. */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: ({ user }) => {
      qc.setQueryData(AUTH_QUERY_KEY, user);
    },
  });
}

/** Customer registration mutation. */
export function useRegisterCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterCustomerInput) => authApi.registerCustomer(data),
    onSuccess: ({ user }) => {
      qc.setQueryData(AUTH_QUERY_KEY, user);
    },
  });
}

/** Vendor registration mutation. */
export function useRegisterVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterVendorInput) => authApi.registerVendor(data),
    onSuccess: ({ user }) => {
      qc.setQueryData(AUTH_QUERY_KEY, user);
    },
  });
}

/** Logout mutation — clears auth query cache on success. */
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(AUTH_QUERY_KEY, undefined);
      qc.clear(); // Clear all cached server state on logout
    },
  });
}
