import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { RouterOutlet } from '@angular/router';

import { BlogSearchService } from './core/services/blog-search.service';


@Component({

  selector: 'app-root',

  standalone: true,

  imports: [

    RouterOutlet

  ],

  templateUrl:
    './app.component.html',

  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:
    './app.component.css'

})
export class AppComponent {
  private readonly blogSearch = inject(BlogSearchService);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    const warmSearch = (): void => {
      void this.blogSearch.preload();
    };
    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    };
    if (typeof browserWindow.requestIdleCallback === 'function') {
      browserWindow.requestIdleCallback(warmSearch, { timeout: 4000 });
    } else {
      globalThis.setTimeout(warmSearch, 1200);
    }
  }
}
