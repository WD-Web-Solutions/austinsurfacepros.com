import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-not-found',

  standalone: true,

  imports: [

    RouterLink

  ],

  templateUrl:

    './not-found.component.html',

  styleUrl:

    './not-found.component.css'

})
export class NotFoundComponent {



constructor(

private seoService: SeoService

) {



this.seoService.updatePage(

'Page Not Found | Austin Surface Pros',

'The page you are looking for could not be found.'

);


}



}