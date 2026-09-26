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
 * Humanitarian OpenStreetMap (HOT) Tile Provider (Default)
 * Free community tile service hosted by OpenStreetMap France.
 * - NO API key required.
 * - NO watermarks ("get api" notices).
 * - NO 403 Forbidden blocks.
 * - Clear street names, landmarks, and rich color contrast.
 */
export class OsmHotTileProvider implements IMapTileProvider {
  readonly name = 'OpenStreetMap Humanitarian';

  getTileConfig(): MapTileConfigDto {
    return {
      urlTemplate: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank" rel="noreferrer">Humanitarian OSM Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank" rel="noreferrer">OSM France</a>',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      minZoom: 1,
    };
  }
}

/**
 * OpenStreetMap France Standard Tile Provider
 * Free community tile service hosted by OpenStreetMap France without 403 blocks.
 */
export class OsmFranceTileProvider implements IMapTileProvider {
  readonly name = 'OpenStreetMap France';

  getTileConfig(): MapTileConfigDto {
    return {
      urlTemplate: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://openstreetmap.fr/" target="_blank" rel="noreferrer">OSM France</a>',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 20,
      minZoom: 1,
    };
  }
}

/**
 * ESRI World Street Map Provider
 * Clean, professional, high-performance global street map tiles.
 * - NO API key required.
 * - NO watermarks.
 * - Fast global CDN.
 */
export class EsriStreetTileProvider implements IMapTileProvider {
  readonly name = 'ESRI World Street Map';

  getTileConfig(): MapTileConfigDto {
    return {
      urlTemplate:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, TomTom',
      maxZoom: 19,
      minZoom: 1,
    };
  }
}

/**
 * Mapbox Custom Tile Provider (Optional, requires VITE_MAPBOX_TOKEN)
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
      // Fallback to OSM HOT if Mapbox token is absent
      return new OsmHotTileProvider().getTileConfig();
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
    case 'esri':
      return new EsriStreetTileProvider();
    case 'osmfr':
    case 'france':
      return new OsmFranceTileProvider();
    case 'hot':
    case 'osm_hot':
    default:
      // Default to OSM Humanitarian (HOT): 100% free, no API key, no watermarks, no 403 blocks
      return new OsmHotTileProvider();
  }
}
