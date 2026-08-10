import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ServiceDetailComponent } from './service-detail.component';

describe('ServiceDetailComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ slug: 'not-a-real-service' })
            }
          }
        }
      ]
    }).compileComponents();
  });

  it('renders a useful page instead of an empty view for an unknown service', () => {
    const fixture = TestBed.createComponent(ServiceDetailComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain('Service not found');
    expect(element.querySelector<HTMLAnchorElement>('a')?.getAttribute('href'))
      .toBe('/services');
    expect(document.title).toBe('Service Not Found | Austin Surface Pros');
  });
});
