import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal
} from '@angular/core';

import { GalleryCropAspect, GalleryCropSettings } from '../../../core/models/gallery.model';

export interface GalleryCropResult {
  file: File;
  settings: GalleryCropSettings;
  width: number;
  height: number;
}

interface CropChoice {
  value: GalleryCropAspect;
  label: string;
}

@Component({
  selector: 'app-gallery-crop-dialog',
  standalone: true,
  templateUrl: './gallery-crop-dialog.component.html',
  styleUrl: './gallery-crop-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryCropDialogComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) file!: File;
  @Output() completed = new EventEmitter<GalleryCropResult>();
  @Output() dismissed = new EventEmitter<void>();

  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('canvas', { static: true }) private canvas!: ElementRef<HTMLCanvasElement>;

  readonly choices: CropChoice[] = [
    { value: 'original', label: 'Original' },
    { value: '1:1', label: 'Square' },
    { value: '4:3', label: 'Landscape' },
    { value: '16:9', label: 'Wide' },
    { value: '4:5', label: 'Portrait' }
  ];
  readonly aspect = signal<GalleryCropAspect>('4:3');
  readonly cropX = signal(50);
  readonly cropY = signal(50);
  readonly zoom = signal(1);
  readonly ready = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private image = new Image();
  private objectUrl = '';
  private dragStart: { x: number; y: number; cropX: number; cropY: number } | null = null;

  ngAfterViewInit(): void {
    this.objectUrl = URL.createObjectURL(this.file);
    this.image.onload = () => {
      this.ready.set(true);
      this.render();
    };
    this.image.onerror = () => this.error.set('This photo could not be decoded in the crop editor.');
    this.image.src = this.objectUrl;
    this.dialog.nativeElement.showModal();
  }

  ngOnDestroy(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }

  chooseAspect(value: GalleryCropAspect): void {
    this.aspect.set(value);
    this.cropX.set(50);
    this.cropY.set(50);
    this.zoom.set(1);
    this.render();
  }

  updateZoom(value: string): void {
    this.zoom.set(Number(value));
    this.render();
  }

  updateX(value: string): void {
    this.cropX.set(Number(value));
    this.render();
  }

  updateY(value: string): void {
    this.cropY.set(Number(value));
    this.render();
  }

  beginDrag(event: PointerEvent): void {
    if (!this.ready()) return;
    this.canvas.nativeElement.setPointerCapture(event.pointerId);
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      cropX: this.cropX(),
      cropY: this.cropY()
    };
  }

  drag(event: PointerEvent): void {
    if (!this.dragStart) return;
    const bounds = this.canvas.nativeElement.getBoundingClientRect();
    this.cropX.set(this.clamp(this.dragStart.cropX - (event.clientX - this.dragStart.x) / bounds.width * 100));
    this.cropY.set(this.clamp(this.dragStart.cropY - (event.clientY - this.dragStart.y) / bounds.height * 100));
    this.render();
  }

  endDrag(): void {
    this.dragStart = null;
  }

  handleCanvasKey(event: KeyboardEvent): void {
    const step = event.shiftKey ? 5 : 1;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') this.cropX.set(this.clamp(this.cropX() - step));
    if (event.key === 'ArrowRight') this.cropX.set(this.clamp(this.cropX() + step));
    if (event.key === 'ArrowUp') this.cropY.set(this.clamp(this.cropY() - step));
    if (event.key === 'ArrowDown') this.cropY.set(this.clamp(this.cropY() + step));
    this.render();
  }

  async useCrop(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const canvas = this.canvas.nativeElement;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          result => result ? resolve(result) : reject(new Error('The cropped image could not be created.')),
          'image/webp',
          0.9
        );
      });
      const baseName = this.file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
      this.completed.emit({
        file: new File([blob], `${baseName || 'gallery-photo'}-cropped.webp`, { type: 'image/webp' }),
        settings: {
          cropAspect: this.aspect(),
          cropX: this.cropX(),
          cropY: this.cropY(),
          cropZoom: this.zoom()
        },
        width: canvas.width,
        height: canvas.height
      });
      this.dialog.nativeElement.close();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The crop could not be created.');
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.dialog.nativeElement.close();
    this.dismissed.emit();
  }

  private render(): void {
    if (!this.ready()) return;
    const canvas = this.canvas.nativeElement;
    const ratio = this.aspectRatio();
    const maximum = 1600;
    canvas.width = ratio >= 1 ? maximum : Math.round(maximum * ratio);
    canvas.height = ratio >= 1 ? Math.round(maximum / ratio) : maximum;
    const context = canvas.getContext('2d');
    if (!context) return;

    const imageRatio = this.image.naturalWidth / this.image.naturalHeight;
    let sourceWidth = imageRatio > ratio
      ? this.image.naturalHeight * ratio
      : this.image.naturalWidth;
    let sourceHeight = imageRatio > ratio
      ? this.image.naturalHeight
      : this.image.naturalWidth / ratio;
    sourceWidth /= this.zoom();
    sourceHeight /= this.zoom();
    const sourceX = (this.image.naturalWidth - sourceWidth) * this.cropX() / 100;
    const sourceY = (this.image.naturalHeight - sourceHeight) * this.cropY() / 100;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      this.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  private aspectRatio(): number {
    if (this.aspect() === 'original') return this.image.naturalWidth / this.image.naturalHeight;
    const [width, height] = this.aspect().split(':').map(Number);
    return width! / height!;
  }

  private clamp(value: number): number {
    return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
  }
}
