import { Component, ChangeDetectionStrategy } from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';



@Component({

  selector: 'app-navbar',

  standalone: true,

  imports: [

    RouterLink,

    RouterLinkActive

  ],

  templateUrl:

    './navbar.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:

    './navbar.component.css'

})
export class NavbarComponent {


  mobileMenuOpen = false;



  toggleMenu(): void {

    this.mobileMenuOpen =
      !this.mobileMenuOpen;

  }



  closeMenu(): void {

    this.mobileMenuOpen =
      false;

  }


}