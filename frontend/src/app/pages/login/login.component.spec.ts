import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent accessibility and privacy notice', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('labels required credentials and discloses browser storage', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    for (const id of ['login-email', 'login-password']) {
      expect(element.querySelector(`#${id}`)?.hasAttribute('required')).toBe(true);
      expect(element.querySelector(`label[for="${id}"]`)?.textContent?.trim()).not.toBe('');
    }

    expect(element.querySelector('#login-storage-note')?.textContent).toContain(
      'stores an access token and basic account details in this browser'
    );
    expect(element.querySelector<HTMLAnchorElement>('#login-storage-note a')?.getAttribute('href'))
      .toBe('/privacy-policy');
  });

  it('announces an invalid submission and focuses the email field', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Please correct the highlighted fields'
    );
    expect((document.activeElement as HTMLElement | null)?.id).toBe('login-email');
  });
});
