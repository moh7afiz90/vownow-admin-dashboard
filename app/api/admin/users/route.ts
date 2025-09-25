import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        created_at,
        updated_at,
        last_seen_at
      `, { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (status !== 'all') {
      if (status === 'admin') {
        query = query.eq('role', 'admin');
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const { data: questionnaires } = await supabase
      .from('questionnaire_responses')
      .select('user_id')
      .eq('completed', true);

    const questionnaireCounts = questionnaires?.reduce((acc: Record<string, number>, q) => {
      acc[q.user_id] = (acc[q.user_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const formattedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role || 'user',
      status: user.status || 'active',
      signedUp: user.created_at,
      lastActive: user.last_seen_at || user.updated_at,
      questionnairesCompleted: questionnaireCounts[user.id] || 0,
    })) || [];

    return NextResponse.json({
      users: formattedUsers,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}