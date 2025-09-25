import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchUserGrowthData } from '@/lib/analytics';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await fetchUserGrowthData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user growth data' },
      { status: 500 }
    );
  }
}