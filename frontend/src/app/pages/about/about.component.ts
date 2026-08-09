import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';

import { HeroVideoComponent } from '../../shared/components/hero-video/hero-video.component';



@Component({

  selector: 'app-about',

  standalone: true,

  imports: [

    RouterLink,

    HeroVideoComponent

  ],

  templateUrl:

    './about.component.html',

  changeDetection: ChangeDetectionStrategy.Eager,
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