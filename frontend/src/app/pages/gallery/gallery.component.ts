import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { GalleryPhoto } from '../../core/models/gallery.model';
import { GALLERY_CONTENT_REPOSITORY } from '../../core/services/gallery-content.repository';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryComponent implements OnInit, OnDestroy {
  readonly Math = Math;
  private readonly repository = inject(GALLERY_CONTENT_REPOSITORY);
  private readonly seo = inject(SeoService);
  private observer: IntersectionObserver | null = null;

  readonly photos = signal<GalleryPhoto[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly initialized = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTag = signal<string | null>(null);
  readonly selectedPhoto = signal<GalleryPhoto | null>(null);
  private readonly availableTags = signal<string[]>([]);
  readonly tags = computed(() => this.availableTags());

  @ViewChild('lightbox') private lightbox?: ElementRef<HTMLDialogElement>;

  @ViewChild('loadSentinel')
  set loadSentinel(element: ElementRef<HTMLElement> | undefined) {
    this.observer?.disconnect();
    if (!element || typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && this.nextCursor() && !this.loading()) {
        void this.loadMore();
      }
    }, { rootMargin: '400px 0px' });
    this.observer.observe(element.nativeElement);
  }

  constructor() {
    this.seo.updatePage(
      'Commercial Project Gallery | Austin Surface Pros',
      'Explore Austin Surface Pros paving, striping, coating, cleaning, and commercial surface projects.'
    );
  }

  ngOnInit(): void {
    void this.loadPage(true);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  async chooseTag(tag: string | null): Promise<void> {
    if (this.activeTag() === tag) return;
    this.activeTag.set(tag);
    await this.loadPage(true);
  }

  loadMore(): Promise<void> {
    return this.loadPage(false);
  }

  openPhoto(photo: GalleryPhoto): void {
    this.selectedPhoto.set(photo);
    setTimeout(() => this.lightbox?.nativeElement.showModal());
  }

  closePhoto(): void {
    this.lightbox?.nativeElement.close();
    this.selectedPhoto.set(null);
  }

  location(photo: GalleryPhoto): string {
    return [photo.city, photo.state].filter(Boolean).join(', ');
  }

  private async loadPage(reset: boolean): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const page = await this.repository.listPage(
        12,
        reset ? null : this.nextCursor(),
        this.activeTag()
      );
      const incomingTags = page.items.flatMap(photo => photo.tags);
      this.availableTags.update(tags => [...new Set([...tags, ...incomingTags])].sort());
      this.photos.set(reset ? page.items : [...this.photos(), ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.error.set('The project gallery could not be loaded. Please try again.');
    } finally {
      this.loading.set(false);
      this.initialized.set(true);
    }
  }
}
