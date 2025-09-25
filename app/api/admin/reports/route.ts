import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchReports, createReport, validateReportConfig } from '@/lib/admin/reports';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined;

    const filters = {
      page,
      limit,
      status,
      type,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    };

    const result = await fetchReports(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!body.description || body.description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!body.type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    // Validate report type
    const validTypes = ['analytics', 'users', 'surveys', 'financial', 'system'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Validate name length
    if (body.name.length > 255) {
      return NextResponse.json(
        { error: 'Name is too long (maximum 255 characters)' },
        { status: 400 }
      );
    }

    // Validate parameters
    if (body.parameters !== undefined && typeof body.parameters !== 'object') {
      return NextResponse.json(
        { error: 'Parameters must be a valid object' },
        { status: 400 }
      );
    }

    // Validate schedule configuration if provided
    if (body.scheduleConfig) {
      const validation = await validateReportConfig(body.scheduleConfig);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: 'Invalid schedule configuration',
            details: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    // Create the report
    const createdBy = 'admin@vownow.com'; // TODO: Get from authenticated user
    const result = await createReport(body, createdBy);

    if (result.error) {
      if (result.error === 'Report with this name already exists') {
        return NextResponse.json({ error: result.error }, { status: 409 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, report: result.report }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}