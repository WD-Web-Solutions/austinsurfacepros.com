import { Component } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { RouterLink } from '@angular/router';

import { SERVICES } from '../../core/data/services.data';

import { Service } from '../../core/models/service.model';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-service-detail',

  standalone: true,

  imports: [

    RouterLink

  ],

  templateUrl:

    './service-detail.component.html',

  styleUrl:

    './service-detail.component.css'

})
export class ServiceDetailComponent {


service?: Service;



constructor(

private route: ActivatedRoute,

private seoService: SeoService

) {



const slug =

this.route.snapshot.paramMap.get('slug');




if(slug)

{

this.service = SERVICES.find(

(service) => service.slug === slug

);



if(this.service)

{

this.seoService.updatePage(

`${this.service.title} | Austin Surface Pros`,

this.service.description

);


}

}



}



}