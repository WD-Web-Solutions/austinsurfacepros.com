import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DemoAuthService } from '../../core/services/demo-auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent demo authentication', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  afterEach(() => sessionStorage.clear());

  it('autofills and accepts the local mock administrator credentials', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const auth = TestBed.inject(DemoAuthService);

    component.useDemoCredentials();
    expect(component.loginForm.controls.emailAddress.value).toBe(auth.demoEmail);
    expect(component.loginForm.controls.password.value).toBe(auth.demoPassword);
    component.submitLoginForm();
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('labels required credentials and discloses session and IndexedDB storage', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    for (const id of ['demo-email', 'demo-password']) {
      expect(element.querySelector(`#${id}`)?.hasAttribute('required')).toBe(true);
      expect(element.querySelector(`label[for="${id}"]`)?.textContent?.trim()).not.toBe('');
    }
    const notice = element.querySelector('#demo-login-storage-note')?.textContent ?? '';
    expect(notice).toContain('tab session');
    expect(notice).toContain('IndexedDB');
  });
});
