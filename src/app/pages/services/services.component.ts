import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ServiceCardComponent } from '../../shared/components/service-card/service-card.component';

import { SERVICES } from '../../core/data/services.data';


@Component({
  selector: 'app-services',
  imports: [
    RouterLink,
    ServiceCardComponent
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {

  services = SERVICES;

}