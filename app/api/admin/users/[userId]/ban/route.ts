import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'banned', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error banning user:', error);
      return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
    }

    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'user_banned',
        metadata: { banned_by: 'admin' },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in ban user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error unbanning user:', error);
      return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
    }

    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'user_unbanned',
        metadata: { unbanned_by: 'admin' },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in unban user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}