import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BlogSearchResult } from '../../core/models/blog-post.model';
import { BlogSearchService } from '../../core/services/blog-search.service';
import { BlogService } from '../../core/services/blog.service';
import { SeoService } from '../../core/services/seo.service';
import { normalizeTag } from '../../core/utils/blog.utils';
import { BlogCardComponent } from '../../shared/components/blog-card/blog-card.component';

@Component({
  selector: 'app-blog-index',
  standalone: true,
  imports: [BlogCardComponent],
  templateUrl: './blog-index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogIndexComponent {
  readonly blogService = inject(BlogService);
  readonly blogSearch = inject(BlogSearchService);
  readonly query = signal('');
  readonly selectedTags = signal<string[]>([]);
  readonly results = signal<BlogSearchResult[]>([]);
  readonly searching = signal(true);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private requestNumber = 0;

  constructor() {
    const seo = inject(SeoService);
    seo.updatePage(
      'Surface Field Notes | Austin Surface Pros',
      'Practical guides for asphalt, striping, concrete, cleaning, and commercial property surface planning in Central Texas.'
    );
    this.query.set(this.route.snapshot.queryParamMap.get('q') ?? '');
    const tag = normalizeTag(this.route.snapshot.queryParamMap.get('tag') ?? '');
    if (tag) this.selectedTags.set([tag]);

    effect(() => {
      const query = this.query();
      const tags = this.selectedTags();
      this.blogSearch.state();
      this.blogService.posts();
      void this.refresh(query, tags);
    });
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

  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  private async refresh(query: string, tags: string[]): Promise<void> {
    const requestNumber = ++this.requestNumber;
    this.searching.set(true);
    const results = await this.blogSearch.search(query, tags);
    if (requestNumber === this.requestNumber) {
      this.results.set(results);
      this.searching.set(false);
    }
  }

  private updateUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.query().trim() || null,
        tag: this.selectedTags().length === 1 ? this.selectedTags()[0] : null
      },
      replaceUrl: true
    });
  }
}
