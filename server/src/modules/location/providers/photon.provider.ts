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

export class PhotonGeocodingProvider implements IGeocodingProvider {
  readonly name = 'PhotonGeocodingProvider';
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://photon.komoot.io') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async forwardGeocode(query: GeocodeQuery): Promise<GeocodingResult[]> {
    const url = new URL(`${this.baseUrl}/api`);
    url.searchParams.set('q', query.query);
    url.searchParams.set('limit', String(query.limit ?? 5));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new GeocodingRateLimitException(this.name);
      }

      if (!res.ok) {
        throw new GeocodingException(`Photon returned HTTP ${res.status}`, 'PROVIDER_ERROR', 502);
      }

      const data = (await res.json()) as any;
      const features = data.features || [];

      return features.map((feat: any) => this.mapPhotonFeature(feat));
    } catch (err: any) {
      if (err instanceof GeocodingException) throw err;
      throw new GeocodingException(err.message || 'Photon geocoding request failed', 'NETWORK_ERROR', 502);
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new GeocodingRateLimitException(this.name);
      }

      if (!res.ok) {
        throw new GeocodingException(`Photon returned HTTP ${res.status}`, 'PROVIDER_ERROR', 502);
      }

      const data = (await res.json()) as any;
      const features = data.features || [];

      if (!features.length) {
        throw new GeocodingZeroResultsException();
      }

      return this.mapPhotonFeature(features[0]);
    } catch (err: any) {
      if (err instanceof GeocodingException) throw err;
      throw new GeocodingException(err.message || 'Photon reverse geocoding failed', 'NETWORK_ERROR', 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapPhotonFeature(feat: any): GeocodingResult {
    const props = feat.properties || {};
    const coords = feat.geometry?.coordinates || [0, 0];
    const city = props.city || props.town || props.village || props.district || 'Unknown City';
    const street = props.street || props.name || '';
    const houseNumber = props.housenumber ? `${props.housenumber} ` : '';
    const addressLine = `${houseNumber}${street}`.trim() || city;

    const parts = [props.name, props.street, props.district, props.city, props.state, props.country].filter(
      Boolean,
    );

    return {
      formattedAddress: parts.join(', ') || addressLine,
      addressLine,
      city,
      stateProvince: props.state,
      postalCode: props.postcode,
      country: props.country || 'Unknown Country',
      latitude: coords[1],
      longitude: coords[0],
      providerMetadata: { osmId: props.osm_id, osmKey: props.osm_key },
    };
  }
}
