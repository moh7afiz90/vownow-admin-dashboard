import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchUserById } from '@/lib/admin/users';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = context.params.id;

    // Validate user ID
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const user = await fetchUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}