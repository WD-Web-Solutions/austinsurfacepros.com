import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GALLERY_SEEDS } from '../../core/data/gallery-seeds.data';
import {
  GALLERY_CONTENT_REPOSITORY,
  GalleryContentRepository
} from '../../core/services/gallery-content.repository';
import { GalleryAdminComponent } from './gallery-admin.component';

describe('GalleryAdminComponent', () => {
  const repository: Partial<GalleryContentRepository> = {
    listAdmin: async () => GALLERY_SEEDS.slice(0, 2),
    reorder: async id => GALLERY_SEEDS.find(photo => photo.id === id)!,
    delete: async () => undefined,
    resetDemo: async () => undefined
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryAdminComponent],
      providers: [
        provideRouter([]),
        { provide: GALLERY_CONTENT_REPOSITORY, useValue: repository }
      ]
    }).compileComponents();
  });

  it('provides labelled upload fields, privacy notice, and keyboard reorder controls', async () => {
    const fixture = TestBed.createComponent(GalleryAdminComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('input[type="file"][accept*="image/jpeg"]')).not.toBeNull();
    expect(text).toContain('Embedded metadata is stripped');
    expect(text).toContain('displayed publicly');
    expect(element.querySelectorAll('button[aria-label*="Move"]')).toHaveLength(4);
    expect(element.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
