import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { BlogPost, BlogTag } from '../../core/models/blog-post.model';
import { LocalBlogService } from '../../core/services/local-blog.service';
import { DemoAuthService } from '../../core/services/demo-auth.service';

@Component({
  selector: 'app-blog-admin-list',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './blog-admin-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogAdminListComponent implements OnInit {
  private readonly blogService = inject(LocalBlogService);
  readonly auth = inject(DemoAuthService);
  readonly posts = signal<BlogPost[]>([]);
  readonly tags = signal<BlogTag[]>([]);
  readonly status = signal<string | null>(null);
  readonly demo = environment.demo;

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async resetDemoContent(): Promise<void> {
    if (!window.confirm('Replace every local blog post with the original demo seed content? This cannot be undone.')) return;
    await this.blogService.resetDemoContent();
    this.status.set('Demo field notes restored.');
    await this.refresh();
  }

  logout(): void {
    this.auth.logout();
  }

  private async refresh(): Promise<void> {
    const [posts, tags] = await Promise.all([this.blogService.getAllPosts(), this.blogService.getAllTags()]);
    this.posts.set(posts);
    this.tags.set(tags);
  }
}
