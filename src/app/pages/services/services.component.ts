import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { SERVICES } from '../../core/data/services.data';



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


}