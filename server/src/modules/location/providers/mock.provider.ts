import {
  IGeocodingProvider,
  GeocodeQuery,
  ReverseGeocodeQuery,
  GeocodingResult,
  GeocodingZeroResultsException,
  InvalidCoordinatesException,
} from '../location.types';

export class MockGeocodingProvider implements IGeocodingProvider {
  readonly name = 'MockGeocodingProvider';

  async forwardGeocode(query: GeocodeQuery): Promise<GeocodingResult[]> {
    const q = query.query.toLowerCase().trim();

    if (q === 'notfound' || q === 'nowhere') {
      return [];
    }

    if (q.includes('faisalabad') || q.includes('d ground')) {
      return [
        {
          formattedAddress: 'D Ground, Peoples Colony No 1, Faisalabad, Punjab, Pakistan',
          addressLine: 'D Ground Commercial Market',
          city: 'Faisalabad',
          stateProvince: 'Punjab',
          postalCode: '38000',
          country: 'Pakistan',
          latitude: 31.4124,
          longitude: 73.1091,
        },
      ];
    }

    // Default mock result for generic queries
    return [
      {
        formattedAddress: `${query.query}, Faisalabad, Punjab, Pakistan`,
        addressLine: query.query,
        city: 'Faisalabad',
        stateProvince: 'Punjab',
        postalCode: '38000',
        country: 'Pakistan',
        latitude: 31.418,
        longitude: 73.079,
      },
    ];
  }

  async reverseGeocode(coords: ReverseGeocodeQuery): Promise<GeocodingResult> {
    if (coords.latitude < -90 || coords.latitude > 90 || coords.longitude < -180 || coords.longitude > 180) {
      throw new InvalidCoordinatesException('Coordinates out of global bounds');
    }

    // Deterministic mock responses based on coordinates
    if (Math.abs(coords.latitude - 31.4124) < 0.05 && Math.abs(coords.longitude - 73.1091) < 0.05) {
      return {
        formattedAddress: 'D Ground, Peoples Colony No 1, Faisalabad, Punjab, Pakistan',
        addressLine: 'D Ground Commercial Area',
        city: 'Faisalabad',
        stateProvince: 'Punjab',
        postalCode: '38000',
        country: 'Pakistan',
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }

    return {
      formattedAddress: `Street Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}), Faisalabad, Pakistan`,
      addressLine: `Street Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
      city: 'Faisalabad',
      stateProvince: 'Punjab',
      country: 'Pakistan',
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }
}
