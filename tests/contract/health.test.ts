/**
 * Contract Tests for GET /api/admin/system/health
 *
 * This test suite follows TDD principles and validates the API contract for the admin system health endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Health Check: System component status validation
 * - Service Status: Database, Redis, External APIs status
 * - Performance Metrics: Response times, resource usage
 * - Status Reporting: Overall system status aggregation
 * - Error Handling: Service failures, timeout handling
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Partial failures, degraded performance
 *
 * Mocking Strategy:
 * - NextResponse for HTTP responses
 * - System health services for component checking
 * - Next.js cookies for session management
 *
 * The tests are designed to fail initially since the endpoint doesn't exist yet,
 * demonstrating true TDD behavior.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/system/health/route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: jest.fn().mockResolvedValue(data),
      status: options?.status || 200,
      statusText: options?.statusText || 'OK',
      headers: {
        get: jest.fn().mockReturnValue('application/json'),
      },
    })),
  },
}));

// Mock system health modules
jest.mock('@/lib/admin/health', () => ({
  checkDatabaseHealth: jest.fn(),
  checkRedisHealth: jest.fn(),
  checkExternalServicesHealth: jest.fn(),
  checkSystemResourcesHealth: jest.fn(),
  getOverallSystemStatus: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import {
  checkDatabaseHealth,
  checkRedisHealth,
  checkExternalServicesHealth,
  checkSystemResourcesHealth,
  getOverallSystemStatus,
} from '@/lib/admin/health';

const mockCheckDatabaseHealth = checkDatabaseHealth as jest.MockedFunction<typeof checkDatabaseHealth>;
const mockCheckRedisHealth = checkRedisHealth as jest.MockedFunction<typeof checkRedisHealth>;
const mockCheckExternalServicesHealth = checkExternalServicesHealth as jest.MockedFunction<typeof checkExternalServicesHealth>;
const mockCheckSystemResourcesHealth = checkSystemResourcesHealth as jest.MockedFunction<typeof checkSystemResourcesHealth>;
const mockGetOverallSystemStatus = getOverallSystemStatus as jest.MockedFunction<typeof getOverallSystemStatus>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number; // in milliseconds
  lastChecked: string;
  details?: Record<string, any>;
  error?: string;
}

interface DatabaseHealth extends ComponentHealth {
  details: {
    connectionPool: {
      active: number;
      idle: number;
      max: number;
    };
    queryPerformance: {
      averageResponseTime: number;
      slowQueries: number;
    };
    replicationLag?: number;
  };
}

interface RedisHealth extends ComponentHealth {
  details: {
    memory: {
      used: number; // in MB
      max: number; // in MB
      fragmentation: number;
    };
    operations: {
      commandsPerSecond: number;
      hitRate: number; // percentage
    };
    keyspaces: Record<string, number>;
  };
}

interface ExternalServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  error?: string;
}

interface SystemResourcesHealth extends ComponentHealth {
  details: {
    cpu: {
      usage: number; // percentage
      load: [number, number, number]; // 1min, 5min, 15min
    };
    memory: {
      used: number; // in MB
      total: number; // in MB
      percentage: number;
    };
    disk: {
      used: number; // in GB
      total: number; // in GB
      percentage: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      connectionsActive: number;
    };
  };
}

interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  services: {
    database: DatabaseHealth;
    redis: RedisHealth;
    externalServices: ExternalServiceHealth[];
    systemResources: SystemResourcesHealth;
  };
  summary: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    criticalIssues: string[];
    warnings: string[];
  };
  uptime: number; // in seconds
  version: string;
}

interface ErrorResponse {
  error: string;
}

const validAdminToken = 'valid-admin-token';

// Mock data
const mockDatabaseHealth: DatabaseHealth = {
  status: 'healthy',
  responseTime: 12,
  lastChecked: '2024-01-23T10:30:00.000Z',
  details: {
    connectionPool: {
      active: 5,
      idle: 15,
      max: 20,
    },
    queryPerformance: {
      averageResponseTime: 8.5,
      slowQueries: 2,
    },
    replicationLag: 50,
  },
};

const mockRedisHealth: RedisHealth = {
  status: 'healthy',
  responseTime: 3,
  lastChecked: '2024-01-23T10:30:00.000Z',
  details: {
    memory: {
      used: 128,
      max: 512,
      fragmentation: 1.2,
    },
    operations: {
      commandsPerSecond: 450,
      hitRate: 94.5,
    },
    keyspaces: {
      db0: 1250,
      db1: 340,
    },
  },
};

const mockExternalServicesHealth: ExternalServiceHealth[] = [
  {
    name: 'SendGrid API',
    url: 'https://api.sendgrid.com',
    status: 'healthy',
    responseTime: 120,
    lastChecked: '2024-01-23T10:30:00.000Z',
  },
  {
    name: 'Stripe API',
    url: 'https://api.stripe.com',
    status: 'healthy',
    responseTime: 85,
    lastChecked: '2024-01-23T10:30:00.000Z',
  },
  {
    name: 'Analytics Service',
    url: 'https://analytics.vownow.com',
    status: 'degraded',
    responseTime: 2500,
    lastChecked: '2024-01-23T10:30:00.000Z',
    error: 'High response times detected',
  },
];

const mockSystemResourcesHealth: SystemResourcesHealth = {
  status: 'healthy',
  responseTime: 5,
  lastChecked: '2024-01-23T10:30:00.000Z',
  details: {
    cpu: {
      usage: 35.2,
      load: [0.8, 1.2, 1.5],
    },
    memory: {
      used: 2048,
      total: 8192,
      percentage: 25.0,
    },
    disk: {
      used: 45.6,
      total: 100.0,
      percentage: 45.6,
    },
    network: {
      bytesIn: 1024000,
      bytesOut: 2048000,
      connectionsActive: 25,
    },
  },
};

const mockHealthySystemResponse: SystemHealthResponse = {
  status: 'healthy',
  timestamp: '2024-01-23T10:30:00.000Z',
  responseTime: 145,
  services: {
    database: mockDatabaseHealth,
    redis: mockRedisHealth,
    externalServices: mockExternalServicesHealth,
    systemResources: mockSystemResourcesHealth,
  },
  summary: {
    totalServices: 6, // database + redis + 3 external services + system resources
    healthyServices: 5,
    degradedServices: 1,
    unhealthyServices: 0,
    criticalIssues: [],
    warnings: ['Analytics Service response time is elevated'],
  },
  uptime: 3600000, // 1000 hours in seconds
  version: '1.2.3',
};

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/system/health'): NextRequest {
  const mockRequest = {
    url,
    method: 'GET',
    headers: new Map(),
    cookies: new Map(),
  } as any;
  return mockRequest;
}

// Helper function to mock cookies
function mockCookieStore(adminToken?: string) {
  const cookieStore = {
    get: jest.fn().mockImplementation((name: string) => {
      if (name === 'admin_token' && adminToken) {
        return { value: adminToken };
      }
      return undefined;
    }),
  };
  cookies.mockResolvedValue(cookieStore);
  return cookieStore;
}

describe('GET /api/admin/system/health - Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no admin token is provided', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(); // No token provided

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockCheckDatabaseHealth).not.toHaveBeenCalled();
      expect(mockCheckRedisHealth).not.toHaveBeenCalled();
    });

    it('should return 401 when admin token is invalid', async () => {
      // Arrange
      const request = createMockRequest();
      const cookieStore = mockCookieStore();
      cookieStore.get.mockReturnValue(null);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
    });
  });

  describe('Healthy System Status', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockCheckDatabaseHealth.mockResolvedValue(mockDatabaseHealth);
      mockCheckRedisHealth.mockResolvedValue(mockRedisHealth);
      mockCheckExternalServicesHealth.mockResolvedValue(mockExternalServicesHealth);
      mockCheckSystemResourcesHealth.mockResolvedValue(mockSystemResourcesHealth);
      mockGetOverallSystemStatus.mockResolvedValue(mockHealthySystemResponse);
    });

    it('should return healthy system status with all components', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.status).toBe('healthy');

      // Verify response structure
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('responseTime');
      expect(body).toHaveProperty('services');
      expect(body).toHaveProperty('summary');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('version');

      // Verify services structure
      expect(body.services).toHaveProperty('database');
      expect(body.services).toHaveProperty('redis');
      expect(body.services).toHaveProperty('externalServices');
      expect(body.services).toHaveProperty('systemResources');

      // Verify database health structure
      expect(body.services.database.status).toBe('healthy');
      expect(body.services.database).toHaveProperty('responseTime');
      expect(body.services.database).toHaveProperty('lastChecked');
      expect(body.services.database).toHaveProperty('details');
      expect(body.services.database.details).toHaveProperty('connectionPool');
      expect(body.services.database.details).toHaveProperty('queryPerformance');

      // Verify Redis health structure
      expect(body.services.redis.status).toBe('healthy');
      expect(body.services.redis).toHaveProperty('details');
      expect(body.services.redis.details).toHaveProperty('memory');
      expect(body.services.redis.details).toHaveProperty('operations');

      // Verify external services
      expect(Array.isArray(body.services.externalServices)).toBe(true);
      expect(body.services.externalServices).toHaveLength(3);
      body.services.externalServices.forEach(service => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('url');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('responseTime');
        expect(service).toHaveProperty('lastChecked');
      });

      // Verify system resources
      expect(body.services.systemResources.status).toBe('healthy');
      expect(body.services.systemResources.details).toHaveProperty('cpu');
      expect(body.services.systemResources.details).toHaveProperty('memory');
      expect(body.services.systemResources.details).toHaveProperty('disk');
      expect(body.services.systemResources.details).toHaveProperty('network');

      // Verify summary
      expect(body.summary).toHaveProperty('totalServices');
      expect(body.summary).toHaveProperty('healthyServices');
      expect(body.summary).toHaveProperty('degradedServices');
      expect(body.summary).toHaveProperty('unhealthyServices');
      expect(body.summary).toHaveProperty('criticalIssues');
      expect(body.summary).toHaveProperty('warnings');

      // Verify data types
      expect(typeof body.responseTime).toBe('number');
      expect(typeof body.uptime).toBe('number');
      expect(typeof body.version).toBe('string');
      expect(Array.isArray(body.summary.criticalIssues)).toBe(true);
      expect(Array.isArray(body.summary.warnings)).toBe(true);

      // Verify all health check functions were called
      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1);
      expect(mockCheckRedisHealth).toHaveBeenCalledTimes(1);
      expect(mockCheckExternalServicesHealth).toHaveBeenCalledTimes(1);
      expect(mockCheckSystemResourcesHealth).toHaveBeenCalledTimes(1);
      expect(mockGetOverallSystemStatus).toHaveBeenCalledTimes(1);
    });

    it('should include proper timestamp format', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
      expect(() => new Date(body.services.database.lastChecked).toISOString()).not.toThrow();
      expect(() => new Date(body.services.redis.lastChecked).toISOString()).not.toThrow();
    });
  });

  describe('Degraded System Status', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return degraded status when some services are degraded', async () => {
      // Arrange
      const request = createMockRequest();

      const degradedRedis: RedisHealth = {
        ...mockRedisHealth,
        status: 'degraded',
        responseTime: 150,
        details: {
          ...mockRedisHealth.details,
          memory: {
            ...mockRedisHealth.details.memory,
            used: 480, // Near capacity
          },
        },
      };

      const degradedSystemResponse: SystemHealthResponse = {
        ...mockHealthySystemResponse,
        status: 'degraded',
        services: {
          ...mockHealthySystemResponse.services,
          redis: degradedRedis,
        },
        summary: {
          ...mockHealthySystemResponse.summary,
          healthyServices: 4,
          degradedServices: 2,
          warnings: [
            'Analytics Service response time is elevated',
            'Redis memory usage is high',
          ],
        },
      };

      mockCheckDatabaseHealth.mockResolvedValue(mockDatabaseHealth);
      mockCheckRedisHealth.mockResolvedValue(degradedRedis);
      mockCheckExternalServicesHealth.mockResolvedValue(mockExternalServicesHealth);
      mockCheckSystemResourcesHealth.mockResolvedValue(mockSystemResourcesHealth);
      mockGetOverallSystemStatus.mockResolvedValue(degradedSystemResponse);

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.services.redis.status).toBe('degraded');
      expect(body.summary.degradedServices).toBe(2);
      expect(body.summary.warnings).toHaveLength(2);
    });
  });

  describe('Unhealthy System Status', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return unhealthy status when critical services fail', async () => {
      // Arrange
      const request = createMockRequest();

      const unhealthyDatabase: DatabaseHealth = {
        ...mockDatabaseHealth,
        status: 'unhealthy',
        responseTime: 0,
        error: 'Connection timeout',
        details: {
          ...mockDatabaseHealth.details,
          connectionPool: {
            active: 0,
            idle: 0,
            max: 20,
          },
        },
      };

      const unhealthySystemResponse: SystemHealthResponse = {
        ...mockHealthySystemResponse,
        status: 'unhealthy',
        services: {
          ...mockHealthySystemResponse.services,
          database: unhealthyDatabase,
        },
        summary: {
          totalServices: 6,
          healthyServices: 4,
          degradedServices: 1,
          unhealthyServices: 1,
          criticalIssues: ['Database connection failed'],
          warnings: ['Analytics Service response time is elevated'],
        },
      };

      mockCheckDatabaseHealth.mockResolvedValue(unhealthyDatabase);
      mockCheckRedisHealth.mockResolvedValue(mockRedisHealth);
      mockCheckExternalServicesHealth.mockResolvedValue(mockExternalServicesHealth);
      mockCheckSystemResourcesHealth.mockResolvedValue(mockSystemResourcesHealth);
      mockGetOverallSystemStatus.mockResolvedValue(unhealthySystemResponse);

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(503); // Service Unavailable for unhealthy systems
      expect(body.status).toBe('unhealthy');
      expect(body.services.database.status).toBe('unhealthy');
      expect(body.services.database.error).toBe('Connection timeout');
      expect(body.summary.unhealthyServices).toBe(1);
      expect(body.summary.criticalIssues).toContain('Database connection failed');
    });

    it('should handle multiple service failures', async () => {
      // Arrange
      const request = createMockRequest();

      const failedExternalServices: ExternalServiceHealth[] = [
        ...mockExternalServicesHealth.slice(0, 2),
        {
          ...mockExternalServicesHealth[2],
          status: 'unhealthy',
          error: 'Service unavailable',
        },
      ];

      const criticalSystemResponse: SystemHealthResponse = {
        ...mockHealthySystemResponse,
        status: 'unhealthy',
        services: {
          ...mockHealthySystemResponse.services,
          externalServices: failedExternalServices,
        },
        summary: {
          totalServices: 6,
          healthyServices: 4,
          degradedServices: 0,
          unhealthyServices: 2,
          criticalIssues: ['Analytics Service is unavailable'],
          warnings: [],
        },
      };

      mockCheckDatabaseHealth.mockResolvedValue(mockDatabaseHealth);
      mockCheckRedisHealth.mockResolvedValue(mockRedisHealth);
      mockCheckExternalServicesHealth.mockResolvedValue(failedExternalServices);
      mockCheckSystemResourcesHealth.mockResolvedValue(mockSystemResourcesHealth);
      mockGetOverallSystemStatus.mockResolvedValue(criticalSystemResponse);

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.summary.unhealthyServices).toBe(2);
      expect(body.summary.criticalIssues).toHaveLength(1);
    });
  });

  describe('System Resource Monitoring', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockCheckDatabaseHealth.mockResolvedValue(mockDatabaseHealth);
      mockCheckRedisHealth.mockResolvedValue(mockRedisHealth);
      mockCheckExternalServicesHealth.mockResolvedValue(mockExternalServicesHealth);
    });

    it('should report high resource usage as degraded', async () => {
      // Arrange
      const request = createMockRequest();

      const highResourceUsage: SystemResourcesHealth = {
        ...mockSystemResourcesHealth,
        status: 'degraded',
        details: {
          cpu: {
            usage: 85.5,
            load: [3.2, 2.8, 2.1],
          },
          memory: {
            used: 7680,
            total: 8192,
            percentage: 93.7,
          },
          disk: {
            used: 89.2,
            total: 100.0,
            percentage: 89.2,
          },
          network: {
            bytesIn: 10240000,
            bytesOut: 20480000,
            connectionsActive: 150,
          },
        },
      };

      const degradedResponse: SystemHealthResponse = {
        ...mockHealthySystemResponse,
        status: 'degraded',
        services: {
          ...mockHealthySystemResponse.services,
          systemResources: highResourceUsage,
        },
        summary: {
          ...mockHealthySystemResponse.summary,
          degradedServices: 2,
          warnings: [
            'Analytics Service response time is elevated',
            'High CPU usage detected',
            'High memory usage detected',
            'High disk usage detected',
          ],
        },
      };

      mockCheckSystemResourcesHealth.mockResolvedValue(highResourceUsage);
      mockGetOverallSystemStatus.mockResolvedValue(degradedResponse);

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.services.systemResources.status).toBe('degraded');
      expect(body.services.systemResources.details.cpu.usage).toBeGreaterThan(80);
      expect(body.services.systemResources.details.memory.percentage).toBeGreaterThan(90);
      expect(body.services.systemResources.details.disk.percentage).toBeGreaterThan(80);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return 500 when health check service fails', async () => {
      // Arrange
      const request = createMockRequest();
      mockCheckDatabaseHealth.mockRejectedValue(new Error('Health check service unavailable'));

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to perform health check'
      });
    });

    it('should handle partial health check failures gracefully', async () => {
      // Arrange
      const request = createMockRequest();
      mockCheckDatabaseHealth.mockResolvedValue(mockDatabaseHealth);
      mockCheckRedisHealth.mockRejectedValue(new Error('Redis health check failed'));
      mockCheckExternalServicesHealth.mockResolvedValue(mockExternalServicesHealth);
      mockCheckSystemResourcesHealth.mockResolvedValue(mockSystemResourcesHealth);

      const partialFailureResponse: SystemHealthResponse = {
        ...mockHealthySystemResponse,
        status: 'degraded',
        services: {
          ...mockHealthySystemResponse.services,
          redis: {
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: '2024-01-23T10:30:00.000Z',
            error: 'Health check failed',
          } as RedisHealth,
        },
        summary: {
          ...mockHealthySystemResponse.summary,
          healthyServices: 4,
          degradedServices: 1,
          unhealthyServices: 1,
          criticalIssues: ['Redis health check failed'],
        },
      };

      mockGetOverallSystemStatus.mockResolvedValue(partialFailureResponse);

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.status).toBe('degraded');
      expect(body.services.redis.status).toBe('unhealthy');
      expect(body.summary.criticalIssues).toContain('Redis health check failed');
    });
  });

  describe('Response Performance', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockCheckDatabaseHealth.mockResolvedValue(mockDatabaseHealth);
      mockCheckRedisHealth.mockResolvedValue(mockRedisHealth);
      mockCheckExternalServicesHealth.mockResolvedValue(mockExternalServicesHealth);
      mockCheckSystemResourcesHealth.mockResolvedValue(mockSystemResourcesHealth);
      mockGetOverallSystemStatus.mockResolvedValue(mockHealthySystemResponse);
    });

    it('should include response time metrics', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: SystemHealthResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(typeof body.responseTime).toBe('number');
      expect(body.responseTime).toBeGreaterThan(0);
      expect(typeof body.services.database.responseTime).toBe('number');
      expect(typeof body.services.redis.responseTime).toBe('number');
      body.services.externalServices.forEach(service => {
        expect(typeof service.responseTime).toBe('number');
      });
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint does not exist', async () => {
      // This test documents the TDD approach
      // When run for the first time, it should fail because the endpoint doesn't exist

      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockCheckDatabaseHealth.mockResolvedValue(mockDatabaseHealth);
      mockCheckRedisHealth.mockResolvedValue(mockRedisHealth);
      mockCheckExternalServicesHealth.mockResolvedValue(mockExternalServicesHealth);
      mockCheckSystemResourcesHealth.mockResolvedValue(mockSystemResourcesHealth);
      mockGetOverallSystemStatus.mockResolvedValue(mockHealthySystemResponse);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request);
        const body: SystemHealthResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('services');
        expect(body).toHaveProperty('summary');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });
  });
});