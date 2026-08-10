import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('does not link to removed or development-only pages', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/resources"]')).toBeNull();
    expect(element.querySelector('a[href="/design-lab"]')).toBeNull();
  });

  it('links to the admin login from the footer navigation', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const adminLink = element.querySelector<HTMLAnchorElement>(
      'nav[aria-label="Footer navigation"] a[href="/login"]'
    );

    expect(adminLink?.textContent?.trim()).toBe('Admin');
  });
});
