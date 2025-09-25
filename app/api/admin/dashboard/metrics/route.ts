import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchDashboardStats } from '@/lib/analytics';
import { DashboardStats } from '@/lib/analytics';

export interface MetricsQuery {
  startDate?: string;
  endDate?: string;
}

export interface MetricsResponse extends DashboardStats {
  period: {
    start: string;
    end: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // For now, we'll use the existing fetchDashboardStats function
    // In a real implementation, you'd modify it to accept date range parameters
    const stats = await fetchDashboardStats();

    const response: MetricsResponse = {
      ...stats,
      period: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}