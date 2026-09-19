export interface GeocodeQuery {
  query: string;
  limit?: number;
  countryCodes?: string[];
}

export interface ReverseGeocodeQuery {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  formattedAddress: string;
  addressLine: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  providerMetadata?: Record<string, unknown>;
}

export interface IGeocodingProvider {
  readonly name: string;
  forwardGeocode(query: GeocodeQuery): Promise<GeocodingResult[]>;
  reverseGeocode(coords: ReverseGeocodeQuery): Promise<GeocodingResult>;
}

export class GeocodingException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = 'GeocodingException';
  }
}

export class GeocodingRateLimitException extends GeocodingException {
  constructor(providerName: string) {
    super(`Rate limit exceeded for geocoding provider: ${providerName}`, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class GeocodingZeroResultsException extends GeocodingException {
  constructor() {
    super('No geographic match found for the requested input', 'ZERO_RESULTS', 404);
  }
}

export class InvalidCoordinatesException extends GeocodingException {
  constructor(message: string) {
    super(message, 'INVALID_COORDINATES', 400);
  }
}
