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

/**
 * CartoDB Voyager Tile Provider (Default)
 * High-performance, CDN-cached, modern map tiles for e-commerce and delivery maps.
 * Never blocked with 403 Forbidden.
 */
export class CartoTileProvider implements IMapTileProvider {
  readonly name = 'CartoDB Voyager';

  getTileConfig(): MapTileConfigDto {
    return {
      urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 20,
      minZoom: 1,
    };
  }
}

/**
 * CartoDB Positron (Light) Tile Provider
 */
export class CartoPositronTileProvider implements IMapTileProvider {
  readonly name = 'CartoDB Positron';

  getTileConfig(): MapTileConfigDto {
    return {
      urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 20,
      minZoom: 1,
    };
  }
}

/**
 * OpenStreetMap Tile Provider
 * Note: tile.openstreetmap.org often returns HTTP 403 Forbidden to deployed web applications.
 */
export class OpenStreetMapTileProvider implements IMapTileProvider {
  readonly name = 'OpenStreetMap';

  getTileConfig(): MapTileConfigDto {
    return {
      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      minZoom: 3,
    };
  }
}

/**
 * Mapbox Custom Vector/Raster Tile Provider
 */
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
      // Fallback to CartoDB Voyager if Mapbox token is absent
      return new CartoTileProvider().getTileConfig();
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
    case 'positron':
      return new CartoPositronTileProvider();
    case 'osm':
      return new OpenStreetMapTileProvider();
    case 'carto':
    case 'voyager':
    default:
      // Default to CartoDB Voyager (avoids OSM 403 Forbidden blocks)
      return new CartoTileProvider();
  }
}
