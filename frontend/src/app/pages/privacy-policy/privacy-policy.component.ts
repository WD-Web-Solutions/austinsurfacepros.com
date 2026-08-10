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
  constructor(seo: SeoService) {
    seo.updatePage(
      'Privacy Policy | Austin Surface Pros',
      'How Austin Surface Pros collects, uses, stores, and shares information, including local demo blog data.'
    );
  }
}
