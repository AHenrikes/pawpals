export type Fetcher<T> = () => Promise<T>;

export function makeCache<T>(ttl = 10 * 60 * 1000) {
  const map = new Map<string, { value: T; timestamp: number }>();

  return {
    async get(key: string, fetcher: Fetcher<T>): Promise<T> {
      const entry = map.get(key);
      if (entry && Date.now() - entry.timestamp < ttl) return entry.value;

      const value = await fetcher();
      map.set(key, { value, timestamp: Date.now() });
      return value;
    },

    set(key: string, value: T) {
      map.set(key, { value, timestamp: Date.now() });
    },

    has(key: string) {
      return map.has(key);
    },

    clear() {
      map.clear();
    },
  };
}
