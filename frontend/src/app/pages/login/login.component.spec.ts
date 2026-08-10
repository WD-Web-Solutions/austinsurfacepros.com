import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DemoAuthService } from '../../core/services/demo-auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('autofills and accepts the local mock administrator credentials', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const auth = TestBed.inject(DemoAuthService);
    component.useDemoCredentials();
    expect(component.form.controls.email.value).toBe(auth.demoEmail);
    expect(component.form.controls.password.value).toBe(auth.demoPassword);
    component.submit();
    expect(auth.isAuthenticated()).toBe(true);
  });
});
