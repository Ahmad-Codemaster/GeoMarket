import L from 'leaflet';
import type { MapTileConfigDto } from '@geomarket/shared';

// Fix Leaflet's default marker icon path issue in bundlers (Vite/Webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface IMapTileProvider {
  readonly name: string;
  getTileConfig(): MapTileConfigDto;
}

export class OpenStreetMapTileProvider implements IMapTileProvider {
  readonly name = 'OpenStreetMap';

  getTileConfig(): MapTileConfigDto {
    return {
      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      minZoom: 3,
    };
  }
}

export class MapboxTileProvider implements IMapTileProvider {
  readonly name = 'Mapbox';
  private readonly token: string;
  private readonly styleId: string;

  constructor(token?: string, styleId: string = 'streets-v12') {
    this.token = token || (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';
    this.styleId = styleId;
  }

  getTileConfig(): MapTileConfigDto {
    if (!this.token) {
      // Fallback to OSM if token is absent
      return new OpenStreetMapTileProvider().getTileConfig();
    }

    return {
      urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/${this.styleId}/tiles/{z}/{x}/{y}?access_token=${this.token}`,
      attribution:
        '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      tileSize: 512,
      maxZoom: 22,
      minZoom: 1,
    };
  }
}

export function getActiveMapTileProvider(): IMapTileProvider {
  const providerKey = (import.meta as any).env?.VITE_MAP_TILE_PROVIDER?.toLowerCase();

  switch (providerKey) {
    case 'mapbox':
      return new MapboxTileProvider();
    case 'osm':
    default:
      return new OpenStreetMapTileProvider();
  }
}
