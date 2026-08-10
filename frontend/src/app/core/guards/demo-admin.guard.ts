import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { DemoAuthService } from '../services/demo-auth.service';

export const demoAdminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(DemoAuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
