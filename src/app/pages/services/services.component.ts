import { Component } from '@angular/core';

import { SERVICES } from '../../core/data/services.data';


@Component({

  selector: 'app-services',

  standalone: true,

  imports: [],

  templateUrl:
    './services.component.html',

  styleUrl:
    './services.component.css'

})
export class ServicesComponent {


  services =
    SERVICES;


}