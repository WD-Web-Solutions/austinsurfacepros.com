import { Component, ChangeDetectionStrategy } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-terms',
  imports: [],
  templateUrl: './terms.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './terms.component.css'
})
export class TermsComponent {
  constructor(private readonly seoService: SeoService) {
    this.seoService.updatePage(
      'Terms & Conditions | Austin Surface Pros',
      'Review the website and service terms for Austin Surface Pros.'
    );
  }

}
