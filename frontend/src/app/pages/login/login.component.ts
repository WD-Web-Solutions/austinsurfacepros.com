import { Component } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private readonly seoService: SeoService) {
    this.seoService.updatePage(
      'Login | Austin Surface Pros',
      'Austin Surface Pros account login.',
      'noindex, nofollow'
    );
  }

}
