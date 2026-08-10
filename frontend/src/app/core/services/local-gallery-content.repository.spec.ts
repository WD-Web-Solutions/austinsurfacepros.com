import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';

import { LocalGalleryContentRepository } from './local-gallery-content.repository';

describe('LocalGalleryContentRepository', () => {
  let repository: LocalGalleryContentRepository;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    repository = TestBed.inject(LocalGalleryContentRepository);
    await repository.resetDemo();
  });

  it('paginates seeded photos with a stable cursor', async () => {
    const first = await repository.listPage(2);
    const second = await repository.listPage(2, first.nextCursor);

    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    expect(second.items).toHaveLength(2);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('uploads, normalizes metadata, edits, and reorders a browser-local photo', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'crop.webp', { type: 'image/webp' });
    const uploaded = await repository.upload(file, {
      title: '  Night striping  ',
      altText: 'Fresh parking lines at night',
      description: 'Completed after hours.',
      tags: ['#Striping', 'Night Work'],
      city: ' Austin ', state: 'Texas', capturedAt: null,
      cropAspect: '16:9', cropX: 50, cropY: 50, cropZoom: 1
    });
    expect(uploaded.tags).toEqual(['striping', 'night-work']);
    expect(uploaded.city).toBe('Austin');

    const edited = await repository.update(uploaded.id, {
      title: 'Night striping update', altText: uploaded.altText,
      description: uploaded.description, tags: ['maintenance'], city: 'Austin', state: 'Texas'
    });
    const seeds = await repository.listAdmin();
    await repository.reorder(uploaded.id, null, seeds[0]!.id);

    const reordered = await repository.listAdmin();
    expect(edited.tags).toEqual(['maintenance']);
    expect(reordered[0]?.id).toBe(uploaded.id);
  });

  it('deletes uploads and restores demo seeds', async () => {
    const original = await repository.listAdmin();
    await repository.delete(original[0]!.id);
    expect(await repository.listAdmin()).toHaveLength(original.length - 1);

    await repository.resetDemo();
    expect(await repository.listAdmin()).toHaveLength(original.length);
  });
});
