import { NextRequest, NextResponse } from 'next/server';

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  keyGenerator?: (request: NextRequest) => string;
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean;
  varyBy?: string[]; // Headers to vary cache by
}

interface CacheEntry {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

// In-memory cache store
// In production, this should use Redis or another persistent cache
const cacheStore: CacheStore = {};

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(cacheStore).forEach(key => {
    const entry = cacheStore[key];
    if (entry.timestamp + entry.ttl < now) {
      delete cacheStore[key];
    }
  });
}, 60000); // Cleanup every minute

/**
 * Default cache key generator
 */
function defaultKeyGenerator(request: NextRequest): string {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;
  return `cache:${request.method}:${pathname}${search}`;
}

/**
 * Default function to determine if response should be cached
 */
function defaultShouldCache(request: NextRequest, response: NextResponse): boolean {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // Only cache successful responses
  if (!response.ok) {
    return false;
  }

  // Don't cache responses with certain headers
  if (response.headers.get('cache-control')?.includes('no-cache')) {
    return false;
  }

  return true;
}

/**
 * Create a caching middleware
 */
export function createCache(config: CacheConfig) {
  const {
    ttl,
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache,
    varyBy = [],
  } = config;

  return {
    /**
     * Get cached response if available
     */
    async get(request: NextRequest): Promise<NextResponse | null> {
      const key = keyGenerator(request);
      const entry = cacheStore[key];

      if (!entry) {
        return null;
      }

      const now = Date.now();
      if (entry.timestamp + entry.ttl < now) {
        delete cacheStore[key];
        return null;
      }

      // Check if cache varies by specific headers
      if (varyBy.length > 0) {
        const varyKey = varyBy
          .map(header => request.headers.get(header) || '')
          .join('|');

        const varyEntry = cacheStore[`${key}:${varyKey}`];
        if (varyEntry && varyEntry.timestamp + varyEntry.ttl >= now) {
          return createResponseFromCache(varyEntry);
        }
        return null;
      }

      return createResponseFromCache(entry);
    },

    /**
     * Store response in cache
     */
    async set(request: NextRequest, response: NextResponse): Promise<void> {
      if (!shouldCache(request, response)) {
        return;
      }

      const key = keyGenerator(request);
      const now = Date.now();

      // Clone response data
      const responseClone = response.clone();
      const data = await responseClone.text();

      // Extract headers
      const headers: Record<string, string> = {};
      responseClone.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const entry: CacheEntry = {
        data,
        headers,
        status: response.status,
        timestamp: now,
        ttl,
      };

      // Handle vary headers
      if (varyBy.length > 0) {
        const varyKey = varyBy
          .map(header => request.headers.get(header) || '')
          .join('|');
        cacheStore[`${key}:${varyKey}`] = entry;
      } else {
        cacheStore[key] = entry;
      }
    },

    /**
     * Clear cache entries
     */
    clear(pattern?: string): void {
      if (!pattern) {
        // Clear all cache
        Object.keys(cacheStore).forEach(key => delete cacheStore[key]);
        return;
      }

      // Clear cache entries matching pattern
      const regex = new RegExp(pattern);
      Object.keys(cacheStore).forEach(key => {
        if (regex.test(key)) {
          delete cacheStore[key];
        }
      });
    },
  };
}

/**
 * Create NextResponse from cache entry
 */
function createResponseFromCache(entry: CacheEntry): NextResponse {
  const response = new NextResponse(entry.data, {
    status: entry.status,
    headers: entry.headers,
  });

  // Add cache headers
  response.headers.set('X-Cache', 'HIT');
  response.headers.set('X-Cache-Date', new Date(entry.timestamp).toISOString());

  return response;
}

/**
 * Cache key generator for admin endpoints
 */
export function adminCacheKeyGenerator(request: NextRequest): string {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;

  // Include admin token in cache key for user-specific data
  const adminToken = request.cookies.get('admin_token')?.value || 'anonymous';
  return `admin_cache:${adminToken}:${request.method}:${pathname}${search}`;
}

/**
 * Cache key generator for analytics endpoints
 */
export function analyticsCacheKeyGenerator(request: NextRequest): string {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;
  return `analytics_cache:${request.method}:${pathname}${search}`;
}

// Common cache configurations
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  short: {
    ttl: 5 * 60 * 1000, // 5 minutes
  },

  // Medium-term cache for analytics data
  analytics: {
    ttl: 15 * 60 * 1000, // 15 minutes
    keyGenerator: analyticsCacheKeyGenerator,
  },

  // Long-term cache for static/semi-static data
  long: {
    ttl: 60 * 60 * 1000, // 1 hour
  },

  // User-specific cache for admin data
  admin: {
    ttl: 10 * 60 * 1000, // 10 minutes
    keyGenerator: adminCacheKeyGenerator,
    varyBy: ['authorization'],
  },

  // Reports cache (longer since reports don't change frequently)
  reports: {
    ttl: 30 * 60 * 1000, // 30 minutes
    keyGenerator: adminCacheKeyGenerator,
  },
};

// Pre-configured cache instances
export const shortCache = createCache(cacheConfigs.short);
export const analyticsCache = createCache(cacheConfigs.analytics);
export const longCache = createCache(cacheConfigs.long);
export const adminCache = createCache(cacheConfigs.admin);
export const reportsCache = createCache(cacheConfigs.reports);

/**
 * Utility function to wrap an API handler with caching
 */
export async function withCache<T>(
  request: NextRequest,
  cache: ReturnType<typeof createCache>,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Try to get cached response
  const cachedResponse = await cache.get(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Execute handler
  const response = await handler();

  // Cache the response
  await cache.set(request, response);

  // Add cache miss header
  response.headers.set('X-Cache', 'MISS');

  return response;
}

/**
 * Cache middleware factory
 */
export function cacheMiddleware(config: CacheConfig | keyof typeof cacheConfigs) {
  const cacheConfig = typeof config === 'string' ? cacheConfigs[config] : config;
  const cache = createCache(cacheConfig);

  return {
    get: (request: NextRequest) => cache.get(request),
    set: (request: NextRequest, response: NextResponse) => cache.set(request, response),
    clear: (pattern?: string) => cache.clear(pattern),
  };
}

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  /**
   * Invalidate all analytics caches
   */
  invalidateAnalytics(): void {
    analyticsCache.clear();
    adminCache.clear('analytics');
  },

  /**
   * Invalidate user-related caches
   */
  invalidateUsers(): void {
    adminCache.clear('users');
    shortCache.clear('users');
  },

  /**
   * Invalidate reports caches
   */
  invalidateReports(): void {
    reportsCache.clear();
    adminCache.clear('reports');
  },

  /**
   * Invalidate all admin caches
   */
  invalidateAdmin(): void {
    adminCache.clear();
    shortCache.clear('admin');
  },

  /**
   * Invalidate all caches
   */
  invalidateAll(): void {
    shortCache.clear();
    analyticsCache.clear();
    longCache.clear();
    adminCache.clear();
    reportsCache.clear();
  },
};

export default cacheMiddleware;