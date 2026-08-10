import { BlogPost } from '../models/blog-post.model';

export function normalizeTag(value: string): string {
  return value
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeTags(values: string[]): string[] {
  return [...new Set(values.map(normalizeTag).filter(Boolean))];
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function htmlToText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ');
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent ?? '';
}

export function calculateReadingMinutes(html: string): number {
  const wordCount = htmlToText(html).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 225));
}

export function searchablePostText(post: BlogPost): string {
  return [post.title, post.summary, post.tags.join(' '), htmlToText(post.contentHtml)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sortPostsNewestFirst(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((left, right) => {
    const publishedDifference = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    return publishedDifference || Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}

export function clonePost(post: BlogPost): BlogPost {
  return { ...post, tags: [...post.tags] };
}
