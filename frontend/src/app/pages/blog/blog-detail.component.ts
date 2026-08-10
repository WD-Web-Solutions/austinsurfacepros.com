import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BlogPost } from '../../core/models/blog-post.model';
import { BlogService } from '../../core/services/blog.service';
import { SeoService } from '../../core/services/seo.service';
import { BlogCardComponent } from '../../shared/components/blog-card/blog-card.component';
import { ShareButtonsComponent } from '../../shared/components/share-buttons/share-buttons.component';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [BlogCardComponent, DatePipe, RouterLink, ShareButtonsComponent],
  templateUrl: './blog-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  readonly post = signal<BlogPost | null>(null);
  readonly related = signal<BlogPost[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const post = await this.blogService.getBySlug(slug);
    this.post.set(post);
    this.loading.set(false);
    if (!post) {
      this.seo.updatePage('Field Note Not Found | Austin Surface Pros', 'The requested field note could not be found.', 'noindex, follow');
      return;
    }
    this.seo.updatePage(`${post.title} | Austin Surface Pros`, post.summary);
    const posts = await this.blogService.getPublishedPosts();
    this.related.set(posts
      .filter(candidate => candidate.id !== post.id && candidate.tags.some(tag => post.tags.includes(tag)))
      .slice(0, 3));
  }
}
