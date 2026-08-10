import { Component, ChangeDetectionStrategy } from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { DemoAuthService } from '../../../core/services/demo-auth.service';



@Component({

  selector: 'app-navbar',

  standalone: true,

  imports: [

    RouterLink,

    RouterLinkActive

  ],

  templateUrl:

    './navbar.component.html',

  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:

    './navbar.component.css'

})
export class NavbarComponent {

  constructor(readonly auth: DemoAuthService) {}


  mobileMenuOpen = false;



  toggleMenu(): void {

    this.mobileMenuOpen =
      !this.mobileMenuOpen;

  }



  closeMenu(): void {

    this.mobileMenuOpen =
      false;

  }

  logout(): void {
    this.auth.logout();
    this.closeMenu();
  }


}
