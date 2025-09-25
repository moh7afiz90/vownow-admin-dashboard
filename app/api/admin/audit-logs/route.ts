import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAuditLogs, validateAuditLogFilters } from '@/lib/admin/audit-logs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const user = searchParams.get('user') || undefined;
    const admin = searchParams.get('admin') || undefined;
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const outcome = searchParams.get('outcome') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined;

    const filters = {
      page,
      limit,
      user,
      admin,
      action,
      resource,
      outcome,
      severity,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    };

    // Validate filters
    const validation = await validateAuditLogFilters(filters);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors?.[0] || 'Invalid filter parameters' },
        { status: 400 }
      );
    }

    const result = await fetchAuditLogs(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}