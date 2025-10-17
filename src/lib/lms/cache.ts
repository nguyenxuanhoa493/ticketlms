/**
 * LMS Client Cache
 * Caches LMS client instances during session to avoid repeated logins
 * Cache key format: {environmentId}-{dmn}-{userCode}
 */

import { LmsClient } from "./index";

interface CachedClient {
    client: LmsClient;
    timestamp: number;
}

class LmsClientCache {
    private cache = new Map<string, CachedClient>();
    private readonly MAX_AGE = 30 * 60 * 1000; // 30 minutes

    /**
     * Generate cache key from credentials
     */
    private getCacheKey(environmentId: string, dmn: string, userCode: string): string {
        return `${environmentId}-${dmn}-${userCode}`;
    }

    /**
     * Get cached client if available and not expired
     */
    get(environmentId: string, dmn: string, userCode: string): LmsClient | null {
        const key = this.getCacheKey(environmentId, dmn, userCode);
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // Check if expired
        const age = Date.now() - cached.timestamp;
        if (age > this.MAX_AGE) {
            this.cache.delete(key);
            return null;
        }

        return cached.client;
    }

    /**
     * Store client in cache
     */
    set(environmentId: string, dmn: string, userCode: string, client: LmsClient): void {
        const key = this.getCacheKey(environmentId, dmn, userCode);
        this.cache.set(key, {
            client,
            timestamp: Date.now(),
        });
    }

    /**
     * Clear specific cached client
     */
    clear(environmentId: string, dmn: string, userCode: string): void {
        const key = this.getCacheKey(environmentId, dmn, userCode);
        this.cache.delete(key);
    }

    /**
     * Clear all cached clients
     */
    clearAll(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
        };
    }
}

// Global singleton instance
export const lmsClientCache = new LmsClientCache();
