import { NextResponse } from 'next/server';
import { signOutAdmin } from '@/lib/admin/auth';

export async function POST() {
  try {
    await signOutAdmin();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}