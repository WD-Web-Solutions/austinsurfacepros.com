import { Route, Routes } from '@angular/router';

import { routes } from './app.routes';

function flattenRoutes(routeList: Routes): Route[] {
  return routeList.flatMap(route => [route, ...flattenRoutes(route.children ?? [])]);
}

describe('public routes', () => {
  it('does not expose the removed Resources page', () => {
    const routePaths = flattenRoutes(routes).map(route => route.path);

    expect(routePaths).not.toContain('resources');
  });
});
