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
      try {
        const res = await authApi.me();
        return res.user;
      } catch (err: any) {
        if (err?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
}

/** Login mutation — invalidates the auth query on success. */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: ({ user }) => {
      qc.setQueryData(AUTH_QUERY_KEY, user);
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
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
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
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
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['vendor'] });
    },
  });
}

/** Logout mutation — clears auth query cache on success. */
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(AUTH_QUERY_KEY, null);
      qc.clear(); // Clear all cached server state on logout
    },
  });
}

/** Guest session mutation — sets guest auth user in cache. */
export function useGuestSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: { firstName?: string; lastName?: string; phone?: string; email?: string }) =>
      authApi.guestSession(data),
    onSuccess: ({ user }) => {
      qc.setQueryData(AUTH_QUERY_KEY, user);
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
