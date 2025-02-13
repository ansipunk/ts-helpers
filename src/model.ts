export class Model<K extends Deno.KvKey | Deno.KvKeyPart, V> {
  private kv: Deno.Kv;
  private prefix: Deno.KvKey;
  private cache: Map<K, V | null>;

  constructor(kv: Deno.Kv, prefix: Deno.KvKey) {
    this.kv = kv;
    this.prefix = prefix;
    this.cache = new Map();
  }

  private buildKey(key: K): Deno.KvKey {
    return this.prefix.concat(key);
  }

  async get(key: K): Promise<V | null> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    const item = await this.kv.get(this.buildKey(key));
    const value = item.value as V | null;

    this.cache.set(key, value);
    return value;
  }

  async set(key: K, value: V): Promise<void> {
    await this.kv.set(this.buildKey(key), value);
    this.cache.set(key, value);
  }

  async del(key: K): Promise<void> {
    await this.kv.delete(this.buildKey(key));
    this.cache.set(key, null);
  }

  async *all(): AsyncGenerator<V, void, void> {
    const iterator = this.kv.list({ prefix: this.prefix });
    for await (const item of iterator) {
      yield item.value as V;
    }
  }

  async drop(): Promise<void> {
    const iterator = this.kv.list({ prefix: this.prefix });
    for await (const item of iterator) {
      await this.kv.delete(item.key);
    }
    this.cache = new Map();
  }
}
