import { InjectionToken } from '@angular/core';

import {
  GalleryPage,
  GalleryPhoto,
  GalleryPhotoMetadata,
  GalleryUploadDraft,
  GalleryUploadProgress
} from '../models/gallery.model';

export interface GalleryContentRepository {
  listPage(limit: number, cursor?: string | null, tag?: string | null): Promise<GalleryPage>;
  listAdmin(): Promise<GalleryPhoto[]>;
  upload(
    file: File,
    draft: GalleryUploadDraft,
    onProgress?: (progress: GalleryUploadProgress) => void
  ): Promise<GalleryPhoto>;
  update(id: string, metadata: GalleryPhotoMetadata): Promise<GalleryPhoto>;
  reorder(id: string, previousId: string | null, nextId: string | null): Promise<GalleryPhoto>;
  delete(id: string): Promise<void>;
  resetDemo?(): Promise<void>;
}

export const GALLERY_CONTENT_REPOSITORY = new InjectionToken<GalleryContentRepository>(
  'GALLERY_CONTENT_REPOSITORY'
);
