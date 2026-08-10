import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ContactComponent } from './contact.component';

describe('ContactComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('gives each form control a persistent label and required state', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const requiredControlIds = [
      'contact-name',
      'contact-email',
      'contact-service',
      'contact-message'
    ];

    for (const id of requiredControlIds) {
      const control = element.querySelector<HTMLElement>(`#${id}`);
      const label = element.querySelector<HTMLLabelElement>(`label[for="${id}"]`);

      expect(control).not.toBeNull();
      expect(control?.hasAttribute('required')).toBe(true);
      expect(label?.textContent?.trim()).not.toBe('');
    }
  });

  it('announces invalid submission and focuses the first invalid control', async () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alert.textContent).toContain('Please correct the highlighted fields');
    expect((document.activeElement as HTMLElement | null)?.id).toBe('contact-name');
  });
});
