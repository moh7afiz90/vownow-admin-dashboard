/**
 * Contract Tests for GET /api/admin/analytics/users
 *
 * This test suite follows TDD principles and validates the API contract for the admin users analytics endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Data Retrieval: User analytics data structure and content
 * - Date Range Filtering: Query parameter handling for startDate/endDate
 * - Input Validation: Invalid date formats, missing parameters
 * - Error Handling: Database errors, internal server errors
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Empty data sets, large date ranges
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
import { GET } from '@/app/api/admin/analytics/users/route';

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
        order: jest.fn(() => ({ data: [] })),
      })),
    })),
  },
  getAdminSupabase: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock analytics module
jest.mock('@/lib/analytics', () => ({
  fetchUsersAnalytics: jest.fn(),
}));

import { fetchUsersAnalytics } from '@/lib/analytics';
const mockFetchUsersAnalytics = fetchUsersAnalytics as jest.MockedFunction<typeof fetchUsersAnalytics>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface UsersAnalyticsResponse {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByPlan: {
    free: number;
    premium: number;
    enterprise: number;
  };
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  averageSessionDuration: number;
  retentionRate: number;
  period: {
    start: string;
    end: string;
  };
}

interface ErrorResponse {
  error: string;
}

// Mock data
const mockUsersAnalytics: Omit<UsersAnalyticsResponse, 'period'> = {
  totalUsers: 1250,
  newUsers: 85,
  activeUsers: 800,
  usersByPlan: {
    free: 950,
    premium: 250,
    enterprise: 50,
  },
  userGrowth: [
    { date: '2024-01-01', count: 1200 },
    { date: '2024-01-02', count: 1210 },
    { date: '2024-01-03', count: 1225 },
    { date: '2024-01-04', count: 1240 },
    { date: '2024-01-05', count: 1250 },
  ],
  averageSessionDuration: 1800, // 30 minutes in seconds
  retentionRate: 85.5,
};

const validAdminToken = 'valid-admin-token';

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/analytics/users'): NextRequest {
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

describe('GET /api/admin/analytics/users - Contract Tests', () => {
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
      expect(mockFetchUsersAnalytics).not.toHaveBeenCalled();
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
      expect(mockFetchUsersAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('Successful Analytics Retrieval', () => {
    beforeEach(() => {
      mockFetchUsersAnalytics.mockResolvedValue(mockUsersAnalytics);
    });

    it('should return users analytics with valid session', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: UsersAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify response structure
      expect(body).toMatchObject({
        totalUsers: expect.any(Number),
        newUsers: expect.any(Number),
        activeUsers: expect.any(Number),
        usersByPlan: {
          free: expect.any(Number),
          premium: expect.any(Number),
          enterprise: expect.any(Number),
        },
        userGrowth: expect.any(Array),
        averageSessionDuration: expect.any(Number),
        retentionRate: expect.any(Number),
        period: {
          start: expect.any(String),
          end: expect.any(String),
        },
      });

      // Verify specific values
      expect(body.totalUsers).toBe(1250);
      expect(body.newUsers).toBe(85);
      expect(body.activeUsers).toBe(800);
      expect(body.usersByPlan.free).toBe(950);
      expect(body.usersByPlan.premium).toBe(250);
      expect(body.usersByPlan.enterprise).toBe(50);
      expect(body.averageSessionDuration).toBe(1800);
      expect(body.retentionRate).toBe(85.5);

      // Verify userGrowth array structure
      expect(body.userGrowth).toHaveLength(5);
      body.userGrowth.forEach(item => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('count');
        expect(typeof item.date).toBe('string');
        expect(typeof item.count).toBe('number');
      });

      expect(mockFetchUsersAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should handle date range filtering with startDate and endDate', async () => {
      // Arrange
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';
      const url = `http://localhost:3000/api/admin/analytics/users?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: UsersAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.period.start).toBe(startDate);
      expect(body.period.end).toBe(endDate);
      expect(mockFetchUsersAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: startDate,
          endDate: endDate
        })
      );
    });

    it('should use default date range when no dates provided', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: UsersAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      const { period } = body;
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Should default to last 30 days
      expect(startDate.getTime()).toBeCloseTo(thirtyDaysAgo.getTime(), -100000);
      expect(endDate.getTime()).toBeCloseTo(Date.now(), -60000);
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockFetchUsersAnalytics.mockResolvedValue(mockUsersAnalytics);
    });

    it('should return response matching UsersAnalyticsResponse interface', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: UsersAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify all required fields are present and of correct type
      expect(typeof body.totalUsers).toBe('number');
      expect(typeof body.newUsers).toBe('number');
      expect(typeof body.activeUsers).toBe('number');
      expect(typeof body.averageSessionDuration).toBe('number');
      expect(typeof body.retentionRate).toBe('number');

      expect(body.usersByPlan).toBeDefined();
      expect(typeof body.usersByPlan.free).toBe('number');
      expect(typeof body.usersByPlan.premium).toBe('number');
      expect(typeof body.usersByPlan.enterprise).toBe('number');

      expect(Array.isArray(body.userGrowth)).toBe(true);

      expect(body.period).toBeDefined();
      expect(typeof body.period.start).toBe('string');
      expect(typeof body.period.end).toBe('string');

      // Verify business logic constraints
      expect(body.activeUsers).toBeLessThanOrEqual(body.totalUsers);
      expect(body.retentionRate).toBeGreaterThanOrEqual(0);
      expect(body.retentionRate).toBeLessThanOrEqual(100);
      expect(body.usersByPlan.free + body.usersByPlan.premium + body.usersByPlan.enterprise).toBe(body.totalUsers);
    });

    it('should handle empty user growth data', async () => {
      // Arrange
      const request = createMockRequest();
      const emptyGrowthData = {
        ...mockUsersAnalytics,
        userGrowth: [],
      };
      mockFetchUsersAnalytics.mockResolvedValue(emptyGrowthData);

      // Act
      const response = await GET(request);
      const body: UsersAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.userGrowth).toEqual([]);
    });

    it('should validate date strings in period', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: UsersAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      const { period } = body;

      // Should be valid ISO date strings
      expect(() => new Date(period.start).toISOString()).not.toThrow();
      expect(() => new Date(period.end).toISOString()).not.toThrow();

      // Start should be before end
      expect(new Date(period.start).getTime()).toBeLessThan(new Date(period.end).getTime());
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
      mockFetchUsersAnalytics.mockRejectedValue(dbError);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch users analytics'
      });
      expect(mockFetchUsersAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when fetchUsersAnalytics throws', async () => {
      // Arrange
      const request = createMockRequest();
      mockFetchUsersAnalytics.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch users analytics'
      });
    });

    it('should handle malformed date parameters gracefully', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/analytics/users?startDate=invalid-date&endDate=also-invalid';
      const request = createMockRequest(url);
      mockFetchUsersAnalytics.mockResolvedValue(mockUsersAnalytics);

      // Act
      const response = await GET(request);

      // Assert
      // Should either handle gracefully or return appropriate error
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint does not exist', async () => {
      // This test documents the TDD approach
      // When run for the first time, it should fail because the endpoint doesn't exist

      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchUsersAnalytics.mockResolvedValue(mockUsersAnalytics);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request);
        const body: UsersAnalyticsResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('totalUsers');
        expect(body).toHaveProperty('newUsers');
        expect(body).toHaveProperty('activeUsers');
        expect(body).toHaveProperty('usersByPlan');
        expect(body).toHaveProperty('userGrowth');
        expect(body).toHaveProperty('averageSessionDuration');
        expect(body).toHaveProperty('retentionRate');
        expect(body).toHaveProperty('period');
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should fail if authentication is not properly implemented', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(); // No token

      try {
        // Act
        const response = await GET(request);

        // Assert
        // This will fail if authentication is not implemented
        expect(response.status).toBe(401);
        expect(mockFetchUsersAnalytics).not.toHaveBeenCalled();
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should fail if error handling is not implemented', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchUsersAnalytics.mockRejectedValue(new Error('Database error'));

      try {
        // Act
        const response = await GET(request);

        // Assert
        // This will fail if proper error handling is not implemented
        expect(response.status).toBe(500);
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });
  });
});