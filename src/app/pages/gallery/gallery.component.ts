import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { GALLERY_ITEMS } from '../../core/data/gallery.data';



@Component({

  selector: 'app-gallery',

  standalone: true,

  imports: [

    RouterLink

  ],

  templateUrl:

    './gallery.component.html',

  styleUrl:

    './gallery.component.css'

})
export class GalleryComponent {


  galleryItems =
    GALLERY_ITEMS;


}