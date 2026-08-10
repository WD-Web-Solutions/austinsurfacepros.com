import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LocalBlogService } from '../../core/services/local-blog.service';
import { HomeComponent } from './home.component';

describe('HomeComponent hero', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: LocalBlogService,
          useValue: { getPublishedPosts: async () => [] }
        }
      ]
    }).compileComponents();
  });

  it('renders the Austin Night hero with a single descriptive heading', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const headings = element.querySelectorAll('h1');
    const heroImage = element.querySelector<HTMLImageElement>('.home-night-hero__image');

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toContain('without interrupting it');
    expect(heroImage?.alt).toContain('Austin skyline');
    expect(element.querySelector('app-hero-video')).toBeNull();
  });

  it('links the primary Request Estimate action to the contact page', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const cta = fixture.nativeElement.querySelector(
      '.home-night-hero__cta'
    ) as HTMLAnchorElement;

    expect(cta.textContent).toContain('Request Estimate');
    expect(cta.getAttribute('href')).toBe('/contact');
  });

  it('presents Austin metro service areas as a labeled list', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector<HTMLElement>('.home-service-areas');
    const areas = Array.from(section?.querySelectorAll('li') ?? []).map(item =>
      item.textContent?.trim()
    );

    expect(section?.getAttribute('aria-labelledby')).toBe('home-service-areas-heading');
    expect(section?.querySelector('h2')?.textContent).toContain('Austin metro');
    expect(section?.querySelector('ul')?.getAttribute('aria-label')).toBe(
      'Austin metro service areas'
    );
    expect(areas).toEqual([
      'Austin, Texas',
      'Cedar Park, Texas',
      'Round Rock, Texas',
      'Georgetown, Texas',
      'Pflugerville, Texas',
      'Buda, Texas',
      'Kyle, Texas'
    ]);
    expect(section?.querySelector('a')?.getAttribute('href')).toBe('/services');
  });
});
