import { supabase } from '@/lib/supabase';

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number; // in milliseconds
  lastChecked: string;
  details?: Record<string, any>;
  error?: string;
}

export interface DatabaseHealth extends ComponentHealth {
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

export interface RedisHealth extends ComponentHealth {
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

export interface ExternalServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  error?: string;
}

export interface SystemResourcesHealth extends ComponentHealth {
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

export interface SystemHealthResponse {
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

const startTime = Date.now();

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now();

  try {
    // Simple connectivity test
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: error.message,
        details: {
          connectionPool: {
            active: 0,
            idle: 0,
            max: 20,
          },
          queryPerformance: {
            averageResponseTime: 0,
            slowQueries: 0,
          },
        },
      };
    }

    // Mock connection pool and performance data
    const status: DatabaseHealth['status'] = responseTime > 100 ? 'degraded' : 'healthy';

    return {
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        connectionPool: {
          active: Math.floor(Math.random() * 10) + 1,
          idle: Math.floor(Math.random() * 15) + 5,
          max: 20,
        },
        queryPerformance: {
          averageResponseTime: responseTime * 0.8,
          slowQueries: responseTime > 100 ? 2 : 0,
        },
        replicationLag: Math.floor(Math.random() * 100),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        connectionPool: {
          active: 0,
          idle: 0,
          max: 20,
        },
        queryPerformance: {
          averageResponseTime: 0,
          slowQueries: 0,
        },
      },
    };
  }
}

export async function checkRedisHealth(): Promise<RedisHealth> {
  const startTime = Date.now();

  try {
    // Mock Redis health check since we don't have Redis configured
    const responseTime = Math.floor(Math.random() * 50) + 1;
    const memoryUsage = Math.floor(Math.random() * 200) + 50;

    const status: RedisHealth['status'] =
      memoryUsage > 400 ? 'degraded' :
      responseTime > 30 ? 'degraded' : 'healthy';

    return {
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        memory: {
          used: memoryUsage,
          max: 512,
          fragmentation: 1.2,
        },
        operations: {
          commandsPerSecond: Math.floor(Math.random() * 500) + 200,
          hitRate: Math.random() * 10 + 90,
        },
        keyspaces: {
          db0: Math.floor(Math.random() * 2000) + 500,
          db1: Math.floor(Math.random() * 500) + 100,
        },
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Redis health check failed',
      details: {
        memory: {
          used: 0,
          max: 512,
          fragmentation: 0,
        },
        operations: {
          commandsPerSecond: 0,
          hitRate: 0,
        },
        keyspaces: {},
      },
    };
  }
}

export async function checkExternalServicesHealth(): Promise<ExternalServiceHealth[]> {
  const services = [
    { name: 'SendGrid API', url: 'https://api.sendgrid.com' },
    { name: 'Stripe API', url: 'https://api.stripe.com' },
    { name: 'Analytics Service', url: 'https://analytics.vownow.com' },
  ];

  const healthChecks = services.map(async (service) => {
    const startTime = Date.now();

    try {
      // Mock external service health check
      const mockResponseTime = Math.floor(Math.random() * 300) + 50;
      const mockFailure = Math.random() < 0.1; // 10% chance of failure

      if (mockFailure) {
        return {
          ...service,
          status: 'unhealthy' as const,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: 'Service unavailable',
        };
      }

      const status: ExternalServiceHealth['status'] =
        mockResponseTime > 2000 ? 'degraded' :
        mockResponseTime > 200 ? 'degraded' : 'healthy';

      return {
        ...service,
        status,
        responseTime: mockResponseTime,
        lastChecked: new Date().toISOString(),
        error: status === 'degraded' ? 'High response times detected' : undefined,
      };
    } catch (error) {
      return {
        ...service,
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  });

  return Promise.all(healthChecks);
}

export async function checkSystemResourcesHealth(): Promise<SystemResourcesHealth> {
  const startTime = Date.now();

  try {
    // Mock system resource monitoring
    const cpuUsage = Math.random() * 60 + 20; // 20-80%
    const memoryUsage = Math.random() * 60 + 30; // 30-90%
    const diskUsage = Math.random() * 50 + 30; // 30-80%

    const status: SystemResourcesHealth['status'] =
      cpuUsage > 80 || memoryUsage > 90 || diskUsage > 85 ? 'degraded' :
      cpuUsage > 90 || memoryUsage > 95 || diskUsage > 95 ? 'unhealthy' : 'healthy';

    return {
      status,
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: {
        cpu: {
          usage: Math.round(cpuUsage * 100) / 100,
          load: [
            Math.random() * 2 + 0.5,
            Math.random() * 2 + 0.8,
            Math.random() * 2 + 1.0,
          ],
        },
        memory: {
          used: Math.floor((8192 * memoryUsage) / 100),
          total: 8192,
          percentage: Math.round(memoryUsage * 100) / 100,
        },
        disk: {
          used: Math.round((100 * diskUsage) / 100 * 100) / 100,
          total: 100.0,
          percentage: Math.round(diskUsage * 100) / 100,
        },
        network: {
          bytesIn: Math.floor(Math.random() * 10000000) + 1000000,
          bytesOut: Math.floor(Math.random() * 20000000) + 2000000,
          connectionsActive: Math.floor(Math.random() * 100) + 10,
        },
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'System resource check failed',
      details: {
        cpu: { usage: 0, load: [0, 0, 0] },
        memory: { used: 0, total: 8192, percentage: 0 },
        disk: { used: 0, total: 100, percentage: 0 },
        network: { bytesIn: 0, bytesOut: 0, connectionsActive: 0 },
      },
    };
  }
}

export async function getOverallSystemStatus(
  database: DatabaseHealth,
  redis: RedisHealth,
  externalServices: ExternalServiceHealth[],
  systemResources: SystemResourcesHealth
): Promise<SystemHealthResponse> {
  const timestamp = new Date().toISOString();
  const responseTime = Date.now() - performance.now();

  // Count service statuses
  const allServices = [database, redis, systemResources, ...externalServices];
  const healthyServices = allServices.filter(s => s.status === 'healthy').length;
  const degradedServices = allServices.filter(s => s.status === 'degraded').length;
  const unhealthyServices = allServices.filter(s => s.status === 'unhealthy').length;

  // Determine overall status
  let overallStatus: SystemHealthResponse['status'];
  if (unhealthyServices > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedServices > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  // Collect issues and warnings
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  allServices.forEach(service => {
    if (service.status === 'unhealthy' && service.error) {
      if ('name' in service) {
        criticalIssues.push(`${service.name} is unavailable`);
      } else if (service === database) {
        criticalIssues.push('Database connection failed');
      } else if (service === redis) {
        criticalIssues.push('Redis health check failed');
      } else if (service === systemResources) {
        criticalIssues.push('System resources critical');
      }
    } else if (service.status === 'degraded') {
      if ('name' in service) {
        warnings.push(`${service.name} response time is elevated`);
      } else if (service === systemResources) {
        const details = service.details;
        if (details.cpu.usage > 80) warnings.push('High CPU usage detected');
        if (details.memory.percentage > 90) warnings.push('High memory usage detected');
        if (details.disk.percentage > 80) warnings.push('High disk usage detected');
      }
    }
  });

  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return {
    status: overallStatus,
    timestamp,
    responseTime: Math.floor(responseTime),
    services: {
      database,
      redis,
      externalServices,
      systemResources,
    },
    summary: {
      totalServices: allServices.length,
      healthyServices,
      degradedServices,
      unhealthyServices,
      criticalIssues,
      warnings,
    },
    uptime,
    version: '1.2.3', // This should come from package.json or env
  };
}