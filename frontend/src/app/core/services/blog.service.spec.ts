import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';

import { BLOG_SEEDS } from '../data/blog-seeds.data';
import { BlogService } from './blog.service';

describe('BlogService', () => {
  let service: BlogService;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    service = TestBed.inject(BlogService);
    await service.ready();
    await service.resetDemoContent();
  });

  it('loads image-backed demo content newest first and limits homepage results', async () => {
    const recent = await service.getPublishedPosts(3);
    expect(recent).toHaveLength(3);
    expect(recent[0]?.id).toBe(BLOG_SEEDS[0]?.id);
    expect(recent.every(post => Boolean(post.thumbnailUrl))).toBe(true);
  });

  it('creates, updates, and deletes a local post while deriving hashtag categories', async () => {
    const created = await service.create({
      title: 'Drainage Planning for Parking Lots',
      summary: 'A local service test post about drainage planning.',
      contentHtml: '<h2>Start with water</h2><p>Map the route before planning a repair.</p>',
      thumbnailUrl: '/assets/images/design-lab/parking-aerial.jpg',
      thumbnailAlt: 'Parking lot viewed from above',
      author: 'Test Author',
      publishedAt: '2026-08-09T12:00:00.000Z',
      status: 'published',
      tags: ['#Drainage', 'Parking Lots', '#drainage']
    });
    expect(created.tags).toEqual(['drainage', 'parking-lots']);

    const updated = await service.update(created.id, {
      ...created,
      title: 'Drainage Planning for Busy Parking Lots',
      tags: ['drainage', 'property-management']
    });
    expect(updated.slug).toBe('drainage-planning-for-parking-lots');
    expect((await service.getAllTags()).some(tag => tag.name === 'property-management')).toBe(true);

    await service.delete(created.id);
    expect(await service.getById(created.id)).toBeNull();
  });

  it('sanitizes executable rich-text markup before persistence', async () => {
    const created = await service.create({
      title: 'Safe content', summary: 'Sanitizer coverage',
      contentHtml: '<p onclick="alert(1)">Useful</p><script>alert(2)</script><a href="javascript:alert(3)">bad</a>',
      thumbnailUrl: '/assets/images/design-lab/asphalt-road.jpg', thumbnailAlt: 'Road',
      author: 'Test', publishedAt: '2026-08-09T12:00:00.000Z', status: 'draft', tags: ['safety']
    });
    expect(created.contentHtml).not.toContain('script');
    expect(created.contentHtml).not.toContain('onclick');
    expect(created.contentHtml).not.toContain('javascript:');
  });

  it('clears persisted article vectors when local content changes', async () => {
    const seed = (await service.getPublishedPosts())[0]!;
    await service.cacheEmbedding(seed, [0.1, 0.2]);
    expect(await service.getCachedEmbedding(seed)).toEqual([0.1, 0.2]);

    await service.create({
      title: 'Cache invalidation', summary: 'Changes require fresh search vectors.',
      contentHtml: '<p>Fresh content needs a fresh vector.</p>',
      thumbnailUrl: '/assets/images/design-lab/asphalt-road.jpg', thumbnailAlt: 'Road',
      author: 'Test', publishedAt: '2026-08-09T12:00:00.000Z', status: 'draft', tags: ['search']
    });

    expect(await service.getCachedEmbedding(seed)).toBeNull();
  });
});
