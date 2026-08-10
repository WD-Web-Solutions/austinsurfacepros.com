import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  AddressSuggestion,
  ServiceAreaMapComponent,
  distanceInMiles
} from './service-area-map.component';

describe('ServiceAreaMapComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceAreaMapComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  afterEach(() => vi.useRealTimers());

  it('provides an accessible map, address combobox, and collection notice', () => {
    const fixture = TestBed.createComponent(ServiceAreaMapComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#service-address');
    const map = element.querySelector<HTMLElement>('[aria-label*="core service area"]');

    expect(element.querySelector('h2')?.textContent).toContain('Local enough');
    expect(map?.getAttribute('role')).toBe('region');
    expect(input?.getAttribute('role')).toBe('combobox');
    expect(input?.getAttribute('aria-autocomplete')).toBe('list');
    expect(element.textContent).toContain('sends technical request data to OpenStreetMap');
    expect(element.textContent).toContain('your search text is sent to');
    expect(element.textContent).toContain('we do not save it');
    expect(element.querySelector('a[href="/privacy-policy"]')).not.toBeNull();
  });

  it('initializes Leaflet map controls without using the fallback', async () => {
    const fixture = TestBed.createComponent(ServiceAreaMapComponent);
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(
        fixture.nativeElement.querySelector('.leaflet-control-zoom-in')
      ).not.toBeNull();
    });

    expect(fixture.componentInstance.mapUnavailable()).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.service-area-place-label--austin')
    ).not.toBeNull();
  });

  it('offers Central Texas address suggestions after a short debounce', async () => {
    const fixture = TestBed.createComponent(ServiceAreaMapComponent);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();

    component.addressControl.setValue('100 Congress Avenue');
    await vi.advanceTimersByTimeAsync(350);

    const request = http.expectOne(candidate =>
      candidate.url === 'https://photon.komoot.io/api/' &&
      candidate.params.get('q') === '100 Congress Avenue'
    );
    expect(request.request.params.get('bbox')).toBe('-98.45,29.55,-96.75,31.2');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush({
      features: [
        {
          geometry: { type: 'Point', coordinates: [-97.7438, 30.2648] },
          properties: {
            housenumber: '100',
            street: 'Congress Avenue',
            city: 'Austin',
            state: 'Texas',
            postcode: '78701'
          }
        }
      ]
    });

    expect(component.suggestions()).toEqual([
      {
        label: '100 Congress Avenue, Austin, Texas 78701',
        addressLine: '100 Congress Avenue',
        city: 'Austin',
        state: 'Texas',
        lat: 30.2648,
        lng: -97.7438,
        postcode: '78701'
      }
    ]);
    http.verify();
  });

  it('classifies selected addresses using the provisional distance rule', () => {
    const fixture = TestBed.createComponent(ServiceAreaMapComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const downtownAddress: AddressSuggestion = {
      label: '100 Congress Ave, Austin, Texas 78701',
      lat: 30.2648,
      lng: -97.7438,
      postcode: '78701'
    };

    component.selectSuggestion(downtownAddress);
    fixture.detectChanges();

    expect(component.coverageResult()?.kind).toBe('covered');
    expect(fixture.nativeElement.textContent).toContain('core service area');
    expect(distanceInMiles(
      { lat: 30.2672, lng: -97.7431 },
      downtownAddress
    )).toBeLessThan(1);
  });
});
