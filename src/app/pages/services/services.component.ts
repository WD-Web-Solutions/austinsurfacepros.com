import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { SERVICES } from '../../core/data/services.data';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-services',

  standalone: true,

  imports: [

    RouterLink

  ],

  templateUrl:

    './services.component.html',

  styleUrl:

    './services.component.css'

})
export class ServicesComponent {



services =
SERVICES;



constructor(

private seoService: SeoService

) {



this.seoService.updatePage(

'Commercial Asphalt & Striping Services | Austin Surface Pros',

'Explore professional asphalt maintenance, parking lot striping, coatings, repairs, and commercial property improvement services.'

);


}



}