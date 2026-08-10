import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GALLERY_SEEDS } from '../../core/data/gallery-seeds.data';
import {
  GALLERY_CONTENT_REPOSITORY,
  GalleryContentRepository
} from '../../core/services/gallery-content.repository';
import { GalleryComponent } from './gallery.component';

describe('GalleryComponent', () => {
  const repository: Partial<GalleryContentRepository> = {
    listPage: async () => ({ items: GALLERY_SEEDS.slice(0, 3), nextCursor: null })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryComponent],
      providers: [
        provideRouter([]),
        { provide: GALLERY_CONTENT_REPOSITORY, useValue: repository }
      ]
    }).compileComponents();
  });

  it('renders an accessible, clickable, lazy-loaded art-directed project wall', async () => {
    const fixture = TestBed.createComponent(GalleryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain('Built around');
    expect(element.querySelectorAll('.gallery-photo button')).toHaveLength(3);
    expect(element.querySelectorAll('img[loading="lazy"]')).toHaveLength(3);
    expect(element.querySelector('nav[aria-label="Filter projects by hashtag"]')).not.toBeNull();
    expect(element.querySelector('dialog[aria-labelledby="lightbox-title"]')).not.toBeNull();
  });
});
