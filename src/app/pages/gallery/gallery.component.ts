import { Component } from '@angular/core';

import { GALLERY_ITEMS } from '../../core/data/gallery.data';


@Component({
  selector: 'app-gallery',
  imports: [],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent {


  galleryItems = GALLERY_ITEMS;


}