import { Injectable, computed, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BLOG_SEEDS } from '../data/blog-seeds.data';
import { BlogPost, BlogPostDraft, BlogTag } from '../models/blog-post.model';
import {
  calculateReadingMinutes,
  clonePost,
  normalizeTags,
  slugify,
  sortPostsNewestFirst
} from '../utils/blog.utils';
import { LocalBlogRepository } from './local-blog.repository';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly repository = inject(LocalBlogRepository);
  private readonly postsState = signal<BlogPost[]>([]);
  private readonly readyPromise: Promise<void>;

  readonly posts = this.postsState.asReadonly();
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly publishedPosts = computed(() => this.postsState().filter(post => post.status === 'published'));
  readonly tags = computed<BlogTag[]>(() => this.deriveTags(this.publishedPosts()));

  constructor() {
    this.readyPromise = this.initialize();
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  async getPublishedPosts(limit?: number): Promise<BlogPost[]> {
    await this.ready();
    const posts = sortPostsNewestFirst(this.publishedPosts()).map(clonePost);
    return typeof limit === 'number' ? posts.slice(0, limit) : posts;
  }

  async getAllPosts(): Promise<BlogPost[]> {
    await this.ready();
    return sortPostsNewestFirst(this.postsState()).map(clonePost);
  }

  async getAllTags(): Promise<BlogTag[]> {
    await this.ready();
    return this.deriveTags(this.postsState());
  }

  async getBySlug(slug: string, includeDraft = false): Promise<BlogPost | null> {
    await this.ready();
    const post = this.postsState().find(candidate => candidate.slug === slug);
    if (!post || (!includeDraft && post.status !== 'published')) {
      return null;
    }
    return clonePost(post);
  }

  async getById(id: string): Promise<BlogPost | null> {
    await this.ready();
    const post = this.postsState().find(candidate => candidate.id === id);
    return post ? clonePost(post) : null;
  }

  async create(draft: BlogPostDraft): Promise<BlogPost> {
    await this.ready();
    const now = new Date().toISOString();
    const post: BlogPost = {
      ...this.prepareDraft(draft),
      id: this.createId(),
      slug: this.uniqueSlug(draft.slug || draft.title),
      createdAt: now,
      updatedAt: now,
      readingMinutes: calculateReadingMinutes(draft.contentHtml)
    };
    await this.repository.putPost(post);
    await this.repository.clearEmbeddings();
    this.postsState.update(posts => sortPostsNewestFirst([...posts, post]));
    return clonePost(post);
  }

  async update(id: string, draft: BlogPostDraft): Promise<BlogPost> {
    await this.ready();
    const existing = this.postsState().find(post => post.id === id);
    if (!existing) {
      throw new Error('Blog post not found.');
    }
    const updated: BlogPost = {
      ...existing,
      ...this.prepareDraft(draft),
      slug: this.uniqueSlug(draft.slug || draft.title, id),
      updatedAt: new Date().toISOString(),
      readingMinutes: calculateReadingMinutes(draft.contentHtml)
    };
    await this.repository.putPost(updated);
    await this.repository.clearEmbeddings();
    this.postsState.update(posts => sortPostsNewestFirst(posts.map(post => post.id === id ? updated : post)));
    return clonePost(updated);
  }

  async delete(id: string): Promise<void> {
    await this.ready();
    await this.repository.deletePost(id);
    await this.repository.clearEmbeddings();
    this.postsState.update(posts => posts.filter(post => post.id !== id));
  }

  async resetDemoContent(): Promise<void> {
    if (!environment.demo) {
      throw new Error('Demo content can only be reset in the demo environment.');
    }
    await this.repository.replacePosts(BLOG_SEEDS);
    this.postsState.set(sortPostsNewestFirst(BLOG_SEEDS).map(clonePost));
  }

  async getCachedEmbedding(post: BlogPost): Promise<number[] | null> {
    return this.repository.getEmbedding(this.embeddingKey(post));
  }

  async cacheEmbedding(post: BlogPost, vector: number[]): Promise<void> {
    await this.repository.putEmbedding(this.embeddingKey(post), vector);
  }

  async clearEmbeddingCache(): Promise<void> {
    await this.repository.clearEmbeddings();
  }

  private async initialize(): Promise<void> {
    try {
      await this.repository.initialize(BLOG_SEEDS, environment.blog.seedOnFirstRun);
      const posts = await this.repository.listPosts();
      this.postsState.set(sortPostsNewestFirst(posts));
    } catch {
      this.error.set('Local blog content could not be loaded in this browser.');
    } finally {
      this.loading.set(false);
    }
  }

  private prepareDraft(draft: BlogPostDraft): Omit<BlogPostDraft, 'slug'> {
    return {
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      contentHtml: this.sanitizeRichHtml(draft.contentHtml),
      thumbnailUrl: draft.thumbnailUrl.trim(),
      thumbnailAlt: draft.thumbnailAlt.trim(),
      author: draft.author.trim(),
      publishedAt: new Date(draft.publishedAt).toISOString(),
      status: draft.status,
      tags: normalizeTags(draft.tags)
    };
  }

  private uniqueSlug(value: string, excludedId?: string): string {
    const base = slugify(value) || 'untitled-post';
    let candidate = base;
    let suffix = 2;
    const slugs = new Set(this.postsState().filter(post => post.id !== excludedId).map(post => post.slug));
    while (slugs.has(candidate)) {
      candidate = `${base}-${suffix++}`;
    }
    return candidate;
  }

  private deriveTags(posts: BlogPost[]): BlogTag[] {
    const counts = new Map<string, number>();
    posts.forEach(post => post.tags.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }

  private sanitizeRichHtml(html: string): string {
    if (typeof document === 'undefined') {
      return html;
    }
    const parsed = document.implementation.createHTMLDocument('blog-content');
    parsed.body.innerHTML = html;
    parsed.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta').forEach(node => node.remove());
    parsed.body.querySelectorAll('*').forEach(element => {
      [...element.attributes].forEach(attribute => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith('on') || name === 'style' || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
          element.removeAttribute(attribute.name);
        }
      });
      if (element.tagName === 'A') {
        element.setAttribute('rel', 'noopener noreferrer');
      }
    });
    return parsed.body.innerHTML;
  }

  private embeddingKey(post: BlogPost): string {
    return `${environment.blog.embeddingModelId}:${post.id}:${post.updatedAt}`;
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `blog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
