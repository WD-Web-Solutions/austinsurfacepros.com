import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PublicLayoutComponent } from './public-layout.component';

describe('PublicLayoutComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('provides a skip link and one focusable main landmark', () => {
    const fixture = TestBed.createComponent(PublicLayoutComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const skipLink = element.querySelector<HTMLAnchorElement>('.skip-link');
    const mainLandmarks = element.querySelectorAll('main');

    expect(skipLink?.textContent).toContain('Skip to main content');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
    expect(mainLandmarks).toHaveLength(1);
    expect(mainLandmarks[0]?.getAttribute('tabindex')).toBe('-1');
  });

  it('moves focus to the main landmark after client-side route changes', async () => {
    const fixture = TestBed.createComponent(PublicLayoutComponent);
    fixture.detectChanges();

    fixture.componentInstance.onRouteActivate();
    fixture.componentInstance.onRouteActivate();
    await new Promise(resolve => setTimeout(resolve));

    expect(document.activeElement?.id).toBe('main-content');
  });
});
