import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  GalleryPage,
  GalleryPhoto,
  GalleryPhotoMetadata,
  GalleryUploadDraft,
  GalleryUploadProgress
} from '../models/gallery.model';
import { GalleryContentRepository } from './gallery-content.repository';

interface GalleryPresignResponse {
  photo: GalleryPhoto;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  expiresInSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class HttpGalleryContentRepository implements GalleryContentRepository {
  private readonly http = inject(HttpClient);

  async listPage(limit: number, cursor?: string | null, tag?: string | null): Promise<GalleryPage> {
    const parameters = new URLSearchParams({ limit: String(limit) });
    if (cursor) parameters.set('cursor', cursor);
    if (tag) parameters.set('tag', tag);
    return firstValueFrom(this.http.get<GalleryPage>(`/api/gallery/photos?${parameters}`));
  }

  listAdmin(): Promise<GalleryPhoto[]> {
    return firstValueFrom(this.http.get<GalleryPhoto[]>('/api/admin/gallery/photos'));
  }

  async upload(
    file: File,
    draft: GalleryUploadDraft,
    onProgress?: (progress: GalleryUploadProgress) => void
  ): Promise<GalleryPhoto> {
    onProgress?.({ phase: 'preparing', percent: 2 });
    const presign = await firstValueFrom(
      this.http.post<GalleryPresignResponse>('/api/admin/gallery/uploads/presign', {
        ...draft,
        contentType: file.type,
        contentLength: file.size
      })
    );
    await this.putFile(presign.uploadUrl, presign.uploadHeaders, file, onProgress);
    onProgress?.({ phase: 'processing', percent: 96 });
    return firstValueFrom(
      this.http.post<GalleryPhoto>(`/api/admin/gallery/photos/${presign.photo.id}/complete`, {})
    );
  }

  update(id: string, metadata: GalleryPhotoMetadata): Promise<GalleryPhoto> {
    return firstValueFrom(
      this.http.patch<GalleryPhoto>(`/api/admin/gallery/photos/${id}`, metadata)
    );
  }

  reorder(id: string, previousId: string | null, nextId: string | null): Promise<GalleryPhoto> {
    return firstValueFrom(
      this.http.post<GalleryPhoto>(`/api/admin/gallery/photos/${id}/reorder`, {
        previousId,
        nextId
      })
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/admin/gallery/photos/${id}`));
  }

  private putFile(
    url: string,
    headers: Record<string, string>,
    file: File,
    onProgress?: (progress: GalleryUploadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('PUT', url);
      Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
      request.upload.onprogress = event => {
        if (event.lengthComputable) {
          onProgress?.({ phase: 'uploading', percent: 5 + Math.round(event.loaded / event.total * 88) });
        }
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) resolve();
        else reject(new Error(`Object storage rejected the upload (${request.status}).`));
      };
      request.onerror = () => reject(new Error('The photo could not be uploaded to object storage.'));
      request.onabort = () => reject(new Error('The photo upload was canceled.'));
      request.send(file);
    });
  }
}
