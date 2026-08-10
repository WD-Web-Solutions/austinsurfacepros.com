import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DemoAuthService } from '../../../core/services/demo-auth.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(DemoAuthService).logout();
  });

  it('exposes the mobile menu name, state, and controlled region', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const menuButton = element.querySelector<HTMLButtonElement>(
      'button[aria-controls="mobile-navigation"]'
    );

    expect(menuButton?.getAttribute('aria-label')).toBe('Open main menu');
    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');

    menuButton?.click();
    fixture.detectChanges();

    expect(menuButton?.getAttribute('aria-label')).toBe('Close main menu');
    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');
    expect(
      element.querySelector('nav[aria-label="Mobile navigation"]')
    ).not.toBeNull();
  });

  it('closes the mobile menu when Escape is pressed', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.componentInstance.toggleMenu();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.mobileMenuOpen).toBe(false);
  });

  it('starts transparent on the home route and becomes filled after scrolling', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('header') as HTMLElement;

    expect(header.classList).toContain('site-navbar--home');
    expect(header.classList).toContain('site-navbar--transparent');

    fixture.componentInstance.onWindowScroll(40);
    fixture.detectChanges();

    expect(header.classList).not.toContain('site-navbar--transparent');
  });

  it('uses the filled header while the mobile menu is open', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    const menuButton = fixture.nativeElement.querySelector(
      'button[aria-controls="mobile-navigation"]'
    ) as HTMLButtonElement;

    menuButton.click();
    fixture.detectChanges();

    expect(header.classList).not.toContain('site-navbar--transparent');
    expect(
      fixture.nativeElement.querySelector('nav[aria-label="Mobile navigation"]')
    ).not.toBeNull();
  });

  it('does not link to the removed Resources page', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/resources"]')).toBeNull();
  });

  it('does not duplicate the Blog link for authenticated demo admins', () => {
    const auth = TestBed.inject(DemoAuthService);
    expect(auth.login(auth.demoEmail, auth.demoPassword)).toBe(true);

    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.componentInstance.toggleMenu();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const blogLinkLabels = Array.from(element.querySelectorAll<HTMLAnchorElement>('a[href="/blog"]'))
      .map(link => link.textContent?.trim());

    expect(blogLinkLabels).toEqual(['Blog', 'Blog']);
    expect(element.textContent).not.toContain('Manage Blog');
  });
});
