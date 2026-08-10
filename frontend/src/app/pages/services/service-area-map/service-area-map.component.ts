import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { CircleMarker, Map as LeafletMap } from 'leaflet';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

import { SERVICE_AREA_CONFIG } from './service-area.config';
import { ServiceAreaCoverageService } from './service-area-coverage.service';
import type { AddressSuggestion } from './service-area-coverage.service';

export { distanceInMiles } from './service-area-coverage.service';
export type { AddressSuggestion } from './service-area-coverage.service';

type LeafletApi = typeof import('leaflet');
type LeafletImport = LeafletApi & { readonly default?: LeafletApi };

interface CoverageResult {
  readonly kind: 'covered' | 'outside' | 'unavailable';
  readonly title: string;
  readonly detail: string;
}

@Component({
  selector: 'app-service-area-map',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './service-area-map.component.html',
  styleUrl: './service-area-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceAreaMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLElement>;

  private readonly coverageService = inject(ServiceAreaCoverageService);
  private readonly destroyRef = inject(DestroyRef);
  private map?: LeafletMap;
  private locationMarker?: CircleMarker;
  private leaflet?: LeafletApi;
  private selectedAddress?: AddressSuggestion;
  private blurTimer?: ReturnType<typeof setTimeout>;

  readonly addressControl = new FormControl('', { nonNullable: true });
  readonly suggestions = signal<readonly AddressSuggestion[]>([]);
  readonly suggestionsOpen = signal(false);
  readonly activeSuggestionIndex = signal(-1);
  readonly isSearching = signal(false);
  readonly mapUnavailable = signal(false);
  readonly coverageResult = signal<CoverageResult | null>(null);
  readonly minimumSearchLength = this.coverageService.minimumSearchLength;
  readonly coreRadiusMiles = SERVICE_AREA_CONFIG.coreRadiusMiles;

  constructor() {
    this.addressControl.valueChanges
      .pipe(
        map(value => value.trim()),
        tap(() => {
          this.selectedAddress = undefined;
          this.coverageResult.set(null);
          this.activeSuggestionIndex.set(-1);
        }),
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(query => this.searchAddresses(query)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(suggestions => {
        this.suggestions.set(suggestions);
        this.suggestionsOpen.set(suggestions.length > 0);
      });
  }

  ngAfterViewInit(): void {
    void this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
    this.map?.remove();
  }

  onAddressFocus(): void {
    if (this.suggestions().length > 0) {
      this.suggestionsOpen.set(true);
    }
  }

  onAddressBlur(): void {
    this.blurTimer = setTimeout(() => this.suggestionsOpen.set(false), 120);
  }

  onAddressKeydown(event: KeyboardEvent): void {
    const suggestions = this.suggestions();

    if (event.key === 'Escape') {
      this.suggestionsOpen.set(false);
      this.activeSuggestionIndex.set(-1);
      return;
    }

    if (suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.suggestionsOpen.set(true);
      this.activeSuggestionIndex.update(index => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.suggestionsOpen.set(true);
      this.activeSuggestionIndex.update(index =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );
    } else if (event.key === 'Enter' && this.suggestionsOpen()) {
      event.preventDefault();
      const index = this.activeSuggestionIndex() >= 0
        ? this.activeSuggestionIndex()
        : 0;
      this.selectSuggestion(suggestions[index]);
    }
  }

  checkCoverage(): void {
    if (this.selectedAddress) {
      this.evaluateCoverage(this.selectedAddress);
      return;
    }

    const suggestions = this.suggestions();
    if (suggestions.length > 0) {
      const index = this.activeSuggestionIndex() >= 0
        ? this.activeSuggestionIndex()
        : 0;
      this.selectSuggestion(suggestions[index]);
      return;
    }

    this.coverageResult.set({
      kind: 'unavailable',
      title: 'Choose a suggested address',
      detail: 'Enter at least four characters, then select an address so we can locate the property.'
    });
  }

  selectSuggestion(suggestion: AddressSuggestion): void {
    this.selectedAddress = suggestion;
    this.addressControl.setValue(suggestion.label, { emitEvent: false });
    this.suggestions.set([]);
    this.suggestionsOpen.set(false);
    this.activeSuggestionIndex.set(-1);
    this.evaluateCoverage(suggestion);
  }

  private searchAddresses(query: string) {
    if (query.length < this.minimumSearchLength) {
      this.isSearching.set(false);
      return of<readonly AddressSuggestion[]>([]);
    }

    this.isSearching.set(true);
    return this.coverageService.searchAddresses(query).pipe(
      catchError(() => {
        this.coverageResult.set({
          kind: 'unavailable',
          title: 'Address search is temporarily unavailable',
          detail: 'Please try again shortly or contact us and we will confirm service availability.'
        });
        return of<readonly AddressSuggestion[]>([]);
      }),
      finalize(() => this.isSearching.set(false))
    );
  }

  private evaluateCoverage(address: AddressSuggestion): void {
    const coverage = this.coverageService.evaluateAddress(address);

    if (coverage.kind === 'covered') {
      this.coverageResult.set({
        kind: 'covered',
        title: 'You appear to be in our core service area',
        detail: `${address.label} is approximately ${coverage.roundedDistanceMiles} miles from central Austin. Final availability is confirmed during estimate review.`
      });
    } else {
      this.coverageResult.set({
        kind: 'outside',
        title: 'Your property may still be serviceable',
        detail: `${address.label} is outside our ${SERVICE_AREA_CONFIG.coreRadiusMiles}-mile core area. We review regional and multi-property projects individually.`
      });
    }

    this.showAddressOnMap(address);
  }

  private async initializeMap(): Promise<void> {
    const container = this.mapContainer?.nativeElement;
    if (!container) {
      return;
    }

    try {
      const leaflet = await this.loadLeaflet();
      this.map = leaflet.map(container, {
        center: [SERVICE_AREA_CONFIG.center.lat, SERVICE_AREA_CONFIG.center.lng],
        zoom: 9,
        minZoom: 8,
        maxZoom: 18,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
        keyboard: true
      });

      leaflet.tileLayer(SERVICE_AREA_CONFIG.tileUrl, {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      }).addTo(this.map);

      const boundary = leaflet.circle(
        [SERVICE_AREA_CONFIG.center.lat, SERVICE_AREA_CONFIG.center.lng],
        {
          radius: SERVICE_AREA_CONFIG.coreRadiusMiles * 1609.344,
          color: '#1d4ed8',
          fillColor: '#3b82f6',
          fillOpacity: 0.16,
          opacity: 0.95,
          weight: 3
        }
      ).addTo(this.map);
      boundary.bindTooltip(`${SERVICE_AREA_CONFIG.coreRadiusMiles}-mile core service area`);

      for (const place of SERVICE_AREA_CONFIG.places) {
        const placeClassName = place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        leaflet.circleMarker([place.lat, place.lng], {
          radius: place.name === 'Austin' ? 6 : 3,
          color: '#172554',
          fillColor: place.name === 'Austin' ? '#f97316' : '#ffffff',
          fillOpacity: 1,
          weight: 2,
          interactive: false
        })
          .bindTooltip(place.name, {
            permanent: true,
            direction: 'top',
            className: `service-area-place-label service-area-place-label--${placeClassName}`
          })
          .addTo(this.map);
      }

      leaflet.control.scale({ imperial: true, metric: false }).addTo(this.map);
      this.map.fitBounds(boundary.getBounds(), { padding: [20, 20] });
      setTimeout(() => this.map?.invalidateSize(), 0);
    } catch (error) {
      console.error('Unable to initialize the service-area map.', error);
      this.mapUnavailable.set(true);
    }
  }

  private async showAddressOnMap(address: AddressSuggestion): Promise<void> {
    if (!this.map) {
      return;
    }

    const leaflet = await this.loadLeaflet();
    this.locationMarker?.remove();
    this.locationMarker = leaflet.circleMarker([address.lat, address.lng], {
      radius: 8,
      color: '#ffffff',
      fillColor: '#f97316',
      fillOpacity: 1,
      weight: 3
    })
      .bindTooltip('Checked property', { direction: 'top' })
      .addTo(this.map);
    this.map.flyTo([address.lat, address.lng], 12, { duration: 0.65 });
  }

  private async loadLeaflet(): Promise<LeafletApi> {
    if (this.leaflet) {
      return this.leaflet;
    }

    const leafletImport = await import('leaflet') as LeafletImport;
    this.leaflet = leafletImport.default ?? leafletImport;
    return this.leaflet;
  }
}
