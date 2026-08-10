import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';



@Component({

  selector: 'app-about',

  standalone: true,

  imports: [

    RouterLink

  ],

  templateUrl:

    './about.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:

    './about.component.css'

})
export class AboutComponent {



constructor(

private seoService: SeoService

) {



this.seoService.updatePage(

'About Austin Surface Pros | Local Surface Experts',

'Learn about Austin Surface Pros, our family story, experience, and commitment to quality commercial surface solutions.'

);


}



}
