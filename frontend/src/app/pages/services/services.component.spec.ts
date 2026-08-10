import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ServicesComponent } from './services.component';

describe('ServicesComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('has a page heading and descriptive service links', () => {
    const fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const serviceLinks = [...element.querySelectorAll<HTMLAnchorElement>('a[aria-label]')];

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('#services-list-heading')?.textContent).toContain('Services built');
    expect(element.textContent).toContain('Local enough');
    expect(element.querySelector('input[role="combobox"]')).not.toBeNull();
    expect(element.querySelector('#service-area-checker')).not.toBeNull();
    expect(serviceLinks).toHaveLength(4);
    expect(serviceLinks.every(link => link.getAttribute('aria-label')?.startsWith('Learn more about')))
      .toBe(true);
  });

  it('renders the split comparison with before on the left and after on the right', () => {
    const fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const comparison = element.querySelector<HTMLInputElement>('#services-image-comparison');
    const beforeImage = element.querySelector<HTMLImageElement>('.services-reveal__image--before');
    const after = element.querySelector<HTMLElement>('.services-reveal__after');
    const afterImage = after?.querySelector<HTMLImageElement>('.services-reveal__image');

    expect(comparison).not.toBeNull();
    expect(comparison?.min).toBe('0');
    expect(comparison?.max).toBe('100');
    expect(comparison?.getAttribute('aria-valuetext')).toContain('50% before image');
    expect(beforeImage?.getAttribute('src')).toBe('/assets/images/services/parking-lot-before.jpg');
    expect(beforeImage?.getAttribute('alt')).toBe('');
    expect(afterImage?.getAttribute('src')).toBe('/assets/images/services/parking-lot-after.jpg');
    expect(afterImage?.getAttribute('alt')).toBe('');
    expect(after).not.toBeNull();

    if (comparison) {
      comparison.value = '65';
      comparison.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(fixture.componentInstance.revealPosition).toBe(65);
    expect(comparison?.getAttribute('aria-valuetext')).toContain('35% after image');

    if (comparison) {
      comparison.value = '100';
      comparison.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(fixture.componentInstance.revealPosition).toBe(100);
    expect(comparison?.getAttribute('aria-valuetext')).toContain('0% after image');
  });

  it('includes the workmanship promise and case-study layout', () => {
    const fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#warranty-heading')?.textContent).toContain('walk-through');
    expect(element.querySelector('.warranty__seal svg')).not.toBeNull();
    expect(element.querySelector('#case-study-heading')?.textContent).toContain('Keep the property moving');
    expect(element.querySelectorAll('.case-study__results div')).toHaveLength(3);
    expect(element.textContent).not.toContain('1,200 spaces');
  });

  it('maps pointer movement to the full comparison width', () => {
    const fixture = TestBed.createComponent(ServicesComponent);
    const component = fixture.componentInstance;
    const input = {
      focus: vi.fn(),
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      getBoundingClientRect: () => ({ left: 100, width: 1000 })
    } as unknown as HTMLInputElement;
    const event = {
      clientX: 850,
      currentTarget: input,
      pointerId: 7,
      preventDefault: vi.fn()
    } as unknown as PointerEvent;

    component.beginRevealDrag(event);

    expect(component.revealPosition).toBe(75);
    expect(input.setPointerCapture).toHaveBeenCalledWith(7);
    expect(event.preventDefault).toHaveBeenCalled();

    component.dragReveal({
      clientX: 500,
      currentTarget: input,
      pointerId: 7,
      preventDefault: vi.fn()
    } as unknown as PointerEvent);

    expect(component.revealPosition).toBe(40);
  });
});
