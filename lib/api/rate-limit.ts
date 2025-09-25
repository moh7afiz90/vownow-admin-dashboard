import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string;
  statusCode?: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// In production, this should use Redis or another persistent store
const rateLimitStore: RateLimitStore = {};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 60000); // Cleanup every minute

/**
 * Create a rate limiting middleware
 * @param config Rate limiting configuration
 * @returns Rate limiting middleware function
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async function rateLimit(
    request: NextRequest,
    response?: NextResponse
  ): Promise<{ limited: boolean; response?: NextResponse }> {
    const key = keyGenerator(request);
    const now = Date.now();
    const resetTime = Math.ceil(now / windowMs) * windowMs;

    // Get or create rate limit entry
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime <= now) {
      rateLimitStore[key] = {
        requests: 0,
        resetTime,
      };
    }

    const entry = rateLimitStore[key];

    // Check if rate limit is exceeded
    if (entry.requests >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      const limitResponse = NextResponse.json(
        { error: message },
        {
          status: statusCode,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );

      return { limited: true, response: limitResponse };
    }

    // Increment request count
    entry.requests++;

    // Add rate limit headers to response if provided
    if (response) {
      const remaining = Math.max(0, maxRequests - entry.requests);
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
    }

    return { limited: false };
  };
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get real IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  let ip = 'unknown';

  if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (request.ip) {
    ip = request.ip;
  }

  return `rate_limit:${ip}`;
}

/**
 * Key generator using user ID from admin token
 */
export function adminUserKeyGenerator(request: NextRequest): string {
  // In a real implementation, you would extract user ID from the admin token
  // For now, fall back to IP-based limiting
  return defaultKeyGenerator(request);
}

/**
 * Key generator for API endpoints
 */
export function apiEndpointKeyGenerator(endpoint: string) {
  return (request: NextRequest): string => {
    const baseKey = defaultKeyGenerator(request);
    return `${baseKey}:${endpoint}`;
  };
}

// Common rate limit configurations
export const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  },

  // Moderate rate limiting for general admin API
  adminApi: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many API requests, please slow down.',
  },

  // Generous rate limiting for analytics endpoints (they may be called frequently)
  analytics: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many analytics requests, please slow down.',
  },

  // Strict rate limiting for report generation/export
  reports: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many report requests, please wait before generating another report.',
  },

  // Very strict rate limiting for system operations
  system: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many system requests, please slow down.',
  },
};

// Pre-configured rate limiters
export const authRateLimit = createRateLimit(rateLimitConfigs.auth);
export const adminApiRateLimit = createRateLimit(rateLimitConfigs.adminApi);
export const analyticsRateLimit = createRateLimit(rateLimitConfigs.analytics);
export const reportsRateLimit = createRateLimit(rateLimitConfigs.reports);
export const systemRateLimit = createRateLimit(rateLimitConfigs.system);

/**
 * Utility function to apply rate limiting to an API route
 */
export async function withRateLimit<T>(
  request: NextRequest,
  rateLimiter: ReturnType<typeof createRateLimit>,
  handler: () => Promise<T>
): Promise<NextResponse | T> {
  const { limited, response } = await rateLimiter(request);

  if (limited && response) {
    return response;
  }

  return handler();
}

/**
 * Rate limit middleware that can be used in API routes
 */
export function rateLimit(config: RateLimitConfig | keyof typeof rateLimitConfigs) {
  const rateLimitConfig = typeof config === 'string' ? rateLimitConfigs[config] : config;
  const limiter = createRateLimit(rateLimitConfig);

  return async function middleware(request: NextRequest) {
    return limiter(request);
  };
}

export default rateLimit;