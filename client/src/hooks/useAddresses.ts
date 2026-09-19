import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressApi, locationApi } from '../lib/api';
import type {
  CreateAddressDto,
  UpdateAddressDto,
  ReverseGeocodeDto,
  ForwardGeocodeDto,
} from '@geomarket/shared';

export const ADDRESSES_QUERY_KEY = ['addresses'] as const;

export function useAddresses() {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: async () => {
      const res = await addressApi.list();
      return res.addresses;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressDto) => addressApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressDto }) =>
      addressApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.setDefault(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useReverseGeocode() {
  return useMutation({
    mutationFn: (coords: ReverseGeocodeDto) => locationApi.reverse(coords),
  });
}

export function useForwardGeocode() {
  return useMutation({
    mutationFn: (query: ForwardGeocodeDto) => locationApi.forward(query),
  });
}
