import { Component } from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { SERVICES } from '../../core/data/services.data';

import { Service } from '../../core/models/service.model';



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

    private router: Router

  ) {


    const slug =
      this.route.snapshot.paramMap.get('slug');



    this.service =
      SERVICES.find(

        service =>
          service.slug === slug

      );



    if (!this.service) {

      this.router.navigate(['/services']);

    }


  }


}