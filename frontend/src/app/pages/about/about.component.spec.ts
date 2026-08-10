import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('shows an explicit Matt and Wayne photo placeholder with one page heading', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const caption = element.querySelector('.about-photo-placeholder figcaption');

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(caption?.textContent?.trim()).toBe('insert picture of Matt and Wayne here');
  });

  it('presents neighborhood proof as a labeled service-area list', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector<HTMLElement>('.neighborhood-proof');
    const areas = section?.querySelectorAll('li');

    expect(section?.getAttribute('aria-labelledby')).toBe('neighborhood-heading');
    expect(section?.querySelector('h2')?.textContent).toContain('Central Texas');
    expect(areas).toHaveLength(4);
    expect(section?.textContent).toContain('Georgetown');
    expect(section?.querySelector('a')?.getAttribute('href')).toBe('/contact');
  });
});
