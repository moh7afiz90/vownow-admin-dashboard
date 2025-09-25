import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchUsersAnalytics } from '@/lib/analytics';

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

    const filters: { startDate?: string; endDate?: string } = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const analytics = await fetchUsersAnalytics(filters);

    // Add period information
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const response = {
      ...analytics,
      period: {
        start: startDate || thirtyDaysAgo.toISOString(),
        end: endDate || now.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users analytics' },
      { status: 500 }
    );
  }
}