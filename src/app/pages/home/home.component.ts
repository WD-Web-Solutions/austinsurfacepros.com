import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-home',

  standalone: true,

  imports: [

    RouterLink

  ],

  templateUrl:

    './home.component.html',

  styleUrl:

    './home.component.css'

})
export class HomeComponent {



constructor(

private seoService: SeoService

) {



this.seoService.updatePage(

'Austin Surface Pros | Commercial Asphalt & Surface Solutions',

'Professional asphalt, striping, coatings, and commercial surface improvement services serving Central Texas.'

);


}



}