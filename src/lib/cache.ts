const DEFAULT_TTL_MS = 60000;
const MAX_CACHE_SIZE = 10;

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const evictOldest = (): void => {
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
    }
};

export const getCache = <T>(key: string): T | undefined => {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (entry && now - entry.timestamp < DEFAULT_TTL_MS) {
        return entry.value;
    }

    if (entry) {
        cache.delete(key);
    }

    return undefined;
};

export const setCache = <T>(key: string, value: T): void => {
    evictOldest();
    cache.set(key, { value, timestamp: Date.now() });
};

export const deleteCache = (key: string): void => {
    cache.delete(key);
};

export const clearCache = (): void => {
    cache.clear();
};
