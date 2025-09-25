import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  checkDatabaseHealth,
  checkRedisHealth,
  checkExternalServicesHealth,
  checkSystemResourcesHealth,
  getOverallSystemStatus,
} from '@/lib/admin/health';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform health checks in parallel
    const [database, redis, externalServices, systemResources] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkExternalServicesHealth(),
      checkSystemResourcesHealth(),
    ]);

    // Handle any health check failures gracefully
    const databaseHealth = database.status === 'fulfilled'
      ? database.value
      : {
          status: 'unhealthy' as const,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: 'Health check failed',
          details: {
            connectionPool: { active: 0, idle: 0, max: 20 },
            queryPerformance: { averageResponseTime: 0, slowQueries: 0 },
          },
        };

    const redisHealth = redis.status === 'fulfilled'
      ? redis.value
      : {
          status: 'unhealthy' as const,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: 'Health check failed',
          details: {
            memory: { used: 0, max: 512, fragmentation: 0 },
            operations: { commandsPerSecond: 0, hitRate: 0 },
            keyspaces: {},
          },
        };

    const externalServicesHealth = externalServices.status === 'fulfilled'
      ? externalServices.value
      : [];

    const systemResourcesHealth = systemResources.status === 'fulfilled'
      ? systemResources.value
      : {
          status: 'unhealthy' as const,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: 'Health check failed',
          details: {
            cpu: { usage: 0, load: [0, 0, 0] },
            memory: { used: 0, total: 8192, percentage: 0 },
            disk: { used: 0, total: 100, percentage: 0 },
            network: { bytesIn: 0, bytesOut: 0, connectionsActive: 0 },
          },
        };

    // Get overall system status
    const systemStatus = await getOverallSystemStatus(
      databaseHealth,
      redisHealth,
      externalServicesHealth,
      systemResourcesHealth
    );

    // Return appropriate HTTP status based on system health
    const httpStatus = systemStatus.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(systemStatus, { status: httpStatus });
  } catch (error) {
    console.error('Error performing health check:', error);
    return NextResponse.json(
      { error: 'Failed to perform health check' },
      { status: 500 }
    );
  }
}