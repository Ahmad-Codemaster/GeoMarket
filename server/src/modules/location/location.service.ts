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

  const primary = getGeocodingProvider();
  try {
    const result = await primary.reverseGeocode({
      latitude: input.latitude,
      longitude: input.longitude,
    });
    reverseCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (primaryErr) {
    // If primary failed (e.g. Nominatim 429 rate limit or 502 error), fallback to Photon
    if (!(primary instanceof PhotonGeocodingProvider)) {
      try {
        const photon = new PhotonGeocodingProvider();
        const result = await photon.reverseGeocode({
          latitude: input.latitude,
          longitude: input.longitude,
        });
        reverseCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      } catch (photonErr) {
        // Fall through to safe fallback
      }
    }

    // Graceful fallback: return a valid GeocodingResult using the coordinates
    const fallbackResult: GeocodingResult = {
      formattedAddress: `Delivery Pin (${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)})`,
      addressLine: `Pin (${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)})`,
      city: 'Faisalabad',
      country: 'Pakistan',
      latitude: input.latitude,
      longitude: input.longitude,
    };
    return fallbackResult;
  }
}

export async function forwardGeocode(input: ForwardGeocodeInput): Promise<GeocodingResult[]> {
  const primary = getGeocodingProvider();
  try {
    const results = await primary.forwardGeocode({
      query: input.query,
      limit: input.limit,
    });
    if (results && results.length > 0) return results;
  } catch {
    // Fall through to Photon fallback
  }

  if (!(primary instanceof PhotonGeocodingProvider)) {
    try {
      const photon = new PhotonGeocodingProvider();
      return await photon.forwardGeocode({
        query: input.query,
        limit: input.limit,
      });
    } catch {
      return [];
    }
  }

  return [];
}
