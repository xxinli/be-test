const DEFAULT_TTL_MS = 60000; // 1 minute TTL

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

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
    cache.set(key, { value, timestamp: Date.now() });
};

export const deleteCache = (key: string): void => {
    cache.delete(key);
};

export const clearCache = (): void => {
    cache.clear();
};
