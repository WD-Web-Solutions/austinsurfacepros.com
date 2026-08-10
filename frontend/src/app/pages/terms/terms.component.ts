import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeroVideoComponent } from '../../shared/components/hero-video/hero-video.component';

import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-terms',
  imports: [HeroVideoComponent],
  templateUrl: './terms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
