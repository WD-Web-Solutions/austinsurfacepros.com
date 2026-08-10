import 'fake-indexeddb/auto';

import { BLOG_SEEDS } from '../data/blog-seeds.data';
import { LocalBlogRepository } from './local-blog.repository';

describe('LocalBlogRepository', () => {
  it('persists posts and embeddings through IndexedDB', async () => {
    const repository = new LocalBlogRepository();
    await repository.replacePosts(BLOG_SEEDS.slice(0, 2));

    const posts = await repository.listPosts();
    expect(posts).toHaveLength(2);
    expect(posts[0]?.thumbnailUrl).toContain('/assets/images/');

    await repository.putEmbedding('model:post:version', [0.2, 0.4, 0.6]);
    expect(await repository.getEmbedding('model:post:version')).toEqual([0.2, 0.4, 0.6]);

    await repository.deletePost(posts[0]!.id);
    expect(await repository.listPosts()).toHaveLength(1);
  });
});
