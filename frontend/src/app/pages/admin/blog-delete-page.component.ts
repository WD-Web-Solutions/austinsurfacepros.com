import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BlogPost } from '../../core/models/blog-post.model';
import { LocalBlogService } from '../../core/services/local-blog.service';

@Component({
  selector: 'app-blog-delete-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './blog-delete-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDeletePageComponent implements OnInit {
  private readonly blogService = inject(LocalBlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly post = signal<BlogPost | null>(null);
  readonly deleting = signal(false);

  async ngOnInit(): Promise<void> {
    this.post.set(await this.blogService.getById(this.route.snapshot.paramMap.get('id') ?? ''));
  }

  async confirmDelete(): Promise<void> {
    const post = this.post();
    if (!post) return;
    this.deleting.set(true);
    await this.blogService.delete(post.id);
    await this.router.navigate(['/admin/blogs']);
  }
}
