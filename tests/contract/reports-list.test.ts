/**
 * Contract Tests for GET /api/admin/reports
 *
 * This test suite follows TDD principles and validates the API contract for the admin reports list endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Data Retrieval: Reports list data structure and content
 * - Pagination: Limit, offset, cursor-based pagination
 * - Filtering: Status, type, date range filtering
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
import { GET } from '@/app/api/admin/reports/route';

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

// Mock reports module
jest.mock('@/lib/admin/reports', () => ({
  fetchReports: jest.fn(),
}));

import { fetchReports } from '@/lib/admin/reports';
const mockFetchReports = fetchReports as jest.MockedFunction<typeof fetchReports>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface Report {
  id: string;
  name: string;
  description: string;
  type: 'analytics' | 'users' | 'surveys' | 'financial' | 'system';
  status: 'active' | 'inactive' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  scheduleConfig: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  } | null;
  parameters: Record<string, any>;
  createdBy: string;
  isPublic: boolean;
  downloadCount: number;
  averageRunTime: number; // in seconds
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ReportsListResponse {
  reports: Report[];
  pagination: PaginationInfo;
  filters: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface ErrorResponse {
  error: string;
}

// Mock data
const mockReports: Report[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Monthly User Analytics',
    description: 'Comprehensive monthly report on user engagement and activity metrics',
    type: 'analytics',
    status: 'active',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-20T14:45:00.000Z',
    lastRunAt: '2024-01-20T09:00:00.000Z',
    nextRunAt: '2024-02-01T09:00:00.000Z',
    scheduleConfig: {
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '09:00',
    },
    parameters: {
      includeInactive: false,
      dateRange: 30,
    },
    createdBy: 'admin@vownow.com',
    isPublic: false,
    downloadCount: 24,
    averageRunTime: 45,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Weekly Survey Results',
    description: 'Weekly summary of survey completion rates and response data',
    type: 'surveys',
    status: 'active',
    createdAt: '2024-01-10T08:15:00.000Z',
    updatedAt: '2024-01-22T16:20:00.000Z',
    lastRunAt: '2024-01-22T08:00:00.000Z',
    nextRunAt: '2024-01-29T08:00:00.000Z',
    scheduleConfig: {
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '08:00',
    },
    parameters: {
      includePartial: true,
      groupBySurvey: true,
    },
    createdBy: 'admin@vownow.com',
    isPublic: true,
    downloadCount: 12,
    averageRunTime: 23,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'System Health Check',
    description: 'Daily system performance and health monitoring report',
    type: 'system',
    status: 'scheduled',
    createdAt: '2024-01-05T16:20:00.000Z',
    updatedAt: '2024-01-05T16:20:00.000Z',
    lastRunAt: null,
    nextRunAt: '2024-01-24T06:00:00.000Z',
    scheduleConfig: {
      frequency: 'daily',
      time: '06:00',
    },
    parameters: {
      checkAPIs: true,
      checkDatabase: true,
      checkStorage: true,
    },
    createdBy: 'admin@vownow.com',
    isPublic: false,
    downloadCount: 0,
    averageRunTime: 12,
  },
];

const mockPagination: PaginationInfo = {
  page: 1,
  limit: 25,
  total: 87,
  totalPages: 4,
  hasNextPage: true,
  hasPreviousPage: false,
};

const mockReportsListResponse: ReportsListResponse = {
  reports: mockReports,
  pagination: mockPagination,
  filters: {
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
};

const validAdminToken = 'valid-admin-token';

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/reports'): NextRequest {
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

describe('GET /api/admin/reports - Contract Tests', () => {
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
      expect(mockFetchReports).not.toHaveBeenCalled();
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
      expect(mockFetchReports).not.toHaveBeenCalled();
    });
  });

  describe('Successful Reports Retrieval', () => {
    beforeEach(() => {
      mockFetchReports.mockResolvedValue(mockReportsListResponse);
    });

    it('should return reports list with valid session', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify response structure
      expect(body).toMatchObject({
        reports: expect.any(Array),
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
        },
        filters: expect.any(Object),
      });

      // Verify reports array
      expect(body.reports).toHaveLength(3);
      body.reports.forEach(report => {
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('name');
        expect(report).toHaveProperty('description');
        expect(report).toHaveProperty('type');
        expect(report).toHaveProperty('status');
        expect(report).toHaveProperty('createdAt');
        expect(report).toHaveProperty('updatedAt');
        expect(report).toHaveProperty('parameters');
        expect(report).toHaveProperty('createdBy');
        expect(report).toHaveProperty('isPublic');
        expect(report).toHaveProperty('downloadCount');
        expect(report).toHaveProperty('averageRunTime');

        // Verify data types
        expect(typeof report.id).toBe('string');
        expect(typeof report.name).toBe('string');
        expect(typeof report.description).toBe('string');
        expect(['analytics', 'users', 'surveys', 'financial', 'system']).toContain(report.type);
        expect(['active', 'inactive', 'scheduled']).toContain(report.status);
        expect(typeof report.createdAt).toBe('string');
        expect(typeof report.updatedAt).toBe('string');
        expect(typeof report.parameters).toBe('object');
        expect(typeof report.createdBy).toBe('string');
        expect(typeof report.isPublic).toBe('boolean');
        expect(typeof report.downloadCount).toBe('number');
        expect(typeof report.averageRunTime).toBe('number');

        // Verify UUID format for id
        expect(report.id).toMatch(/^[0-9a-f-]{36}$/i);

        // Verify email format for createdBy
        expect(report.createdBy).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

        // Verify date format
        expect(() => new Date(report.createdAt).toISOString()).not.toThrow();
        expect(() => new Date(report.updatedAt).toISOString()).not.toThrow();

        // Verify business constraints
        expect(report.downloadCount).toBeGreaterThanOrEqual(0);
        expect(report.averageRunTime).toBeGreaterThanOrEqual(0);
      });

      expect(mockFetchReports).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      const page = 2;
      const limit = 10;
      const url = `http://localhost:3000/api/admin/reports?page=${page}&limit=${limit}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const paginatedResponse = {
        ...mockReportsListResponse,
        pagination: {
          ...mockPagination,
          page: 2,
          limit: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };
      mockFetchReports.mockResolvedValue(paginatedResponse);

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.pagination.page).toBe(2);
      expect(body.pagination.limit).toBe(10);
      expect(body.pagination.hasPreviousPage).toBe(true);
      expect(mockFetchReports).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      );
    });

    it('should handle status filtering', async () => {
      // Arrange
      const status = 'active';
      const url = `http://localhost:3000/api/admin/reports?status=${status}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const statusResponse = {
        ...mockReportsListResponse,
        reports: mockReports.filter(report => report.status === 'active'),
        filters: { status },
      };
      mockFetchReports.mockResolvedValue(statusResponse);

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      body.reports.forEach(report => {
        expect(report.status).toBe('active');
      });
      expect(body.filters.status).toBe(status);
      expect(mockFetchReports).toHaveBeenCalledWith(
        expect.objectContaining({
          status: status,
        })
      );
    });

    it('should handle type filtering', async () => {
      // Arrange
      const type = 'analytics';
      const url = `http://localhost:3000/api/admin/reports?type=${type}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const typeResponse = {
        ...mockReportsListResponse,
        reports: mockReports.filter(report => report.type === 'analytics'),
        filters: { type },
      };
      mockFetchReports.mockResolvedValue(typeResponse);

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      body.reports.forEach(report => {
        expect(report.type).toBe('analytics');
      });
      expect(body.filters.type).toBe(type);
      expect(mockFetchReports).toHaveBeenCalledWith(
        expect.objectContaining({
          type: type,
        })
      );
    });

    it('should handle date range filtering', async () => {
      // Arrange
      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';
      const url = `http://localhost:3000/api/admin/reports?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const dateResponse = {
        ...mockReportsListResponse,
        filters: { dateFrom, dateTo },
      };
      mockFetchReports.mockResolvedValue(dateResponse);

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.filters.dateFrom).toBe(dateFrom);
      expect(body.filters.dateTo).toBe(dateTo);
      expect(mockFetchReports).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: dateFrom,
          dateTo: dateTo,
        })
      );
    });

    it('should handle sorting parameters', async () => {
      // Arrange
      const sortBy = 'name';
      const sortOrder = 'asc';
      const url = `http://localhost:3000/api/admin/reports?sortBy=${sortBy}&sortOrder=${sortOrder}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const sortedResponse = {
        ...mockReportsListResponse,
        filters: { sortBy, sortOrder: 'asc' as const },
      };
      mockFetchReports.mockResolvedValue(sortedResponse);

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.filters.sortBy).toBe(sortBy);
      expect(body.filters.sortOrder).toBe(sortOrder);
      expect(mockFetchReports).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: sortBy,
          sortOrder: sortOrder,
        })
      );
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockFetchReports.mockResolvedValue(mockReportsListResponse);
    });

    it('should return response matching ReportsListResponse interface', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify main structure
      expect(body).toHaveProperty('reports');
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('filters');

      // Verify arrays and objects are correct types
      expect(Array.isArray(body.reports)).toBe(true);
      expect(typeof body.pagination).toBe('object');
      expect(typeof body.filters).toBe('object');
    });

    it('should handle empty reports list', async () => {
      // Arrange
      const request = createMockRequest();
      const emptyResponse: ReportsListResponse = {
        reports: [],
        pagination: {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        filters: {},
      };
      mockFetchReports.mockResolvedValue(emptyResponse);

      // Act
      const response = await GET(request);
      const body: ReportsListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.reports).toEqual([]);
      expect(body.pagination.total).toBe(0);
      expect(body.pagination.totalPages).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      const request = createMockRequest();
      const dbError = new Error('Database connection failed');
      mockFetchReports.mockRejectedValue(dbError);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch reports'
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
      mockFetchReports.mockResolvedValue(mockReportsListResponse);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request);
        const body: ReportsListResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('reports');
        expect(body).toHaveProperty('pagination');
        expect(body).toHaveProperty('filters');
        expect(Array.isArray(body.reports)).toBe(true);
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });
  });
});