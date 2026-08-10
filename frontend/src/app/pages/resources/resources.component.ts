import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RESOURCES } from '../../core/data/resources.data';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-resources',

  standalone: true,

  imports: [],

  templateUrl:

    './resources.component.html',

  changeDetection: ChangeDetectionStrategy.Eager,
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
