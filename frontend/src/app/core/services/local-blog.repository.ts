import { Injectable } from '@angular/core';

import { BlogPost } from '../models/blog-post.model';
import { clonePost } from '../utils/blog.utils';

interface StoredEmbedding {
  key: string;
  vector: number[];
}

const DATABASE_NAME = 'austin-surface-pros-blog';
const DATABASE_VERSION = 1;
const POSTS_STORE = 'posts';
const META_STORE = 'meta';
const EMBEDDINGS_STORE = 'embeddings';
const INITIALIZED_KEY = 'initialized';

@Injectable({ providedIn: 'root' })
export class LocalBlogRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;
  private readonly memoryPosts = new Map<string, BlogPost>();
  private readonly memoryEmbeddings = new Map<string, number[]>();
  private memoryInitialized = false;

  async initialize(seeds: BlogPost[], seedOnFirstRun: boolean): Promise<void> {
    if (!this.hasIndexedDb()) {
      if (!this.memoryInitialized && seedOnFirstRun) {
        seeds.forEach(post => this.memoryPosts.set(post.id, clonePost(post)));
      }
      this.memoryInitialized = true;
      return;
    }

    const database = await this.openDatabase();
    const initialized = await this.readValue<boolean>(database, META_STORE, INITIALIZED_KEY);
    if (initialized) {
      return;
    }

    const transaction = database.transaction([POSTS_STORE, META_STORE], 'readwrite');
    if (seedOnFirstRun) {
      const postStore = transaction.objectStore(POSTS_STORE);
      seeds.forEach(post => postStore.put(clonePost(post)));
    }
    transaction.objectStore(META_STORE).put(true, INITIALIZED_KEY);
    await this.transactionComplete(transaction);
  }

  async listPosts(): Promise<BlogPost[]> {
    if (!this.hasIndexedDb()) {
      return [...this.memoryPosts.values()].map(clonePost);
    }
    const database = await this.openDatabase();
    const posts = await this.request<BlogPost[]>(database.transaction(POSTS_STORE).objectStore(POSTS_STORE).getAll());
    return posts.map(clonePost);
  }

  async putPost(post: BlogPost): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.memoryPosts.set(post.id, clonePost(post));
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction(POSTS_STORE, 'readwrite');
    transaction.objectStore(POSTS_STORE).put(clonePost(post));
    await this.transactionComplete(transaction);
  }

  async deletePost(id: string): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.memoryPosts.delete(id);
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction(POSTS_STORE, 'readwrite');
    transaction.objectStore(POSTS_STORE).delete(id);
    await this.transactionComplete(transaction);
  }

  async replacePosts(posts: BlogPost[]): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.memoryPosts.clear();
      posts.forEach(post => this.memoryPosts.set(post.id, clonePost(post)));
      this.memoryEmbeddings.clear();
      this.memoryInitialized = true;
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction([POSTS_STORE, META_STORE, EMBEDDINGS_STORE], 'readwrite');
    const postStore = transaction.objectStore(POSTS_STORE);
    postStore.clear();
    posts.forEach(post => postStore.put(clonePost(post)));
    transaction.objectStore(EMBEDDINGS_STORE).clear();
    transaction.objectStore(META_STORE).put(true, INITIALIZED_KEY);
    await this.transactionComplete(transaction);
  }

  async getEmbedding(key: string): Promise<number[] | null> {
    if (!this.hasIndexedDb()) {
      return this.memoryEmbeddings.get(key) ?? null;
    }
    const database = await this.openDatabase();
    const stored = await this.readValue<StoredEmbedding>(database, EMBEDDINGS_STORE, key);
    return stored?.vector ?? null;
  }

  async putEmbedding(key: string, vector: number[]): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.memoryEmbeddings.set(key, [...vector]);
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction(EMBEDDINGS_STORE, 'readwrite');
    transaction.objectStore(EMBEDDINGS_STORE).put({ key, vector: [...vector] } satisfies StoredEmbedding);
    await this.transactionComplete(transaction);
  }

  async clearEmbeddings(): Promise<void> {
    if (!this.hasIndexedDb()) {
      this.memoryEmbeddings.clear();
      return;
    }
    const database = await this.openDatabase();
    const transaction = database.transaction(EMBEDDINGS_STORE, 'readwrite');
    transaction.objectStore(EMBEDDINGS_STORE).clear();
    await this.transactionComplete(transaction);
  }

  private hasIndexedDb(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) {
      return this.databasePromise;
    }

    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(POSTS_STORE)) {
          database.createObjectStore(POSTS_STORE, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE);
        }
        if (!database.objectStoreNames.contains(EMBEDDINGS_STORE)) {
          database.createObjectStore(EMBEDDINGS_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('The local blog database could not be opened.'));
    });
    return this.databasePromise;
  }

  private async readValue<T>(database: IDBDatabase, storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.request<T | undefined>(database.transaction(storeName).objectStore(storeName).get(key));
  }

  private request<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('A local blog operation failed.'));
    });
  }

  private transactionComplete(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('A local blog transaction failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('A local blog transaction was aborted.'));
    });
  }
}
