import { Injectable, computed, signal } from '@angular/core';

import { environment } from '../../../environments/environment';

const SESSION_KEY = 'asp-demo-admin-session';

@Injectable({ providedIn: 'root' })
export class DemoAuthService {
  private readonly authenticatedState = signal(this.readSession());

  readonly isAuthenticated = computed(() => this.authenticatedState());
  readonly isDemo = environment.demo;
  readonly demoEmail = environment.blog.demoAdminEmail;
  readonly demoPassword = environment.blog.demoAdminPassword;

  login(email: string, password: string): boolean {
    if (!environment.demo || email.trim().toLowerCase() !== this.demoEmail || password !== this.demoPassword) {
      return false;
    }
    sessionStorage.setItem(SESSION_KEY, 'true');
    this.authenticatedState.set(true);
    return true;
  }

  logout(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
    this.authenticatedState.set(false);
  }

  private readSession(): boolean {
    return environment.demo && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === 'true';
  }
}
