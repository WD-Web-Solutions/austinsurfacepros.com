import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

import { RouterLink } from '@angular/router';

import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

import { SERVICES } from '../../core/data/services.data';

import { SeoService } from '../../core/services/seo.service';
import { BlogService } from '../../core/services/blog.service';
import { BlogPost } from '../../core/models/blog-post.model';
import { BlogCardComponent } from '../../shared/components/blog-card/blog-card.component';



@Component({

  selector: 'app-home',

  standalone: true,

  imports: [

    RouterLink,

    UiCardComponent,

    BlogCardComponent

  ],

  templateUrl:

    './home.component.html',

  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:

    './home.component.css'

})
export class HomeComponent {


services = SERVICES.slice(0,3);

recentBlogs = signal<BlogPost[]>([]);



constructor(

private seoService: SeoService,

private blogService: BlogService

)

{


this.seoService.updatePage(

'Austin Surface Pros | Commercial Surface Solutions',

'Professional asphalt, striping, coatings, and commercial property improvement services in Austin, Texas.'

);

void this.loadRecentBlogs();


}

private async loadRecentBlogs(): Promise<void> {
  this.recentBlogs.set(await this.blogService.getPublishedPosts(3));
}



}
