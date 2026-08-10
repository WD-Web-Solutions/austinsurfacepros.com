import { DatePipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';

import { BlogPostSummary } from '../../core/models/blog.model';
import { AuthService } from '../../core/services/auth.service';
import { BlogAdminService } from '../../core/services/blog-admin.service';
import { BlogService } from '../../core/services/blog.service';
import { SeoService } from '../../core/services/seo.service';

const POSTS_PER_PAGE = 10;

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './blog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './blog.component.css'
})
export class BlogComponent implements OnInit, OnDestroy {
  private readonly blogService = inject(BlogService);
  private readonly blogAdminService = inject(BlogAdminService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly seoService = inject(SeoService);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly posts = signal<BlogPostSummary[]>([]);
  readonly tags = computed(() => [...new Set(this.posts().flatMap(post => post.tags))].sort());
  readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly selectedTag = signal(this.route.snapshot.queryParamMap.get('tag'));
  readonly filteredPosts = computed(() => {
    const query = this.query().trim().toLowerCase();
    const tag = this.selectedTag();
    return this.posts().filter(post => {
      const matchesTag = !tag || post.tags.includes(tag);
      const searchableText = `${post.title} ${post.excerpt} ${post.authorName} ${post.tags.join(' ')}`.toLowerCase();
      return matchesTag && (!query || searchableText.includes(query));
    });
  });
  readonly visibleCount = signal(POSTS_PER_PAGE);
  readonly visiblePosts = computed(() => this.filteredPosts().slice(0, this.visibleCount()));
  readonly hasMorePosts = computed(() => this.visiblePosts().length < this.filteredPosts().length);
  readonly filterModalOpen = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly pendingPostIds = signal<Set<string>>(new Set());
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
    this.seoService.updatePage(
      'Blog | Austin Surface Pros',
      'Read Austin Surface Pros guides and updates about commercial asphalt, concrete, and surface maintenance.'
    );
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.loadMoreObserver?.disconnect();
  }

  selectTag(tag: string | null): void {
    this.selectedTag.set(tag);
    this.visibleCount.set(POSTS_PER_PAGE);
    this.updateUrl();
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.visibleCount.set(POSTS_PER_PAGE);
    this.updateUrl();
  }

  clearFilters(): void {
    this.query.set('');
    this.selectedTag.set(null);
    this.visibleCount.set(POSTS_PER_PAGE);
    this.updateUrl();
  }

  loadMore(): void {
    this.visibleCount.update(count => Math.min(count + POSTS_PER_PAGE, this.filteredPosts().length));
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

  deletePost(post: BlogPostSummary): void {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    this.addPending(post.id);
    this.blogAdminService.deletePost(post.id)
      .pipe(finalize(() => this.removePending(post.id)))
      .subscribe({
        next: () => this.posts.update(posts => posts.filter(candidate => candidate.id !== post.id)),
        error: () => this.errorMessage.set('Unable to delete this post. Please try again.')
      });
  }

  togglePublish(post: BlogPostSummary): void {
    this.addPending(post.id);
    const request$ = post.status === 'published'
      ? this.blogAdminService.unpublishPost(post.id)
      : this.blogAdminService.publishPost(post.id);
    request$.pipe(finalize(() => this.removePending(post.id))).subscribe({
      next: updated => this.posts.update(posts => posts.map(candidate => candidate.id === updated.id ? updated : candidate)),
      error: () => this.errorMessage.set('Unable to update this post’s publishing status. Please try again.')
    });
  }

  isPending(postId: string): boolean {
    return this.pendingPostIds().has(postId);
  }

  private loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const posts$: Observable<BlogPostSummary[]> = this.isAdmin()
      ? this.blogAdminService.listAllPosts()
      : this.blogService.listPosts();

    posts$
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: posts => {
          this.posts.set(posts);
          this.visibleCount.set(POSTS_PER_PAGE);
        },
        error: () => this.errorMessage.set('Unable to load blog posts. Please try again.')
      });
  }

  private removePending(postId: string): void {
    this.pendingPostIds.update(ids => {
      const next = new Set(ids);
      next.delete(postId);
      return next;
    });
  }

  private addPending(postId: string): void {
    this.pendingPostIds.update(ids => new Set(ids).add(postId));
  }

  private updateUrl(): void {
    const params = new URLSearchParams();
    const query = this.query().trim();
    if (query) params.set('q', query);
    const tag = this.selectedTag();
    if (tag) params.set('tag', tag);
    const currentPath = this.location.path().split('?')[0] || '/blog';
    this.location.replaceState(currentPath, params.toString());
  }
}
