import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runReport } from '@/lib/admin/reports';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = context.params.id;

    // Validate report ID
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    if (!isValidUUID(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }

    const result = await runReport(reportId);

    if (!result.success) {
      if (result.error === 'Report not found') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Report execution started',
      reportId,
      executionTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running report:', error);
    return NextResponse.json(
      { error: 'Failed to run report' },
      { status: 500 }
    );
  }
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}