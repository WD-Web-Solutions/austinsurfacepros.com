import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NavbarComponent } from './navbar.component';

describe('NavbarComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])]
    }).compileComponents();
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
});
