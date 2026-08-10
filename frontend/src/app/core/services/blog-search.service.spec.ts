import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';

import { BlogSearchService } from './blog-search.service';
import { LocalBlogService } from './local-blog.service';

describe('BlogSearchService', () => {
  let blog: LocalBlogService;
  let search: BlogSearchService;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    blog = TestBed.inject(LocalBlogService);
    search = TestBed.inject(BlogSearchService);
    await blog.ready();
    await blog.resetDemoContent();
    search.state.set('fallback');
  });

  it('ranks exact keyword matches', async () => {
    const results = await search.search('night striping');
    expect(results[0]?.post.slug).toBe('night-striping-without-disrupting-tenants');
    expect(results[0]!.keywordScore).toBeGreaterThan(0.5);
  });

  it('finds misspelled terms with fuzzy matching', async () => {
    const results = await search.search('seelcoating');
    expect(results[0]?.post.slug).toBe('why-weather-matters-for-sealcoating');
    expect(results[0]!.fuzzyScore).toBeGreaterThan(0.6);
  });

  it('filters categories directly from post hashtags', async () => {
    const results = await search.search('', ['#accessibility']);
    expect(results).toHaveLength(1);
    expect(results[0]?.post.tags).toContain('accessibility');
  });
});
