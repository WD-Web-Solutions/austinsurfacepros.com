export type GalleryPhotoStatus = 'uploading' | 'ready' | 'failed';
export type GalleryCropAspect = 'original' | '1:1' | '4:3' | '16:9' | '4:5';

export interface GalleryPhoto {
  id: string;
  title: string;
  altText: string;
  description: string;
  tags: string[];
  city: string | null;
  state: string | null;
  capturedAt: string | null;
  cropAspect: GalleryCropAspect;
  cropX: number;
  cropY: number;
  cropZoom: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  status: GalleryPhotoStatus;
  createdAt: string;
  publishedAt: string | null;
}

export interface GalleryPage {
  items: GalleryPhoto[];
  nextCursor: string | null;
}

export interface GalleryPhotoMetadata {
  title: string;
  altText: string;
  description: string;
  tags: string[];
  city: string | null;
  state: string | null;
}

export interface GalleryCropSettings {
  cropAspect: GalleryCropAspect;
  cropX: number;
  cropY: number;
  cropZoom: number;
}

export interface GalleryUploadDraft extends GalleryPhotoMetadata, GalleryCropSettings {
  capturedAt: string | null;
}

export interface GalleryUploadProgress {
  phase: 'preparing' | 'uploading' | 'processing';
  percent: number;
}
