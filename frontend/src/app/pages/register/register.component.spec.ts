import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterComponent } from './register.component';

describe('RegisterComponent accessibility and privacy notice', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('labels every required field and explains how account data is used', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    for (const id of [
      'registration-name',
      'registration-email',
      'registration-password',
      'registration-confirm-password'
    ]) {
      expect(element.querySelector(`#${id}`)?.hasAttribute('required')).toBe(true);
      expect(element.querySelector(`label[for="${id}"]`)?.textContent?.trim()).not.toBe('');
    }

    const notice = element.querySelector('#registration-privacy-note');
    expect(notice?.textContent).toContain('use your name and email to create and administer your account');
    expect(notice?.textContent).toContain('stores an access token and basic account details');
    expect(notice?.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe('/privacy-policy');
  });

  it('announces an invalid submission and focuses the name field', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Please correct the highlighted fields'
    );
    expect((document.activeElement as HTMLElement | null)?.id).toBe('registration-name');
  });
});
