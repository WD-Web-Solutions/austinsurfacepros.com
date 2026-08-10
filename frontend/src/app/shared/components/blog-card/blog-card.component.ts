import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BlogPost } from '../../../core/models/blog-post.model';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './blog-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogCardComponent {
  readonly post = input.required<BlogPost>();
  readonly showAdminActions = input(false);
}
