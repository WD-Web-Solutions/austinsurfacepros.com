import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BlogPostDraft, BlogPostStatus } from '../../core/models/blog-post.model';
import { LocalBlogService } from '../../core/services/local-blog.service';
import { normalizeTag } from '../../core/utils/blog.utils';
import { RichTextEditorComponent } from '../../shared/components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-blog-editor-page',
  standalone: true,
  imports: [ReactiveFormsModule, RichTextEditorComponent, RouterLink],
  templateUrl: './blog-editor-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogEditorPageComponent implements OnInit {
  private readonly blogService = inject(LocalBlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private editingId: string | null = null;

  readonly editing = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly tags = signal<string[]>([]);
  readonly tagError = signal<string | null>(null);
  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(140)] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    summary: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(320)] }),
    contentHtml: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    thumbnailUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    thumbnailAlt: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(180)] }),
    author: new FormControl('Austin Surface Pros', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    publishedAt: new FormControl(this.localDateTime(new Date()), { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<BlogPostStatus>('published', { nonNullable: true, validators: [Validators.required] })
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    const post = await this.blogService.getById(id);
    this.loading.set(false);
    if (!post) {
      this.error.set('The local field note could not be found.');
      return;
    }
    this.editingId = post.id;
    this.editing.set(true);
    this.tags.set([...post.tags]);
    this.form.setValue({
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      contentHtml: post.contentHtml,
      thumbnailUrl: post.thumbnailUrl,
      thumbnailAlt: post.thumbnailAlt,
      author: post.author,
      publishedAt: this.localDateTime(new Date(post.publishedAt)),
      status: post.status
    });
  }

  addTags(value: string, input?: HTMLInputElement): void {
    const additions = value.split(/[#,\n]+/).map(normalizeTag).filter(Boolean);
    if (additions.length) {
      this.tags.update(tags => [...new Set([...tags, ...additions])]);
      this.tagError.set(null);
    }
    if (input) input.value = '';
  }

  handleTagKey(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTags(input.value, input);
    }
  }

  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(value => value !== tag));
  }

  async selectThumbnail(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) {
      this.error.set('Choose an image file no larger than 4 MB.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Thumbnail could not be read.'));
      reader.readAsDataURL(file);
    });
    this.form.controls.thumbnailUrl.setValue(dataUrl);
    if (!this.form.controls.thumbnailAlt.value) this.form.controls.thumbnailAlt.setValue(file.name.replace(/[-_]/g, ' '));
    this.error.set(null);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Complete every required field before saving.');
      return;
    }
    if (!this.tags().length) {
      this.tagError.set('Add at least one hashtag so this post can be filtered.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const value = this.form.getRawValue();
      const draft: BlogPostDraft = {
        ...value,
        slug: value.slug || undefined,
        publishedAt: new Date(value.publishedAt).toISOString(),
        tags: this.tags()
      };
      if (this.editingId) await this.blogService.update(this.editingId, draft);
      else await this.blogService.create(draft);
      await this.router.navigate(['/admin/blogs']);
    } catch {
      this.error.set('The field note could not be saved locally. Check browser storage and try again.');
      this.saving.set(false);
    }
  }

  private localDateTime(date: Date): string {
    const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return adjusted.toISOString().slice(0, 16);
  }
}
