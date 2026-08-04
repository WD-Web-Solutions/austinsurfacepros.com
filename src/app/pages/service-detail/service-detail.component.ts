import { Component } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { RouterLink } from '@angular/router';

import { SERVICES } from '../../core/data/services.data';



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


  service;



  constructor(

    private route: ActivatedRoute

  ) {


    const slug =
      this.route.snapshot.paramMap.get('slug');



    this.service =
      SERVICES.find(
        service =>
          service.slug === slug
      );


  }


}