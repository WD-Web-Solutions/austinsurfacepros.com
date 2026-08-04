import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

import { SERVICES } from '../../core/data/services.data';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-home',

  standalone: true,

  imports: [

    RouterLink,

    UiCardComponent

  ],

  templateUrl:

    './home.component.html',

  styleUrl:

    './home.component.css'

})
export class HomeComponent {


services = SERVICES.slice(0,3);



constructor(

private seoService: SeoService

)

{


this.seoService.updatePage(

'Austin Surface Pros | Commercial Surface Solutions',

'Professional asphalt, striping, coatings, and commercial property improvement services in Austin, Texas.'

);


}



}