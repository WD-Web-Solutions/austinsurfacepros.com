import {
  Component,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';

import { DOCUMENT } from '@angular/common';

import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './navbar/navbar.component';

import { FooterComponent } from './footer/footer.component';


@Component({

  selector: 'app-public-layout',

  standalone: true,

  imports: [

    RouterOutlet,

    NavbarComponent,

    FooterComponent

  ],

  templateUrl:
    './public-layout.component.html',

  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:
    './public-layout.component.css'

})
export class PublicLayoutComponent {
  constructor(@Inject(DOCUMENT) private readonly document: Document) {}
  private hasActivatedRoute = false;

  onRouteActivate(): void {
    if (!this.hasActivatedRoute) {
      this.hasActivatedRoute = true;
      return;
    }

    setTimeout(() => {
      this.document.getElementById('main-content')?.focus();
    });
  }


}
