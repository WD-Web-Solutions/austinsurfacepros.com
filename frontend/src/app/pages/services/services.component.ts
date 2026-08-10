import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';

import { RouterLink } from '@angular/router';

import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

import { SERVICES } from '../../core/data/services.data';

import { SeoService } from '../../core/services/seo.service';
import { ServiceAreaMapComponent } from './service-area-map/service-area-map.component';



@Component({

  selector: 'app-services',

  standalone: true,

  imports: [

    UiCardComponent,
    ServiceAreaMapComponent,
    RouterLink

  ],

  templateUrl:

    './services.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl:

    './services.component.css'

})
export class ServicesComponent {


  services = SERVICES;

  revealPosition = 50;



  constructor(

    private seoService: SeoService

  ) {


    this.seoService.updatePage(

      'Commercial Asphalt & Surface Services | Austin Surface Pros',

      'Professional asphalt, striping, coating, and commercial surface improvement services in Central Texas.'

    );


  }

  setReveal(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);

    if (Number.isFinite(value)) {
      this.revealPosition = Math.min(100, Math.max(0, value));
    }
  }

  beginRevealDrag(event: PointerEvent): void {
    const input = event.currentTarget as HTMLInputElement;

    event.preventDefault();
    input.focus({ preventScroll: true });
    input.setPointerCapture(event.pointerId);
    this.updateRevealFromPointer(event, input);
  }

  dragReveal(event: PointerEvent): void {
    const input = event.currentTarget as HTMLInputElement;

    if (!input.hasPointerCapture(event.pointerId)) {
      return;
    }

    event.preventDefault();
    this.updateRevealFromPointer(event, input);
  }

  finishRevealDrag(event: PointerEvent): void {
    const input = event.currentTarget as HTMLInputElement;

    if (input.hasPointerCapture(event.pointerId)) {
      input.releasePointerCapture(event.pointerId);
    }
  }

  private updateRevealFromPointer(event: PointerEvent, input: HTMLInputElement): void {
    const bounds = input.getBoundingClientRect();

    if (bounds.width <= 0) {
      return;
    }

    const position = ((event.clientX - bounds.left) / bounds.width) * 100;
    this.revealPosition = Math.min(100, Math.max(0, position));
  }


}
