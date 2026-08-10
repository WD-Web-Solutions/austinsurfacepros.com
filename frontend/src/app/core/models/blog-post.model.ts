export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentHtml: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  author: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  status: BlogPostStatus;
  tags: string[];
  readingMinutes: number;
}

export interface BlogPostDraft {
  title: string;
  slug?: string;
  summary: string;
  contentHtml: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  author: string;
  publishedAt: string;
  status: BlogPostStatus;
  tags: string[];
}

export interface BlogTag {
  name: string;
  count: number;
}

export interface BlogSearchResult {
  post: BlogPost;
  score: number;
  keywordScore: number;
  fuzzyScore: number;
  semanticScore: number | null;
}

export type BlogSearchState = 'idle' | 'loading' | 'ready' | 'fallback';
