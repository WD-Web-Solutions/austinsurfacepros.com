import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ServicesComponent } from './services.component';

describe('ServicesComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('has a page heading and descriptive service links', () => {
    const fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const links = [
      ...element.querySelectorAll<HTMLAnchorElement>('a[aria-label]')
    ];

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h2')?.textContent).toContain('Available services');
    expect(links).toHaveLength(4);
    expect(links.every(link => link.getAttribute('aria-label')?.startsWith('Learn more about')))
      .toBe(true);
  });
});
