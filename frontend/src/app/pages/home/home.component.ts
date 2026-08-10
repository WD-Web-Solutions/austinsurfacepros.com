import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SERVICES } from '../../core/data/services.data';
import { BlogPost } from '../../core/models/blog-post.model';
import { BlogPostSummary } from '../../core/models/blog.model';
import { BlogService } from '../../core/services/blog.service';
import { LocalBlogService } from '../../core/services/local-blog.service';
import { SeoService } from '../../core/services/seo.service';
import { BlogCardComponent } from '../../shared/components/blog-card/blog-card.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { SERVICE_AREA_CONFIG } from '../services/service-area-map/service-area.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, UiCardComponent, BlogCardComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly seoService = inject(SeoService);
  private readonly apiBlogService = inject(BlogService);
  private readonly localBlogService = inject(LocalBlogService);

  readonly services = SERVICES.slice(0, 3);
  readonly serviceAreas = SERVICE_AREA_CONFIG.places.map(place => place.name);
  readonly serviceAreaRadiusMiles = SERVICE_AREA_CONFIG.coreRadiusMiles;
  readonly recentBlogs = signal<BlogPost[]>([]);

  constructor() {
    this.seoService.updatePage(
      'Austin Surface Pros | Commercial Surface Solutions',
      'Professional asphalt, striping, coatings, and commercial property improvement services in Austin, Texas.'
    );
    void this.loadRecentBlogs();
  }

  private async loadRecentBlogs(): Promise<void> {
    if (environment.blog.useLocalRepository) {
      this.recentBlogs.set(await this.localBlogService.getPublishedPosts(3));
      return;
    }

    try {
      const posts = await firstValueFrom(this.apiBlogService.listPosts());
      this.recentBlogs.set(
        posts
          .filter(post => post.status === 'published')
          .sort((left, right) => this.postTime(right) - this.postTime(left))
          .slice(0, 3)
          .map(post => this.toCardPost(post))
      );
    } catch {
      this.recentBlogs.set([]);
    }
  }

  private toCardPost(post: BlogPostSummary): BlogPost {
    const publishedAt = post.publishedAt ?? post.createdAt;
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.excerpt,
      contentHtml: '',
      thumbnailUrl: post.coverImageUrl ?? '/assets/images/gallery/asphalt.jpg',
      thumbnailAlt: `${post.title} article thumbnail`,
      author: post.authorName,
      publishedAt,
      status: post.status,
      tags: post.tags,
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
      readingMinutes: 1
    };
  }

  private postTime(post: BlogPostSummary): number {
    return Date.parse(post.publishedAt ?? post.createdAt);
  }
}
