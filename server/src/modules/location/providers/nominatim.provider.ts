import {
  IGeocodingProvider,
  GeocodeQuery,
  ReverseGeocodeQuery,
  GeocodingResult,
  GeocodingException,
  GeocodingRateLimitException,
  GeocodingZeroResultsException,
  InvalidCoordinatesException,
} from '../location.types';

export class NominatimGeocodingProvider implements IGeocodingProvider {
  readonly name = 'NominatimGeocodingProvider';
  private readonly baseUrl: string;
  private readonly userAgent: string;

  constructor(
    baseUrl: string = 'https://nominatim.openstreetmap.org',
    userAgent: string = 'GeoMarket-Academic-App/2.0 (contact: support@geomarket.local)',
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.userAgent = userAgent;
  }

  async forwardGeocode(query: GeocodeQuery): Promise<GeocodingResult[]> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set('q', query.query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', String(query.limit ?? 5));
    if (query.countryCodes && query.countryCodes.length > 0) {
      url.searchParams.set('countrycodes', query.countryCodes.join(','));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new GeocodingRateLimitException(this.name);
      }

      if (!res.ok) {
        throw new GeocodingException(`Nominatim returned HTTP ${res.status}`, 'PROVIDER_ERROR', 502);
      }

      const data = (await res.json()) as any[];
      return data.map((item) => this.mapNominatimItem(item));
    } catch (err: any) {
      if (err instanceof GeocodingException) throw err;
      throw new GeocodingException(err.message || 'Geocoding request failed', 'NETWORK_ERROR', 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  async reverseGeocode(coords: ReverseGeocodeQuery): Promise<GeocodingResult> {
    if (coords.latitude < -90 || coords.latitude > 90 || coords.longitude < -180 || coords.longitude > 180) {
      throw new InvalidCoordinatesException('Coordinates out of global bounds');
    }

    const url = new URL(`${this.baseUrl}/reverse`);
    url.searchParams.set('lat', String(coords.latitude));
    url.searchParams.set('lon', String(coords.longitude));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new GeocodingRateLimitException(this.name);
      }

      if (!res.ok) {
        throw new GeocodingException(`Nominatim returned HTTP ${res.status}`, 'PROVIDER_ERROR', 502);
      }

      const item = (await res.json()) as any;
      if (!item || item.error) {
        throw new GeocodingZeroResultsException();
      }

      return this.mapNominatimItem(item);
    } catch (err: any) {
      if (err instanceof GeocodingException) throw err;
      throw new GeocodingException(err.message || 'Reverse geocoding failed', 'NETWORK_ERROR', 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapNominatimItem(item: any): GeocodingResult {
    const addr = item.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Unknown City';
    const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || item.name || '';
    const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
    const addressLine = `${houseNumber}${road}`.trim() || item.display_name.split(',')[0] || 'Address';

    return {
      formattedAddress: item.display_name,
      addressLine,
      city,
      stateProvince: addr.state || addr.province,
      postalCode: addr.postcode,
      country: addr.country || 'Unknown Country',
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      providerMetadata: { placeId: item.place_id, osmType: item.osm_type },
    };
  }
}
