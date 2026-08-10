import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  GalleryPhoto,
  GalleryPhotoMetadata,
  GalleryUploadProgress
} from '../../core/models/gallery.model';
import { GALLERY_CONTENT_REPOSITORY } from '../../core/services/gallery-content.repository';
import { PhotoMetadataService } from '../../core/services/photo-metadata.service';
import { SeoService } from '../../core/services/seo.service';
import {
  GalleryCropDialogComponent,
  GalleryCropResult
} from '../../shared/components/gallery-crop-dialog/gallery-crop-dialog.component';

interface DropIndicator {
  targetId: string;
  side: 'before' | 'after';
}

@Component({
  selector: 'app-gallery-admin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GalleryCropDialogComponent],
  templateUrl: './gallery-admin.component.html',
  styleUrl: './gallery-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryAdminComponent implements OnInit, OnDestroy {
  private readonly repository = inject(GALLERY_CONTENT_REPOSITORY);
  private readonly metadataService = inject(PhotoMetadataService);
  private readonly seo = inject(SeoService);

  readonly isDemo = environment.gallery.useLocalRepository;
  readonly photos = signal<GalleryPhoto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly cropSource = signal<File | null>(null);
  readonly cropped = signal<GalleryCropResult | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly tags = signal<string[]>([]);
  readonly uploading = signal(false);
  readonly progress = signal<GalleryUploadProgress | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly editTags = signal<string[]>([]);
  readonly savingEdit = signal(false);
  readonly draggingId = signal<string | null>(null);
  readonly dropIndicator = signal<DropIndicator | null>(null);
  readonly announcement = signal('');
  private capturedAt: string | null = null;

  @ViewChild('editDialog') private editDialog?: ElementRef<HTMLDialogElement>;

  readonly uploadForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    altText: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(300)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    state: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] })
  });

  readonly editForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    altText: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(300)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    state: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] })
  });

  constructor() {
    this.seo.updatePage(
      'Project Gallery Studio | Austin Surface Pros',
      'Manage Austin Surface Pros project gallery photos.',
      'noindex, nofollow'
    );
  }

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  async selectPhotos(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      this.error.set('Choose a JPEG, PNG, or WebP photo no larger than 15 MB.');
      return;
    }
    this.error.set(null);
    const metadata = await this.metadataService.read(file).catch(() => ({
      city: null,
      state: null,
      capturedAt: null
    }));
    this.capturedAt = metadata.capturedAt;
    const suggestedTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    this.uploadForm.patchValue({
      title: suggestedTitle,
      city: metadata.city ?? '',
      state: metadata.state ?? ''
    });
    this.cropSource.set(file);
  }

  acceptCrop(result: GalleryCropResult): void {
    this.revokePreview();
    this.cropped.set(result);
    this.previewUrl.set(URL.createObjectURL(result.file));
    this.cropSource.set(null);
  }

  dismissCrop(): void {
    this.cropSource.set(null);
  }

  addTags(value: string, target: 'upload' | 'edit', input?: HTMLInputElement): void {
    const additions = value
      .split(/[# ,\n]+/)
      .map(this.normalizeTag)
      .filter(Boolean);
    const state = target === 'upload' ? this.tags : this.editTags;
    state.update(tags => [...new Set([...tags, ...additions])].slice(0, 12));
    if (input) input.value = '';
  }

  handleTagKey(event: KeyboardEvent, target: 'upload' | 'edit', input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      this.addTags(input.value, target, input);
    }
  }

  removeTag(tag: string, target: 'upload' | 'edit'): void {
    const state = target === 'upload' ? this.tags : this.editTags;
    state.update(tags => tags.filter(item => item !== tag));
  }

  async upload(): Promise<void> {
    const crop = this.cropped();
    if (!crop || this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.error.set(crop ? 'Complete the required photo details.' : 'Choose and crop a photo first.');
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    try {
      const values = this.uploadForm.getRawValue();
      const photo = await this.repository.upload(
        crop.file,
        {
          ...this.metadata(values, this.tags()),
          capturedAt: this.capturedAt,
          ...crop.settings
        },
        progress => this.progress.set(progress)
      );
      this.photos.update(photos => [...photos, photo]);
      this.resetUploadForm();
      this.notice.set('Photo published to the gallery.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The photo could not be uploaded.');
    } finally {
      this.uploading.set(false);
      this.progress.set(null);
    }
  }

  edit(photo: GalleryPhoto): void {
    this.editingId.set(photo.id);
    this.editTags.set([...photo.tags]);
    this.editForm.setValue({
      title: photo.title,
      altText: photo.altText,
      description: photo.description,
      city: photo.city ?? '',
      state: photo.state ?? ''
    });
    setTimeout(() => this.editDialog?.nativeElement.showModal());
  }

  cancelEdit(): void {
    if (this.editDialog?.nativeElement.open) this.editDialog.nativeElement.close();
    this.editingId.set(null);
  }

  async saveEdit(): Promise<void> {
    const id = this.editingId();
    if (!id || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.savingEdit.set(true);
    this.error.set(null);
    try {
      const updated = await this.repository.update(
        id,
        this.metadata(this.editForm.getRawValue(), this.editTags())
      );
      this.photos.update(photos => photos.map(photo => photo.id === id ? updated : photo));
      this.cancelEdit();
      this.notice.set('Photo details updated.');
    } catch {
      this.error.set('The photo details could not be saved.');
    } finally {
      this.savingEdit.set(false);
    }
  }

  async delete(photo: GalleryPhoto): Promise<void> {
    if (!window.confirm(`Remove “${photo.title}” from the gallery? This cannot be undone.`)) return;
    try {
      await this.repository.delete(photo.id);
      this.photos.update(photos => photos.filter(item => item.id !== photo.id));
      this.notice.set('Photo removed.');
    } catch {
      this.error.set('The photo could not be removed.');
    }
  }

  beginDrag(event: PointerEvent, id: string): void {
    if (event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.draggingId.set(id);
    this.announcement.set(`Moving ${this.photos().find(photo => photo.id === id)?.title ?? 'photo'}.`);
  }

  @HostListener('document:pointermove', ['$event'])
  pointerMove(event: PointerEvent): void {
    const draggingId = this.draggingId();
    if (!draggingId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-photo-id]');
    const targetId = target?.dataset['photoId'];
    if (!target || !targetId || targetId === draggingId) return;
    const bounds = target.getBoundingClientRect();
    const side = event.clientY < bounds.top + bounds.height / 2
      || (Math.abs(event.clientY - (bounds.top + bounds.height / 2)) < bounds.height / 4
        && event.clientX < bounds.left + bounds.width / 2)
      ? 'before'
      : 'after';
    this.dropIndicator.set({ targetId, side });
  }

  @HostListener('document:pointerup')
  async pointerUp(): Promise<void> {
    const movingId = this.draggingId();
    const indicator = this.dropIndicator();
    this.draggingId.set(null);
    this.dropIndicator.set(null);
    if (!movingId || !indicator) return;
    await this.moveTo(movingId, indicator.targetId, indicator.side);
  }

  async moveBy(id: string, delta: number): Promise<void> {
    const photos = this.photos();
    const index = photos.findIndex(photo => photo.id === id);
    const target = photos[index + delta];
    if (!target) return;
    await this.moveTo(id, target.id, delta < 0 ? 'before' : 'after');
  }

  isDropTarget(id: string, side: 'before' | 'after'): boolean {
    const indicator = this.dropIndicator();
    return indicator?.targetId === id && indicator.side === side;
  }

  async resetDemo(): Promise<void> {
    if (!this.repository.resetDemo || !window.confirm('Replace the local gallery with its original demo photos?')) return;
    await this.repository.resetDemo();
    await this.load();
    this.notice.set('Demo gallery restored.');
  }

  closeEditFromBackdrop(event: MouseEvent): void {
    if (event.target === this.editDialog?.nativeElement) this.cancelEdit();
  }

  private async moveTo(movingId: string, targetId: string, side: 'before' | 'after'): Promise<void> {
    const original = this.photos();
    const moving = original.find(photo => photo.id === movingId);
    if (!moving) return;
    const next = original.filter(photo => photo.id !== movingId);
    const targetIndex = next.findIndex(photo => photo.id === targetId);
    if (targetIndex < 0) return;
    const insertionIndex = targetIndex + (side === 'after' ? 1 : 0);
    next.splice(insertionIndex, 0, moving);
    this.photos.set(next);
    const movedIndex = next.findIndex(photo => photo.id === movingId);
    try {
      await this.repository.reorder(
        movingId,
        next[movedIndex - 1]?.id ?? null,
        next[movedIndex + 1]?.id ?? null
      );
      this.announcement.set(`${moving.title} moved to position ${movedIndex + 1} of ${next.length}.`);
    } catch {
      this.photos.set(original);
      this.error.set('The new gallery order could not be saved.');
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.photos.set(await this.repository.listAdmin());
    } catch {
      this.error.set('The gallery could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  private metadata(
    values: { title: string; altText: string; description: string; city: string; state: string },
    tags: string[]
  ): GalleryPhotoMetadata {
    return {
      title: values.title,
      altText: values.altText,
      description: values.description,
      city: values.city || null,
      state: values.state || null,
      tags
    };
  }

  private resetUploadForm(): void {
    this.uploadForm.reset({ title: '', altText: '', description: '', city: '', state: '' });
    this.tags.set([]);
    this.capturedAt = null;
    this.cropped.set(null);
    this.revokePreview();
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }

  private normalizeTag = (value: string): string =>
    value.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
