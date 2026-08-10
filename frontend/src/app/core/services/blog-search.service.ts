import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BlogPost, BlogSearchResult, BlogSearchState } from '../models/blog-post.model';
import { normalizeTags, searchablePostText, sortPostsNewestFirst } from '../utils/blog.utils';
import { LocalBlogService } from './local-blog.service';

interface TensorOutput {
  tolist(): unknown;
}

type FeatureExtractionPipeline = (
  input: string | string[],
  options: { pooling: 'mean'; normalize: true }
) => Promise<TensorOutput>;

interface ModelProgress {
  status?: string;
  progress?: number;
}

@Injectable({ providedIn: 'root' })
export class BlogSearchService {
  private readonly blogService = inject(LocalBlogService);
  private readonly embeddingMemory = new Map<string, number[]>();
  private pipeline: FeatureExtractionPipeline | null = null;
  private preloadPromise: Promise<void> | null = null;

  readonly state = signal<BlogSearchState>('idle');
  readonly progress = signal(0);

  preload(): Promise<void> {
    if (!this.preloadPromise) {
      this.preloadPromise = this.loadModel();
    }
    return this.preloadPromise;
  }

  async search(query: string, selectedTags: string[] = [], includeDrafts = false): Promise<BlogSearchResult[]> {
    const posts = includeDrafts
      ? await this.blogService.getAllPosts()
      : await this.blogService.getPublishedPosts();
    const tags = normalizeTags(selectedTags);
    const candidates = tags.length
      ? posts.filter(post => tags.some(tag => post.tags.includes(tag)))
      : posts;
    const normalizedQuery = this.normalizeText(query);

    if (!normalizedQuery) {
      return sortPostsNewestFirst(candidates).map(post => ({
        post,
        score: 1,
        keywordScore: 1,
        fuzzyScore: 1,
        semanticScore: null
      }));
    }

    if (this.state() === 'idle') {
      void this.preload();
    }

    let queryVector: number[] | null = null;
    if (this.pipeline) {
      try {
        [queryVector] = await this.embedTexts([normalizedQuery]);
      } catch {
        this.pipeline = null;
        this.state.set('fallback');
      }
    }

    const results = await Promise.all(candidates.map(async post => {
      const source = this.normalizeText(searchablePostText(post));
      const keywordScore = this.keywordScore(normalizedQuery, post, source);
      const fuzzyScore = this.fuzzyScore(normalizedQuery, post, source);
      const semanticScore = queryVector ? await this.semanticScore(queryVector, post) : null;
      const score = semanticScore === null
        ? 0.72 * keywordScore + 0.28 * fuzzyScore
        : 0.48 * keywordScore + 0.18 * fuzzyScore + 0.34 * semanticScore;
      return { post, score, keywordScore, fuzzyScore, semanticScore } satisfies BlogSearchResult;
    }));

    const ranked = results
      .sort((left, right) => right.score - left.score || Date.parse(right.post.publishedAt) - Date.parse(left.post.publishedAt));
    const bestScore = ranked[0]?.score ?? 0;
    const relevanceFloor = Math.max(0.12, bestScore * 0.68);
    return ranked.filter(result => result.score >= relevanceFloor || result.keywordScore >= 0.55);
  }

  private async loadModel(): Promise<void> {
    this.state.set('loading');
    this.progress.set(0);
    try {
      await this.blogService.ready();
      const transformers = await import('@huggingface/transformers');
      transformers.env.allowLocalModels = true;
      transformers.env.allowRemoteModels = false;
      transformers.env.localModelPath = environment.blog.localModelPath;
      transformers.env.useBrowserCache = true;

      const progressCallback = (event: ModelProgress): void => {
        if (typeof event.progress === 'number') {
          this.progress.set(Math.max(this.progress(), Math.round(event.progress)));
        }
      };

      const preferredDevice = this.hasWebGpu() ? 'webgpu' : 'wasm';
      try {
        this.pipeline = await transformers.pipeline(
          'feature-extraction',
          environment.blog.embeddingModelId,
          {
            device: preferredDevice,
            dtype: environment.blog.embeddingDtype,
            progress_callback: progressCallback
          }
        ) as unknown as FeatureExtractionPipeline;
      } catch (error) {
        if (preferredDevice === 'wasm') {
          throw error;
        }
        this.pipeline = await transformers.pipeline(
          'feature-extraction',
          environment.blog.embeddingModelId,
          {
            device: 'wasm',
            dtype: environment.blog.embeddingDtype,
            progress_callback: progressCallback
          }
        ) as unknown as FeatureExtractionPipeline;
      }

      this.progress.set(100);
      this.state.set('ready');
      await this.warmPostEmbeddings();
    } catch {
      this.pipeline = null;
      this.state.set('fallback');
    }
  }

  private async warmPostEmbeddings(): Promise<void> {
    if (!this.pipeline) {
      return;
    }
    const posts = await this.blogService.getPublishedPosts();
    const missing: BlogPost[] = [];
    for (const post of posts) {
      const cached = await this.blogService.getCachedEmbedding(post);
      if (cached) {
        this.embeddingMemory.set(this.postCacheKey(post), cached);
      } else {
        missing.push(post);
      }
    }
    if (!missing.length) {
      return;
    }
    const vectors = await this.embedTexts(missing.map(searchablePostText));
    await Promise.all(missing.map(async (post, index) => {
      const vector = vectors[index];
      if (!vector) {
        return;
      }
      this.embeddingMemory.set(this.postCacheKey(post), vector);
      await this.blogService.cacheEmbedding(post, vector);
    }));
  }

  private async semanticScore(queryVector: number[], post: BlogPost): Promise<number> {
    const key = this.postCacheKey(post);
    let vector = this.embeddingMemory.get(key) ?? await this.blogService.getCachedEmbedding(post);
    if (!vector && this.pipeline) {
      [vector] = await this.embedTexts([searchablePostText(post)]);
      if (vector) {
        this.embeddingMemory.set(key, vector);
        await this.blogService.cacheEmbedding(post, vector);
      }
    }
    return vector ? Math.max(0, Math.min(1, this.dot(queryVector, vector))) : 0;
  }

  private async embedTexts(texts: string[]): Promise<number[][]> {
    if (!this.pipeline || texts.length === 0) {
      return [];
    }
    const output = await this.pipeline(texts, { pooling: 'mean', normalize: true });
    const values = output.tolist();
    if (!Array.isArray(values)) {
      return [];
    }
    return values.map(value => Array.isArray(value) ? value.map(Number) : []);
  }

  private keywordScore(query: string, post: BlogPost, source: string): number {
    const title = this.normalizeText(post.title);
    const summary = this.normalizeText(post.summary);
    const tags = post.tags.join(' ');
    const stopWords = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to', 'with', 'after']);
    const tokens = query.split(' ').filter(token => token && !stopWords.has(token));
    let score = 0;
    if (title === query) score += 0.42;
    else if (title.includes(query)) score += 0.32;
    if (tags.includes(query)) score += 0.25;
    if (summary.includes(query)) score += 0.16;
    if (source.includes(query)) score += 0.08;
    const coverage = tokens.filter(token => source.includes(token)).length / Math.max(1, tokens.length);
    score += coverage * 0.28;
    const titleCoverage = tokens.filter(token => title.includes(token)).length / Math.max(1, tokens.length);
    score += titleCoverage * 0.2;
    const bigrams = tokens.slice(0, -1).map((token, index) => `${token} ${tokens[index + 1]}`);
    if (bigrams.length) {
      score += bigrams.filter(bigram => source.includes(bigram)).length / bigrams.length * 0.24;
    }
    return Math.min(1, score);
  }

  private fuzzyScore(query: string, post: BlogPost, source: string): number {
    const queryTokens = query.split(' ').filter(token => token.length > 2);
    if (!queryTokens.length) {
      return 0;
    }
    const candidates = this.normalizeText(`${post.title} ${post.tags.join(' ')} ${post.summary}`)
      .split(' ')
      .filter(token => token.length > 2)
      .slice(0, 120);
    const tokenScore = queryTokens.reduce((total, token) => {
      const best = candidates.reduce((maximum, candidate) => Math.max(maximum, this.trigramDice(token, candidate)), 0);
      return total + best;
    }, 0) / queryTokens.length;
    const phraseScore = this.trigramDice(query, source.slice(0, 900));
    return Math.min(1, tokenScore * 0.86 + phraseScore * 0.14);
  }

  private trigramDice(left: string, right: string): number {
    if (left === right) return 1;
    if (left.length < 3 || right.length < 3) return left === right ? 1 : 0;
    const leftTrigrams = this.trigrams(left);
    const rightTrigrams = this.trigrams(right);
    let intersection = 0;
    leftTrigrams.forEach(trigram => {
      if (rightTrigrams.has(trigram)) intersection += 1;
    });
    return (2 * intersection) / (leftTrigrams.size + rightTrigrams.size);
  }

  private trigrams(value: string): Set<string> {
    const normalized = `  ${value} `;
    const result = new Set<string>();
    for (let index = 0; index <= normalized.length - 3; index += 1) {
      result.add(normalized.slice(index, index + 3));
    }
    return result;
  }

  private dot(left: number[], right: number[]): number {
    const length = Math.min(left.length, right.length);
    let score = 0;
    for (let index = 0; index < length; index += 1) {
      score += (left[index] ?? 0) * (right[index] ?? 0);
    }
    return score;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private postCacheKey(post: BlogPost): string {
    return `${post.id}:${post.updatedAt}`;
  }

  private hasWebGpu(): boolean {
    return typeof navigator !== 'undefined' && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
  }
}
