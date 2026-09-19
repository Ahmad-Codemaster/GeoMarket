import { IGeocodingProvider, GeocodingResult } from './location.types';
import { NominatimGeocodingProvider } from './providers/nominatim.provider';
import { PhotonGeocodingProvider } from './providers/photon.provider';
import { MockGeocodingProvider } from './providers/mock.provider';
import { ReverseGeocodeInput, ForwardGeocodeInput } from './location.schemas';

// Simple in-memory cache for reverse geocode queries (lat,lon rounded to 4 decimals ~ 11m)
const reverseCache = new Map<string, { result: GeocodingResult; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let customProvider: IGeocodingProvider | null = null;

export function getGeocodingProvider(): IGeocodingProvider {
  if (customProvider) return customProvider;

  const providerType = process.env.GEOCODING_PROVIDER?.toLowerCase() || 'nominatim';

  switch (providerType) {
    case 'mock':
      return new MockGeocodingProvider();
    case 'photon':
      return new PhotonGeocodingProvider();
    case 'nominatim':
    default:
      return new NominatimGeocodingProvider(
        process.env.NOMINATIM_URL,
        process.env.GEOCODING_USER_AGENT,
      );
  }
}

export function setGeocodingProvider(provider: IGeocodingProvider | null) {
  customProvider = provider;
}

export async function reverseGeocode(input: ReverseGeocodeInput): Promise<GeocodingResult> {
  const cacheKey = `${input.latitude.toFixed(4)},${input.longitude.toFixed(4)}`;
  const cached = reverseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const provider = getGeocodingProvider();
  const result = await provider.reverseGeocode({
    latitude: input.latitude,
    longitude: input.longitude,
  });

  reverseCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export async function forwardGeocode(input: ForwardGeocodeInput): Promise<GeocodingResult[]> {
  const provider = getGeocodingProvider();
  return provider.forwardGeocode({
    query: input.query,
    limit: input.limit,
  });
}
