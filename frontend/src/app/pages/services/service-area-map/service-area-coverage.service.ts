import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { SERVICE_AREA_CONFIG } from './service-area.config';
import type { MapPoint } from './service-area.config';

interface PhotonFeature {
  readonly geometry?: {
    readonly coordinates?: readonly number[];
    readonly type?: string;
  };
  readonly properties?: {
    readonly city?: string;
    readonly county?: string;
    readonly district?: string;
    readonly housenumber?: string;
    readonly name?: string;
    readonly postcode?: string;
    readonly state?: string;
    readonly street?: string;
  };
}

interface PhotonResponse {
  readonly features?: readonly PhotonFeature[];
}

export interface AddressSuggestion extends MapPoint {
  readonly label: string;
  readonly addressLine?: string;
  readonly city?: string;
  readonly state?: string;
  readonly postcode?: string;
}

export interface AddressCoverage {
  readonly address: AddressSuggestion;
  readonly distanceMiles: number;
  readonly roundedDistanceMiles: number;
  readonly kind: 'covered' | 'outside';
}

const EARTH_RADIUS_MILES = 3958.8;

export function distanceInMiles(from: MapPoint, to: MapPoint): number {
  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(haversine));
}

@Injectable({ providedIn: 'root' })
export class ServiceAreaCoverageService {
  readonly minimumSearchLength = 4;
  readonly coreRadiusMiles = SERVICE_AREA_CONFIG.coreRadiusMiles;

  constructor(private readonly http: HttpClient) {}

  searchAddresses(query: string): Observable<readonly AddressSuggestion[]> {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < this.minimumSearchLength) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', trimmedQuery)
      .set('lat', SERVICE_AREA_CONFIG.center.lat)
      .set('lon', SERVICE_AREA_CONFIG.center.lng)
      .set('bbox', SERVICE_AREA_CONFIG.searchBounds)
      .set('limit', 5)
      .set('lang', 'en');

    return this.http.get<PhotonResponse>(SERVICE_AREA_CONFIG.geocoderUrl, { params }).pipe(
      map(response => this.toAddressSuggestions(response))
    );
  }

  evaluateAddress(address: AddressSuggestion): AddressCoverage {
    const distanceMiles = distanceInMiles(SERVICE_AREA_CONFIG.center, address);
    return {
      address,
      distanceMiles,
      roundedDistanceMiles: Math.round(distanceMiles),
      kind: distanceMiles <= this.coreRadiusMiles ? 'covered' : 'outside'
    };
  }

  private toAddressSuggestions(response: PhotonResponse): readonly AddressSuggestion[] {
    return (response.features ?? [])
      .map(feature => this.toAddressSuggestion(feature))
      .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null)
      .filter((suggestion, index, suggestions) =>
        suggestions.findIndex(item => item.label === suggestion.label) === index
      );
  }

  private toAddressSuggestion(feature: PhotonFeature): AddressSuggestion | null {
    const coordinates = feature.geometry?.coordinates;
    const properties = feature.properties;

    if (
      feature.geometry?.type !== 'Point' ||
      !coordinates ||
      coordinates.length < 2 ||
      !properties ||
      typeof coordinates[0] !== 'number' ||
      typeof coordinates[1] !== 'number'
    ) {
      return null;
    }

    const streetName = properties.street ?? properties.name;
    const addressLine = [properties.housenumber, streetName].filter(Boolean).join(' ');
    const city = properties.city ?? properties.district ?? properties.county;
    const stateAndPostcode = [properties.state, properties.postcode].filter(Boolean).join(' ');
    const label = [...new Set([addressLine, city, stateAndPostcode].filter(Boolean))].join(', ');

    if (!label) {
      return null;
    }

    return {
      label,
      addressLine: addressLine || undefined,
      city,
      state: properties.state,
      lat: coordinates[1],
      lng: coordinates[0],
      postcode: properties.postcode
    };
  }
}
