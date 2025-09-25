import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exportReport } from '@/lib/admin/reports';

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

    // Get format from query parameters or body
    const { searchParams } = new URL(request.url);
    let format = searchParams.get('format');

    if (!format) {
      try {
        const body = await request.json();
        format = body.format;
      } catch {
        // If no body, default format
        format = 'csv';
      }
    }

    // Validate format
    const validFormats = ['csv', 'pdf', 'excel'];
    if (!format || !validFormats.includes(format)) {
      return NextResponse.json(
        {
          error: 'Invalid format. Must be one of: csv, pdf, excel'
        },
        { status: 400 }
      );
    }

    const result = await exportReport(reportId, format as 'csv' | 'pdf' | 'excel');

    if (!result.success) {
      if (result.error === 'Report not found') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      downloadUrl: result.url,
      format,
      reportId,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}