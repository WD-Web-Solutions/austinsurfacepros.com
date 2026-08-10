export interface MapPoint {
  readonly lat: number;
  readonly lng: number;
}

export const SERVICE_AREA_CONFIG = {
  center: {
    lat: 30.2672,
    lng: -97.7431
  } satisfies MapPoint,
  coreRadiusMiles: 35,
  eligibilityRule: 'distance' as const,
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  geocoderUrl: 'https://photon.komoot.io/api/',
  searchBounds: '-98.45,29.55,-96.75,31.2',
  places: [
    { name: 'Austin', lat: 30.2672, lng: -97.7431 },
    { name: 'Cedar Park', lat: 30.5052, lng: -97.8203 },
    { name: 'Round Rock', lat: 30.5083, lng: -97.6789 },
    { name: 'Georgetown', lat: 30.6333, lng: -97.6779 },
    { name: 'Pflugerville', lat: 30.4394, lng: -97.62 },
    { name: 'Buda', lat: 30.0852, lng: -97.8403 },
    { name: 'Kyle', lat: 29.9891, lng: -97.8772 }
  ]
} as const;
