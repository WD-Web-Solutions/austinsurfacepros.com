import { Component, ChangeDetectionStrategy } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './privacy-policy.component.css'
})
export class PrivacyPolicyComponent {
  constructor(private readonly seoService: SeoService) {
    this.seoService.updatePage(
      'Privacy Policy | Austin Surface Pros',
      'Learn how Austin Surface Pros collects, uses, protects, and shares information submitted through this website.'
    );
  }

}
