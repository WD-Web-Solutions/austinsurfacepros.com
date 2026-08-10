import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BlogSearchResult } from '../../core/models/blog-post.model';
import { BlogSearchService } from '../../core/services/blog-search.service';
import { DemoAuthService } from '../../core/services/demo-auth.service';
import { LocalBlogService } from '../../core/services/local-blog.service';
import { SeoService } from '../../core/services/seo.service';
import { normalizeTag } from '../../core/utils/blog.utils';
import { BlogCardComponent } from '../../shared/components/blog-card/blog-card.component';

const POSTS_PER_PAGE = 10;

@Component({
  selector: 'app-blog-index',
  standalone: true,
  imports: [BlogCardComponent, RouterLink],
  templateUrl: './blog-index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogIndexComponent implements OnDestroy {
  readonly blogService = inject(LocalBlogService);
  readonly blogSearch = inject(BlogSearchService);
  readonly auth = inject(DemoAuthService);
  readonly isAdmin = this.auth.isAuthenticated;
  readonly displayTags = computed(() => this.isAdmin() ? this.blogService.allTags() : this.blogService.tags());
  readonly query = signal('');
  readonly selectedTags = signal<string[]>([]);
  readonly results = signal<BlogSearchResult[]>([]);
  readonly visibleCount = signal(POSTS_PER_PAGE);
  readonly visibleResults = computed(() => this.results().slice(0, this.visibleCount()));
  readonly hasMoreResults = computed(() => this.visibleResults().length < this.results().length);
  readonly filterModalOpen = signal(false);
  readonly searching = signal(true);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private requestNumber = 0;
  private loadMoreObserver?: IntersectionObserver;

  @ViewChild('filterDialog') private filterDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('filterTrigger') private filterTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('loadMoreSentinel')
  set loadMoreSentinel(sentinel: ElementRef<HTMLElement> | undefined) {
    this.loadMoreObserver?.disconnect();

    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.loadMoreObserver = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          this.loadMore();
        }
      },
      { rootMargin: '320px 0px' }
    );
    this.loadMoreObserver.observe(sentinel.nativeElement);
  }

  constructor() {
    const seo = inject(SeoService);
    seo.updatePage(
      'Blog | Austin Surface Pros',
      'Practical guides for asphalt, striping, concrete, cleaning, and commercial property surface planning in Central Texas.'
    );
    this.query.set(this.route.snapshot.queryParamMap.get('q') ?? '');
    const tag = normalizeTag(this.route.snapshot.queryParamMap.get('tag') ?? '');
    if (tag) this.selectedTags.set([tag]);

    effect(() => {
      const query = this.query();
      const tags = this.selectedTags();
      const includeDrafts = this.isAdmin();
      this.blogSearch.state();
      this.blogService.posts();
      this.visibleCount.set(POSTS_PER_PAGE);
      void this.refresh(query, tags, includeDrafts);
    });
  }

  ngOnDestroy(): void {
    this.loadMoreObserver?.disconnect();
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.updateUrl();
  }

  toggleTag(tag: string): void {
    this.selectedTags.update(tags => tags.includes(tag) ? tags.filter(value => value !== tag) : [...tags, tag]);
    this.updateUrl();
  }

  clearFilters(): void {
    this.query.set('');
    this.selectedTags.set([]);
    this.updateUrl();
  }

  loadMore(): void {
    this.visibleCount.update(count => Math.min(count + POSTS_PER_PAGE, this.results().length));
  }

  openFilters(): void {
    const dialog = this.filterDialog?.nativeElement;
    if (!dialog) {
      return;
    }

    this.filterModalOpen.set(true);
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute('open', '');
    }

    queueMicrotask(() => dialog.querySelector<HTMLButtonElement>('.blog-filter-modal-close')?.focus());
  }

  closeFilters(): void {
    const dialog = this.filterDialog?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }

    this.filterModalOpen.set(false);
    queueMicrotask(() => this.filterTrigger?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  closeFiltersWithEscape(): void {
    if (this.filterModalOpen()) {
      this.closeFilters();
    }
  }

  handleFilterCancel(event: Event): void {
    event.preventDefault();
    this.closeFilters();
  }

  closeFiltersFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeFilters();
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  logout(): void {
    this.auth.logout();
  }

  private async refresh(query: string, tags: string[], includeDrafts: boolean): Promise<void> {
    const requestNumber = ++this.requestNumber;
    this.searching.set(true);
    const results = await this.blogSearch.search(query, tags, includeDrafts);
    if (requestNumber === this.requestNumber) {
      this.results.set(results);
      this.searching.set(false);
    }
  }

  private updateUrl(): void {
    const params = new URLSearchParams();
    const query = this.query().trim();
    if (query) params.set('q', query);
    const selectedTag = this.selectedTags()[0];
    if (selectedTag) params.set('tag', selectedTag);
    const currentPath = this.location.path().split('?')[0] || '/blog';
    this.location.replaceState(currentPath, params.toString());
  }
}
