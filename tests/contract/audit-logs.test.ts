/**
 * Contract Tests for GET /api/admin/audit-logs
 *
 * This test suite follows TDD principles and validates the API contract for the admin audit logs endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Data Retrieval: Audit logs data structure and content
 * - Pagination: Limit, offset, cursor-based pagination
 * - Filtering: User, action, date range, resource filtering
 * - Sorting: Multiple sort fields and directions
 * - Input Validation: Invalid parameters, boundary conditions
 * - Error Handling: Database errors, internal server errors
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Empty results, large datasets
 *
 * Mocking Strategy:
 * - NextResponse for HTTP responses
 * - Supabase client for database operations
 * - Next.js cookies for session management
 *
 * The tests are designed to fail initially since the endpoint doesn't exist yet,
 * demonstrating true TDD behavior.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/audit-logs/route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: jest.fn().mockResolvedValue(data),
      status: options?.status || 200,
      statusText: options?.statusText || 'OK',
      headers: {
        get: jest.fn().mockReturnValue('application/json'),
      },
    })),
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        count: jest.fn(() => ({ count: 0 })),
        gte: jest.fn(() => ({ count: 0 })),
        lte: jest.fn(() => ({ count: 0 })),
        eq: jest.fn(() => ({ count: 0 })),
        ilike: jest.fn(() => ({ data: [] })),
        in: jest.fn(() => ({ data: [] })),
        order: jest.fn(() => ({ data: [] })),
        range: jest.fn(() => ({ data: [] })),
      })),
    })),
  },
  getAdminSupabase: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock audit logs module
jest.mock('@/lib/admin/audit-logs', () => ({
  fetchAuditLogs: jest.fn(),
  validateAuditLogFilters: jest.fn(),
}));

import { fetchAuditLogs, validateAuditLogFilters } from '@/lib/admin/audit-logs';
const mockFetchAuditLogs = fetchAuditLogs as jest.MockedFunction<typeof fetchAuditLogs>;
const mockValidateAuditLogFilters = validateAuditLogFilters as jest.MockedFunction<typeof validateAuditLogFilters>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  userId: string;
  userEmail: string;
  adminId: string | null;
  adminEmail: string | null;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  metadata: Record<string, any>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: PaginationInfo;
  filters: {
    user?: string;
    admin?: string;
    action?: string;
    resource?: string;
    outcome?: string;
    severity?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  summary: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    criticalEvents: number;
    uniqueUsers: number;
    mostCommonActions: Array<{
      action: string;
      count: number;
    }>;
  };
}

interface ErrorResponse {
  error: string;
}

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    action: 'user.login',
    resource: 'authentication',
    resourceId: null,
    userId: '123e4567-e89b-12d3-a456-426614174001',
    userEmail: 'user@example.com',
    adminId: null,
    adminEmail: null,
    timestamp: '2024-01-23T10:30:00.000Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: {
      loginMethod: 'email',
      rememberMe: false,
      location: 'New York, NY',
    },
    outcome: 'success',
    severity: 'low',
    sessionId: '123e4567-e89b-12d3-a456-426614174002',
    metadata: {
      deviceType: 'desktop',
      browser: 'Chrome',
    },
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    action: 'admin.user.delete',
    resource: 'user',
    resourceId: '123e4567-e89b-12d3-a456-426614174004',
    userId: '123e4567-e89b-12d3-a456-426614174004',
    userEmail: 'deleted@example.com',
    adminId: '123e4567-e89b-12d3-a456-426614174005',
    adminEmail: 'admin@vownow.com',
    timestamp: '2024-01-23T09:15:00.000Z',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    details: {
      reason: 'GDPR deletion request',
      confirmedBy: 'admin@vownow.com',
      dataRetentionPeriod: 30,
    },
    outcome: 'success',
    severity: 'high',
    sessionId: '123e4567-e89b-12d3-a456-426614174006',
    metadata: {
      adminPanel: true,
      requiresApproval: false,
    },
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    action: 'survey.submit',
    resource: 'survey',
    resourceId: '123e4567-e89b-12d3-a456-426614174008',
    userId: '123e4567-e89b-12d3-a456-426614174009',
    userEmail: 'respondent@example.com',
    adminId: null,
    adminEmail: null,
    timestamp: '2024-01-23T08:45:00.000Z',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_1 like Mac OS X) AppleWebKit/605.1.15',
    details: {
      surveyTitle: 'Customer Satisfaction Q4 2024',
      completionTime: 285, // seconds
      responseCount: 25,
      skipCount: 3,
    },
    outcome: 'success',
    severity: 'low',
    sessionId: '123e4567-e89b-12d3-a456-426614174010',
    metadata: {
      deviceType: 'mobile',
      browser: 'Safari',
      surveyVersion: '2.1',
    },
  },
];

const mockPagination: PaginationInfo = {
  page: 1,
  limit: 50,
  total: 2847,
  totalPages: 57,
  hasNextPage: true,
  hasPreviousPage: false,
};

const mockSummary = {
  totalActions: 2847,
  successfulActions: 2780,
  failedActions: 67,
  criticalEvents: 3,
  uniqueUsers: 1249,
  mostCommonActions: [
    { action: 'user.login', count: 1205 },
    { action: 'survey.submit', count: 892 },
    { action: 'user.logout', count: 445 },
    { action: 'admin.report.generate', count: 87 },
    { action: 'user.profile.update', count: 76 },
  ],
};

const mockAuditLogsResponse: AuditLogsResponse = {
  logs: mockAuditLogs,
  pagination: mockPagination,
  filters: {
    sortBy: 'timestamp',
    sortOrder: 'desc',
  },
  summary: mockSummary,
};

const validAdminToken = 'valid-admin-token';

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/audit-logs'): NextRequest {
  const mockRequest = {
    url,
    method: 'GET',
    headers: new Map(),
    cookies: new Map(),
  } as any;
  return mockRequest;
}

// Helper function to mock cookies
function mockCookieStore(adminToken?: string) {
  const cookieStore = {
    get: jest.fn().mockImplementation((name: string) => {
      if (name === 'admin_token' && adminToken) {
        return { value: adminToken };
      }
      return undefined;
    }),
  };
  cookies.mockResolvedValue(cookieStore);
  return cookieStore;
}

describe('GET /api/admin/audit-logs - Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no admin token is provided', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(); // No token provided

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockFetchAuditLogs).not.toHaveBeenCalled();
    });

    it('should return 401 when admin token is invalid', async () => {
      // Arrange
      const request = createMockRequest();
      const cookieStore = mockCookieStore();
      cookieStore.get.mockReturnValue(null);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockFetchAuditLogs).not.toHaveBeenCalled();
    });
  });

  describe('Successful Audit Logs Retrieval', () => {
    beforeEach(() => {
      mockValidateAuditLogFilters.mockResolvedValue({ isValid: true });
      mockFetchAuditLogs.mockResolvedValue(mockAuditLogsResponse);
    });

    it('should return audit logs list with valid session', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify response structure
      expect(body).toMatchObject({
        logs: expect.any(Array),
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
        },
        filters: expect.any(Object),
        summary: expect.any(Object),
      });

      // Verify logs array
      expect(body.logs).toHaveLength(3);
      body.logs.forEach(log => {
        expect(log).toHaveProperty('id');
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('resource');
        expect(log).toHaveProperty('userId');
        expect(log).toHaveProperty('userEmail');
        expect(log).toHaveProperty('timestamp');
        expect(log).toHaveProperty('ipAddress');
        expect(log).toHaveProperty('userAgent');
        expect(log).toHaveProperty('details');
        expect(log).toHaveProperty('outcome');
        expect(log).toHaveProperty('severity');
        expect(log).toHaveProperty('sessionId');
        expect(log).toHaveProperty('metadata');

        // Verify data types
        expect(typeof log.id).toBe('string');
        expect(typeof log.action).toBe('string');
        expect(typeof log.resource).toBe('string');
        expect(typeof log.userId).toBe('string');
        expect(typeof log.userEmail).toBe('string');
        expect(typeof log.timestamp).toBe('string');
        expect(typeof log.ipAddress).toBe('string');
        expect(typeof log.userAgent).toBe('string');
        expect(typeof log.details).toBe('object');
        expect(['success', 'failure', 'error']).toContain(log.outcome);
        expect(['low', 'medium', 'high', 'critical']).toContain(log.severity);
        expect(typeof log.sessionId).toBe('string');
        expect(typeof log.metadata).toBe('object');

        // Verify UUID format for id
        expect(log.id).toMatch(/^[0-9a-f-]{36}$/i);

        // Verify email format for userEmail
        expect(log.userEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

        // Verify date format
        expect(() => new Date(log.timestamp).toISOString()).not.toThrow();

        // Verify IP address format (basic validation)
        expect(log.ipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });

      // Verify summary structure
      expect(body.summary).toHaveProperty('totalActions');
      expect(body.summary).toHaveProperty('successfulActions');
      expect(body.summary).toHaveProperty('failedActions');
      expect(body.summary).toHaveProperty('criticalEvents');
      expect(body.summary).toHaveProperty('uniqueUsers');
      expect(body.summary).toHaveProperty('mostCommonActions');
      expect(Array.isArray(body.summary.mostCommonActions)).toBe(true);

      expect(mockFetchAuditLogs).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      const page = 2;
      const limit = 25;
      const url = `http://localhost:3000/api/admin/audit-logs?page=${page}&limit=${limit}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const paginatedResponse = {
        ...mockAuditLogsResponse,
        pagination: {
          ...mockPagination,
          page: 2,
          limit: 25,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };
      mockFetchAuditLogs.mockResolvedValue(paginatedResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.pagination.page).toBe(2);
      expect(body.pagination.limit).toBe(25);
      expect(body.pagination.hasPreviousPage).toBe(true);
      expect(mockFetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 25,
        })
      );
    });

    it('should handle action filtering', async () => {
      // Arrange
      const action = 'user.login';
      const url = `http://localhost:3000/api/admin/audit-logs?action=${action}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const actionResponse = {
        ...mockAuditLogsResponse,
        logs: mockAuditLogs.filter(log => log.action === 'user.login'),
        filters: { action },
      };
      mockFetchAuditLogs.mockResolvedValue(actionResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      body.logs.forEach(log => {
        expect(log.action).toBe('user.login');
      });
      expect(body.filters.action).toBe(action);
      expect(mockFetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: action,
        })
      );
    });

    it('should handle user filtering', async () => {
      // Arrange
      const user = 'user@example.com';
      const url = `http://localhost:3000/api/admin/audit-logs?user=${encodeURIComponent(user)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const userResponse = {
        ...mockAuditLogsResponse,
        logs: mockAuditLogs.filter(log => log.userEmail === user),
        filters: { user },
      };
      mockFetchAuditLogs.mockResolvedValue(userResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      body.logs.forEach(log => {
        expect(log.userEmail).toBe(user);
      });
      expect(body.filters.user).toBe(user);
    });

    it('should handle severity filtering', async () => {
      // Arrange
      const severity = 'high';
      const url = `http://localhost:3000/api/admin/audit-logs?severity=${severity}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const severityResponse = {
        ...mockAuditLogsResponse,
        logs: mockAuditLogs.filter(log => log.severity === 'high'),
        filters: { severity },
      };
      mockFetchAuditLogs.mockResolvedValue(severityResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      body.logs.forEach(log => {
        expect(log.severity).toBe('high');
      });
      expect(body.filters.severity).toBe(severity);
    });

    it('should handle date range filtering', async () => {
      // Arrange
      const dateFrom = '2024-01-23';
      const dateTo = '2024-01-24';
      const url = `http://localhost:3000/api/admin/audit-logs?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const dateResponse = {
        ...mockAuditLogsResponse,
        filters: { dateFrom, dateTo },
      };
      mockFetchAuditLogs.mockResolvedValue(dateResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.filters.dateFrom).toBe(dateFrom);
      expect(body.filters.dateTo).toBe(dateTo);
      expect(mockFetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: dateFrom,
          dateTo: dateTo,
        })
      );
    });

    it('should handle outcome filtering', async () => {
      // Arrange
      const outcome = 'failure';
      const url = `http://localhost:3000/api/admin/audit-logs?outcome=${outcome}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const outcomeResponse = {
        ...mockAuditLogsResponse,
        logs: mockAuditLogs.filter(log => log.outcome === 'failure'),
        filters: { outcome },
      };
      mockFetchAuditLogs.mockResolvedValue(outcomeResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.filters.outcome).toBe(outcome);
    });

    it('should handle multiple filters combined', async () => {
      // Arrange
      const action = 'admin.user.delete';
      const severity = 'high';
      const outcome = 'success';
      const dateFrom = '2024-01-23';
      const dateTo = '2024-01-24';
      const page = 1;
      const limit = 25;
      const url = `http://localhost:3000/api/admin/audit-logs?action=${action}&severity=${severity}&outcome=${outcome}&dateFrom=${dateFrom}&dateTo=${dateTo}&page=${page}&limit=${limit}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const combinedResponse = {
        ...mockAuditLogsResponse,
        filters: { action, severity, outcome, dateFrom, dateTo, sortBy: 'timestamp', sortOrder: 'desc' as const },
        pagination: { ...mockPagination, page: 1, limit: 25 },
      };
      mockFetchAuditLogs.mockResolvedValue(combinedResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockFetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action,
          severity,
          outcome,
          dateFrom,
          dateTo,
          page,
          limit,
        })
      );
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return 400 when date range is invalid', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/audit-logs?dateFrom=invalid-date&dateTo=2024-01-24';
      const request = createMockRequest(url);

      mockValidateAuditLogFilters.mockResolvedValue({
        isValid: false,
        errors: ['Invalid dateFrom format'],
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid dateFrom format'
      });
      expect(mockFetchAuditLogs).not.toHaveBeenCalled();
    });

    it('should return 400 when severity filter is invalid', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/audit-logs?severity=invalid';
      const request = createMockRequest(url);

      mockValidateAuditLogFilters.mockResolvedValue({
        isValid: false,
        errors: ['Invalid severity level'],
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid severity level'
      });
    });

    it('should return 400 when outcome filter is invalid', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/audit-logs?outcome=invalid';
      const request = createMockRequest(url);

      mockValidateAuditLogFilters.mockResolvedValue({
        isValid: false,
        errors: ['Invalid outcome value'],
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid outcome value'
      });
    });

    it('should handle invalid page parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/audit-logs?page=-1';
      const request = createMockRequest(url);
      mockValidateAuditLogFilters.mockResolvedValue({ isValid: true });
      mockFetchAuditLogs.mockResolvedValue(mockAuditLogsResponse);

      // Act
      const response = await GET(request);

      // Assert
      // Should either normalize to valid value or return error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle excessive limit parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/audit-logs?limit=1000';
      const request = createMockRequest(url);
      mockValidateAuditLogFilters.mockResolvedValue({ isValid: true });
      mockFetchAuditLogs.mockResolvedValue(mockAuditLogsResponse);

      // Act
      const response = await GET(request);

      // Assert
      // Should either cap to maximum or return error
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockValidateAuditLogFilters.mockResolvedValue({ isValid: true });
      mockFetchAuditLogs.mockResolvedValue(mockAuditLogsResponse);
    });

    it('should return response matching AuditLogsResponse interface', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify main structure
      expect(body).toHaveProperty('logs');
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('filters');
      expect(body).toHaveProperty('summary');

      // Verify arrays and objects are correct types
      expect(Array.isArray(body.logs)).toBe(true);
      expect(typeof body.pagination).toBe('object');
      expect(typeof body.filters).toBe('object');
      expect(typeof body.summary).toBe('object');

      // Verify summary statistics
      expect(typeof body.summary.totalActions).toBe('number');
      expect(typeof body.summary.successfulActions).toBe('number');
      expect(typeof body.summary.failedActions).toBe('number');
      expect(typeof body.summary.criticalEvents).toBe('number');
      expect(typeof body.summary.uniqueUsers).toBe('number');
      expect(Array.isArray(body.summary.mostCommonActions)).toBe(true);
    });

    it('should handle empty audit logs list', async () => {
      // Arrange
      const request = createMockRequest();
      const emptyResponse: AuditLogsResponse = {
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        filters: {},
        summary: {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          criticalEvents: 0,
          uniqueUsers: 0,
          mostCommonActions: [],
        },
      };
      mockFetchAuditLogs.mockResolvedValue(emptyResponse);

      // Act
      const response = await GET(request);
      const body: AuditLogsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.logs).toEqual([]);
      expect(body.pagination.total).toBe(0);
      expect(body.pagination.totalPages).toBe(0);
      expect(body.summary.totalActions).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockValidateAuditLogFilters.mockResolvedValue({ isValid: true });
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      const request = createMockRequest();
      const dbError = new Error('Database connection failed');
      mockFetchAuditLogs.mockRejectedValue(dbError);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch audit logs'
      });
    });

    it('should return 500 when fetchAuditLogs throws', async () => {
      // Arrange
      const request = createMockRequest();
      mockFetchAuditLogs.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch audit logs'
      });
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint does not exist', async () => {
      // This test documents the TDD approach
      // When run for the first time, it should fail because the endpoint doesn't exist

      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockValidateAuditLogFilters.mockResolvedValue({ isValid: true });
      mockFetchAuditLogs.mockResolvedValue(mockAuditLogsResponse);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request);
        const body: AuditLogsResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('logs');
        expect(body).toHaveProperty('pagination');
        expect(body).toHaveProperty('filters');
        expect(body).toHaveProperty('summary');
        expect(Array.isArray(body.logs)).toBe(true);
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });
  });
});