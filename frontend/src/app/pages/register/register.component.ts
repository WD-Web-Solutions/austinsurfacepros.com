import { Component } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  constructor(private readonly seoService: SeoService) {
    this.seoService.updatePage(
      'Register | Austin Surface Pros',
      'Austin Surface Pros account registration.',
      'noindex, nofollow'
    );
  }

}
