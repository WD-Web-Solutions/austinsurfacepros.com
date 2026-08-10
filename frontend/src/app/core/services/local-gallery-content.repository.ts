import { Injectable } from '@angular/core';

import { GALLERY_SEEDS } from '../data/gallery-seeds.data';
import {
  GalleryPage,
  GalleryPhoto,
  GalleryPhotoMetadata,
  GalleryUploadDraft,
  GalleryUploadProgress
} from '../models/gallery.model';
import { GalleryContentRepository } from './gallery-content.repository';

interface StoredGalleryPhoto extends Omit<GalleryPhoto, 'imageUrl' | 'thumbnailUrl'> {
  sourceUrl: string | null;
  imageBlob?: Blob;
  sortKey: number;
}

const DATABASE_NAME = 'austin-surface-pros-gallery';
const DATABASE_VERSION = 1;
const PHOTO_STORE = 'photos';
const META_STORE = 'meta';
const INITIALIZED_KEY = 'initialized';
const SORT_STEP = 1024;

@Injectable({ providedIn: 'root' })
export class LocalGalleryContentRepository implements GalleryContentRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;
  private initializationPromise: Promise<void> | null = null;
  private readonly memoryPhotos = new Map<string, StoredGalleryPhoto>();
  private readonly objectUrls = new Map<string, string>();
  private memoryInitialized = false;

  async listPage(limit: number, cursor?: string | null, tag?: string | null): Promise<GalleryPage> {
    const photos = (await this.listStored())
      .filter(photo => photo.status === 'ready' && (!tag || photo.tags.includes(this.normalizeTag(tag))))
      .sort(this.compare);
    const after = cursor ? this.decodeCursor(cursor) : null;
    const remaining = after
      ? photos.filter(photo => this.compareTuple(photo, after) > 0)
      : photos;
    const boundedLimit = Math.min(Math.max(limit, 1), 40);
    const page = remaining.slice(0, boundedLimit);
    return {
      items: page.map(photo => this.toPhoto(photo)),
      nextCursor: remaining.length > boundedLimit && page.length
        ? this.encodeCursor(page.at(-1)!)
        : null
    };
  }

  async listAdmin(): Promise<GalleryPhoto[]> {
    return (await this.listStored()).sort(this.compare).map(photo => this.toPhoto(photo));
  }

  async upload(
    file: File,
    draft: GalleryUploadDraft,
    onProgress?: (progress: GalleryUploadProgress) => void
  ): Promise<GalleryPhoto> {
    await this.initialize();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      throw new Error('Choose a JPEG, PNG, or WebP photo no larger than 15 MB.');
    }
    onProgress?.({ phase: 'preparing', percent: 20 });
    const existing = await this.listStored();
    const now = new Date().toISOString();
    const stored: StoredGalleryPhoto = {
      id: this.createId(),
      ...this.cleanDraft(draft),
      sourceUrl: null,
      imageBlob: file,
      width: null,
      height: null,
      status: 'ready',
      createdAt: now,
      publishedAt: now,
      sortKey: Math.max(0, ...existing.map(photo => photo.sortKey)) + SORT_STEP
    };
    onProgress?.({ phase: 'uploading', percent: 70 });
    await this.put(stored);
    onProgress?.({ phase: 'processing', percent: 100 });
    return this.toPhoto(stored);
  }

  async update(id: string, metadata: GalleryPhotoMetadata): Promise<GalleryPhoto> {
    const stored = await this.required(id);
    const updated: StoredGalleryPhoto = {
      ...stored,
      ...this.cleanMetadata(metadata)
    };
    await this.put(updated);
    return this.toPhoto(updated);
  }

  async reorder(id: string, previousId: string | null, nextId: string | null): Promise<GalleryPhoto> {
    const photos = (await this.listStored()).sort(this.compare);
    const photo = photos.find(item => item.id === id);
    if (!photo) throw new Error('Gallery photo not found.');
    const previous = previousId ? photos.find(item => item.id === previousId) : undefined;
    const next = nextId ? photos.find(item => item.id === nextId) : undefined;
    if (previousId && !previous || nextId && !next || previous?.id === next?.id) {
      throw new Error('Gallery reorder neighbors are invalid.');
    }
    let sortKey = previous && next
      ? (previous.sortKey + next.sortKey) / 2
      : previous
        ? previous.sortKey + SORT_STEP
        : next
          ? next.sortKey - SORT_STEP
          : SORT_STEP;
    if ((previous && Math.abs(sortKey - previous.sortKey) < 0.000001)
      || (next && Math.abs(next.sortKey - sortKey) < 0.000001)) {
      for (const [index, item] of photos.entries()) {
        item.sortKey = (index + 1) * SORT_STEP;
        await this.put(item);
      }
      const refreshedPrevious = previousId ? photos.find(item => item.id === previousId) : undefined;
      const refreshedNext = nextId ? photos.find(item => item.id === nextId) : undefined;
      sortKey = refreshedPrevious && refreshedNext
        ? (refreshedPrevious.sortKey + refreshedNext.sortKey) / 2
        : refreshedPrevious
          ? refreshedPrevious.sortKey + SORT_STEP
          : refreshedNext
            ? refreshedNext.sortKey - SORT_STEP
            : SORT_STEP;
    }
    const updated = { ...photo, sortKey };
    await this.put(updated);
    return this.toPhoto(updated);
  }

  async delete(id: string): Promise<void> {
    await this.initialize();
    this.revokeObjectUrl(id);
    if (!this.hasIndexedDb()) {
      this.memoryPhotos.delete(id);
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction(PHOTO_STORE, 'readwrite');
    transaction.objectStore(PHOTO_STORE).delete(id);
    await this.transactionComplete(transaction);
  }

  async resetDemo(): Promise<void> {
    if (typeof URL.revokeObjectURL === 'function') {
      this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    }
    this.objectUrls.clear();
    const seeds = this.seedRecords();
    if (!this.hasIndexedDb()) {
      this.memoryPhotos.clear();
      seeds.forEach(photo => this.memoryPhotos.set(photo.id, photo));
      this.memoryInitialized = true;
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction([PHOTO_STORE, META_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTO_STORE);
    store.clear();
    seeds.forEach(photo => store.put(photo));
    transaction.objectStore(META_STORE).put(true, INITIALIZED_KEY);
    await this.transactionComplete(transaction);
  }

  private async initialize(): Promise<void> {
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this.initializeOnce();
    return this.initializationPromise;
  }

  private async initializeOnce(): Promise<void> {
    if (!this.hasIndexedDb()) {
      if (!this.memoryInitialized) {
        this.seedRecords().forEach(photo => this.memoryPhotos.set(photo.id, photo));
        this.memoryInitialized = true;
      }
      return;
    }
    const database = await this.openDatabase();
    const initialized = await this.request<boolean | undefined>(
      database.transaction(META_STORE).objectStore(META_STORE).get(INITIALIZED_KEY)
    );
    if (initialized) return;
    const transaction = database.transaction([PHOTO_STORE, META_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTO_STORE);
    this.seedRecords().forEach(photo => store.put(photo));
    transaction.objectStore(META_STORE).put(true, INITIALIZED_KEY);
    await this.transactionComplete(transaction);
  }

  private async listStored(): Promise<StoredGalleryPhoto[]> {
    await this.initialize();
    if (!this.hasIndexedDb()) return [...this.memoryPhotos.values()];
    const database = await this.openDatabase();
    return this.request<StoredGalleryPhoto[]>(
      database.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).getAll()
    );
  }

  private async required(id: string): Promise<StoredGalleryPhoto> {
    const photo = (await this.listStored()).find(item => item.id === id);
    if (!photo) throw new Error('Gallery photo not found.');
    return photo;
  }

  private async put(photo: StoredGalleryPhoto): Promise<void> {
    await this.initialize();
    if (!this.hasIndexedDb()) {
      this.memoryPhotos.set(photo.id, photo);
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction(PHOTO_STORE, 'readwrite');
    transaction.objectStore(PHOTO_STORE).put(photo);
    await this.transactionComplete(transaction);
  }

  private seedRecords(): StoredGalleryPhoto[] {
    return GALLERY_SEEDS.map((photo, index) => {
      const { imageUrl, thumbnailUrl: _thumbnailUrl, ...metadata } = photo;
      return {
        ...metadata,
        sourceUrl: imageUrl,
        sortKey: (index + 1) * SORT_STEP
      };
    });
  }

  private toPhoto(stored: StoredGalleryPhoto): GalleryPhoto {
    const imageUrl = stored.imageBlob ? this.objectUrl(stored) : stored.sourceUrl;
    const { sourceUrl: _sourceUrl, imageBlob: _imageBlob, sortKey: _sortKey, ...photo } = stored;
    return { ...photo, imageUrl, thumbnailUrl: imageUrl };
  }

  private objectUrl(photo: StoredGalleryPhoto): string | null {
    const existing = this.objectUrls.get(photo.id);
    if (existing) return existing;
    if (!photo.imageBlob || typeof URL.createObjectURL !== 'function') return null;
    const url = URL.createObjectURL(photo.imageBlob);
    this.objectUrls.set(photo.id, url);
    return url;
  }

  private revokeObjectUrl(id: string): void {
    const url = this.objectUrls.get(id);
    if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
    this.objectUrls.delete(id);
  }

  private cleanDraft(draft: GalleryUploadDraft): GalleryUploadDraft {
    return { ...draft, ...this.cleanMetadata(draft) };
  }

  private cleanMetadata(metadata: GalleryPhotoMetadata): GalleryPhotoMetadata {
    return {
      title: metadata.title.trim(),
      altText: metadata.altText.trim(),
      description: metadata.description.trim(),
      tags: [...new Set(metadata.tags.map(tag => this.normalizeTag(tag)).filter(Boolean))].slice(0, 12),
      city: metadata.city?.trim() || null,
      state: metadata.state?.trim() || null
    };
  }

  private normalizeTag(value: string): string {
    return value.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private compare = (left: StoredGalleryPhoto, right: StoredGalleryPhoto): number =>
    left.sortKey - right.sortKey || left.id.localeCompare(right.id);

  private compareTuple(photo: StoredGalleryPhoto, tuple: [number, string]): number {
    return photo.sortKey - tuple[0] || photo.id.localeCompare(tuple[1]);
  }

  private encodeCursor(photo: StoredGalleryPhoto): string {
    return btoa(JSON.stringify([photo.sortKey, photo.id]));
  }

  private decodeCursor(cursor: string): [number, string] {
    try {
      const value = JSON.parse(atob(cursor));
      if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== 'number' || typeof value[1] !== 'string') {
        throw new Error('Invalid cursor.');
      }
      return [value[0], value[1]];
    } catch {
      throw new Error('Invalid gallery cursor.');
    }
  }

  private createId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private hasIndexedDb(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(PHOTO_STORE)) {
          database.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('The local gallery database could not be opened.'));
    });
    return this.databasePromise;
  }

  private request<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('A local gallery operation failed.'));
    });
  }

  private transactionComplete(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('A local gallery transaction failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('A local gallery transaction was aborted.'));
    });
  }
}
