import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RESOURCES } from '../../core/data/resources.data';
import { HeroVideoComponent } from '../../shared/components/hero-video/hero-video.component';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-resources',

  standalone: true,

  imports: [HeroVideoComponent, RouterLink],

  templateUrl:

    './resources.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:

    './resources.component.css'

})
export class ResourcesComponent {


resources =
RESOURCES;


constructor(private readonly seoService: SeoService) {
  this.seoService.updatePage(
    'Commercial Property Resources | Austin Surface Pros',
    'Practical resources for planning and maintaining commercial asphalt, concrete, striping, and surface projects.'
  );
}


}
