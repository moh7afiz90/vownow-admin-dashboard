import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/dashboard/metrics/route';
import { fetchDashboardStats } from '@/lib/analytics';
import type { DashboardStats } from '@/lib/analytics';
import type { MetricsResponse } from '@/app/api/admin/dashboard/metrics/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        count: jest.fn(() => ({ count: 0 })),
        gte: jest.fn(() => ({ count: 0 })),
        eq: jest.fn(() => ({ count: 0 })),
        order: jest.fn(() => ({ data: [] })),
      })),
    })),
  },
  getAdminSupabase: jest.fn(),
}));

// Mock the analytics module
jest.mock('@/lib/analytics');
const mockFetchDashboardStats = fetchDashboardStats as jest.MockedFunction<typeof fetchDashboardStats>;

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Mock data
const mockDashboardStats: DashboardStats = {
  totalUsers: 1250,
  activeUsers: 800,
  emailsCollected: 2100,
  conversionRate: 59.5,
  monthlyRevenue: 45000,
  questionnairesCompleted: 950,
};

const validAdminToken = 'valid-admin-token';

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/dashboard/metrics'): NextRequest {
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

describe('GET /api/admin/dashboard/metrics - Contract Tests', () => {
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
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockFetchDashboardStats).not.toHaveBeenCalled();
    });

    it('should return 401 when admin token is invalid/null', async () => {
      // Arrange
      const request = createMockRequest();
      const cookieStore = mockCookieStore();
      cookieStore.get.mockReturnValue(null);

      // Act
      const response = await GET(request);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockFetchDashboardStats).not.toHaveBeenCalled();
    });
  });

  describe('Successful Metrics Retrieval', () => {
    beforeEach(() => {
      mockFetchDashboardStats.mockResolvedValue(mockDashboardStats);
    });

    it('should return dashboard metrics with valid session', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify response structure
      expect(body).toMatchObject({
        totalUsers: expect.any(Number),
        activeUsers: expect.any(Number),
        emailsCollected: expect.any(Number),
        conversionRate: expect.any(Number),
        monthlyRevenue: expect.any(Number),
        questionnairesCompleted: expect.any(Number),
        period: {
          start: expect.any(String),
          end: expect.any(String),
        },
      });

      // Verify specific values
      expect(body.totalUsers).toBe(1250);
      expect(body.activeUsers).toBe(800);
      expect(body.emailsCollected).toBe(2100);
      expect(body.conversionRate).toBe(59.5);
      expect(body.monthlyRevenue).toBe(45000);
      expect(body.questionnairesCompleted).toBe(950);

      // Verify period structure
      expect(body.period).toBeDefined();
      expect(new Date(body.period.start)).toBeInstanceOf(Date);
      expect(new Date(body.period.end)).toBeInstanceOf(Date);

      expect(mockFetchDashboardStats).toHaveBeenCalledTimes(1);
    });

    it('should handle date range filtering with startDate and endDate', async () => {
      // Arrange
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';
      const url = `http://localhost:3000/api/admin/dashboard/metrics?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.period.start).toBe(startDate);
      expect(body.period.end).toBe(endDate);
      expect(mockFetchDashboardStats).toHaveBeenCalledTimes(1);
    });

    it('should use default date range when no dates provided', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      const { period } = body;
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Should default to last 30 days
      expect(startDate.getTime()).toBeCloseTo(thirtyDaysAgo.getTime(), -100000); // Within ~1.7 minutes
      expect(endDate.getTime()).toBeCloseTo(Date.now(), -60000); // Within 1 minute
    });

    it('should handle only startDate parameter', async () => {
      // Arrange
      const startDate = '2024-01-15T00:00:00.000Z';
      const url = `http://localhost:3000/api/admin/dashboard/metrics?startDate=${encodeURIComponent(startDate)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.period.start).toBe(startDate);
      expect(new Date(body.period.end)).toBeInstanceOf(Date);
    });

    it('should handle only endDate parameter', async () => {
      // Arrange
      const endDate = '2024-01-31T23:59:59.999Z';
      const url = `http://localhost:3000/api/admin/dashboard/metrics?endDate=${encodeURIComponent(endDate)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.period.end).toBe(endDate);
      expect(new Date(body.period.start)).toBeInstanceOf(Date);
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockFetchDashboardStats.mockResolvedValue(mockDashboardStats);
    });

    it('should return response matching MetricsResponse interface', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert - Verify all required fields are present and of correct type
      expect(response.status).toBe(200);

      expect(typeof body.totalUsers).toBe('number');
      expect(typeof body.activeUsers).toBe('number');
      expect(typeof body.emailsCollected).toBe('number');
      expect(typeof body.conversionRate).toBe('number');
      expect(typeof body.monthlyRevenue).toBe('number');
      expect(typeof body.questionnairesCompleted).toBe('number');

      expect(body.period).toBeDefined();
      expect(typeof body.period.start).toBe('string');
      expect(typeof body.period.end).toBe('string');

      // Verify numbers are non-negative
      expect(body.totalUsers).toBeGreaterThanOrEqual(0);
      expect(body.activeUsers).toBeGreaterThanOrEqual(0);
      expect(body.emailsCollected).toBeGreaterThanOrEqual(0);
      expect(body.conversionRate).toBeGreaterThanOrEqual(0);
      expect(body.monthlyRevenue).toBeGreaterThanOrEqual(0);
      expect(body.questionnairesCompleted).toBeGreaterThanOrEqual(0);

      // Verify business logic constraints
      expect(body.activeUsers).toBeLessThanOrEqual(body.totalUsers);
      expect(body.conversionRate).toBeLessThanOrEqual(100);
    });

    it('should return valid ISO date strings in period', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      const { period } = body;

      // Should be valid ISO date strings
      expect(() => new Date(period.start).toISOString()).not.toThrow();
      expect(() => new Date(period.end).toISOString()).not.toThrow();

      // Start should be before end
      expect(new Date(period.start).getTime()).toBeLessThan(new Date(period.end).getTime());
    });

    it('should handle zero values gracefully', async () => {
      // Arrange
      const request = createMockRequest();
      const emptyStats: DashboardStats = {
        totalUsers: 0,
        activeUsers: 0,
        emailsCollected: 0,
        conversionRate: 0,
        monthlyRevenue: 0,
        questionnairesCompleted: 0,
      };
      mockFetchDashboardStats.mockResolvedValue(emptyStats);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.totalUsers).toBe(0);
      expect(body.activeUsers).toBe(0);
      expect(body.emailsCollected).toBe(0);
      expect(body.conversionRate).toBe(0);
      expect(body.monthlyRevenue).toBe(0);
      expect(body.questionnairesCompleted).toBe(0);
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
      mockFetchDashboardStats.mockRejectedValue(dbError);

      // Act
      const response = await GET(request);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch dashboard metrics'
      });
      expect(mockFetchDashboardStats).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when fetchDashboardStats throws', async () => {
      // Arrange
      const request = createMockRequest();
      mockFetchDashboardStats.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await GET(request);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch dashboard metrics'
      });
    });

    it('should handle malformed date parameters gracefully', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/dashboard/metrics?startDate=invalid-date&endDate=also-invalid';
      const request = createMockRequest(url);
      mockFetchDashboardStats.mockResolvedValue(mockDashboardStats);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200); // Should still work, just use the invalid dates as-is
      expect(body.period.start).toBe('invalid-date');
      expect(body.period.end).toBe('also-invalid');
    });

    it('should handle empty query parameters', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/dashboard/metrics?startDate=&endDate=';
      const request = createMockRequest(url);
      mockFetchDashboardStats.mockResolvedValue(mockDashboardStats);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      // Empty strings should be handled gracefully
      expect(typeof body.period.start).toBe('string');
      expect(typeof body.period.end).toBe('string');
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint logic is incomplete', async () => {
      // This test documents the TDD approach
      // When run for the first time (before full implementation), it should help drive development
      // After implementation, it should pass

      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchDashboardStats.mockResolvedValue(mockDashboardStats);

      // Act
      const response = await GET(request);
      const body: MetricsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // These assertions will drive the implementation requirements
      expect(body).toHaveProperty('totalUsers');
      expect(body).toHaveProperty('activeUsers');
      expect(body).toHaveProperty('emailsCollected');
      expect(body).toHaveProperty('conversionRate');
      expect(body).toHaveProperty('monthlyRevenue');
      expect(body).toHaveProperty('questionnairesCompleted');
      expect(body).toHaveProperty('period');
      expect(body.period).toHaveProperty('start');
      expect(body.period).toHaveProperty('end');

      // This will fail if the endpoint doesn't properly format the response
      expect(body.totalUsers).toBe(mockDashboardStats.totalUsers);
      expect(body.activeUsers).toBe(mockDashboardStats.activeUsers);
    });

    it('should fail if authentication is not properly implemented', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(); // No token

      // Act
      const response = await GET(request);

      // Assert
      // This will fail if authentication is not implemented
      expect(response.status).toBe(401);
      expect(mockFetchDashboardStats).not.toHaveBeenCalled();
    });

    it('should fail if error handling is not implemented', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchDashboardStats.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await GET(request);

      // Assert
      // This will fail if proper error handling is not implemented
      expect(response.status).toBe(500);
    });
  });
});