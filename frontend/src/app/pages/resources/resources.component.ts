import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RESOURCES } from '../../core/data/resources.data';



@Component({

  selector: 'app-resources',

  standalone: true,

  imports: [],

  templateUrl:

    './resources.component.html',

  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:

    './resources.component.css'

})
export class ResourcesComponent {


resources =
RESOURCES;


}