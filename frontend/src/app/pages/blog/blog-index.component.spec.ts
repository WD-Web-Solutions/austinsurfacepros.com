import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { BlogPost } from '../../core/models/blog-post.model';
import { BlogSearchService } from '../../core/services/blog-search.service';
import { DemoAuthService } from '../../core/services/demo-auth.service';
import { LocalBlogService } from '../../core/services/local-blog.service';
import { SeoService } from '../../core/services/seo.service';
import { BlogIndexComponent } from './blog-index.component';

const post: BlogPost = {
  id: 'post-1',
  slug: 'parking-lot-planning',
  title: 'Parking Lot Planning',
  summary: 'Plan surface work with fewer disruptions.',
  contentHtml: '<p>Useful guidance.</p>',
  thumbnailUrl: '/assets/images/design-lab/asphalt-road.jpg',
  thumbnailAlt: 'Commercial asphalt pavement',
  author: 'Austin Surface Pros',
  publishedAt: '2026-08-09T12:00:00.000Z',
  createdAt: '2026-08-09T12:00:00.000Z',
  updatedAt: '2026-08-09T12:00:00.000Z',
  status: 'published',
  tags: ['planning'],
  readingMinutes: 3
};

const posts = Array.from({ length: 12 }, (_, index) => ({
  ...post,
  id: `post-${index + 1}`,
  slug: `parking-lot-planning-${index + 1}`,
  title: `Parking Lot Planning ${index + 1}`
}));

describe('BlogIndexComponent', () => {
  const locationStub = {
    path: vi.fn(() => '/blog?q=old'),
    replaceState: vi.fn()
  };
  const authenticated = signal(true);
  const searchStub = {
    state: signal('fallback'),
    progress: signal(100),
    search: vi.fn(async () => posts.map(resultPost => ({
      post: resultPost,
      score: 1,
      keywordScore: 1,
      fuzzyScore: 1,
      semanticScore: null
    })))
  };
  const blogStub = {
    posts: signal(posts),
    tags: signal([{ name: 'planning', count: 1 }]),
    allTags: signal([{ name: 'planning', count: 1 }]),
    error: signal<string | null>(null)
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    authenticated.set(true);
    await TestBed.configureTestingModule({
      imports: [BlogIndexComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
        },
        { provide: Location, useValue: locationStub },
        { provide: LocalBlogService, useValue: blogStub },
        { provide: BlogSearchService, useValue: searchStub },
        {
          provide: DemoAuthService,
          useValue: { isAuthenticated: authenticated, logout: vi.fn() }
        },
        { provide: SeoService, useValue: { updatePage: vi.fn() } }
      ]
    }).compileComponents();
  });

  it('uses a compact search-and-filter row and exposes admin CRUD controls', async () => {
    const fixture = TestBed.createComponent(BlogIndexComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Blog');
    expect(element.querySelector('h1')?.classList).toContain('sr-only');
    expect(element.querySelector('label[for="blog-search"]')?.textContent).toContain('Search blog posts');
    expect(element.querySelector('.blog-search-heading [role="status"]')?.textContent).toContain('10 of 12 posts');
    expect(element.querySelector('.blog-controls .blog-filter-panel')?.getAttribute('aria-label')).toContain('hashtag');
    expect(element.querySelector('.blog-filter-panel .blog-tag-filter-list button')?.getAttribute('aria-pressed')).toBe('false');
    expect(element.querySelector('.blog-page-header')).toBeNull();
    expect(element.querySelector('.search-mode')).toBeNull();
    expect(element.querySelector('.blog-results-heading')).toBeNull();

    expect(element.querySelector('a[href="/admin/blogs/new"]')).not.toBeNull();
    expect(element.querySelector('a[href="/admin/blogs/post-1/edit"]')).not.toBeNull();
    expect(element.querySelector('a[href="/admin/blogs/post-1/delete"]')).not.toBeNull();
  });

  it('loads ten posts initially and exposes both automatic and manual pagination', async () => {
    const fixture = TestBed.createComponent(BlogIndexComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.blog-card')).toHaveLength(10);
    expect(element.querySelector('.blog-load-more button')?.textContent).toContain('Load more posts');

    fixture.componentInstance.loadMore();
    fixture.detectChanges();

    expect(element.querySelectorAll('.blog-card')).toHaveLength(12);
    expect(element.querySelector('.blog-load-more')).toBeNull();
    expect(element.querySelector('.blog-search-heading [role="status"]')?.textContent).toContain('12 posts');
  });

  it('provides a labelled, openable hashtag dialog for mobile layouts', () => {
    const fixture = TestBed.createComponent(BlogIndexComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector<HTMLButtonElement>('.blog-filter-trigger');
    const dialog = element.querySelector<HTMLDialogElement>('#blog-hashtag-dialog');

    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger?.getAttribute('aria-controls')).toBe('blog-hashtag-dialog');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('blog-hashtag-dialog-title');

    trigger?.click();
    fixture.detectChanges();
    expect(dialog?.open).toBe(true);
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');

    element.querySelector<HTMLButtonElement>('.blog-filter-modal-close')?.click();
    fixture.detectChanges();
    expect(dialog?.open).toBe(false);
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    trigger?.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(dialog?.open).toBe(false);
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
  });

  it('updates the shareable search URL without triggering route-level scrolling', () => {
    const fixture = TestBed.createComponent(BlogIndexComponent);
    fixture.componentInstance.setQuery('sealcoating schedule');

    expect(locationStub.replaceState).toHaveBeenCalledWith('/blog', 'q=sealcoating+schedule');
  });
});
