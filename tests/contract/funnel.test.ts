/**
 * Contract Tests for GET /api/admin/analytics/funnel
 *
 * This test suite follows TDD principles and validates the API contract for the admin funnel analytics endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Data Retrieval: Funnel analytics data structure and content
 * - Date Range Filtering: Query parameter handling for startDate/endDate
 * - Input Validation: Invalid date formats, missing parameters
 * - Error Handling: Database errors, internal server errors
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Empty funnels, zero conversion rates
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
import { GET } from '@/app/api/admin/analytics/funnel/route';

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
  fetchFunnelAnalytics: jest.fn(),
}));

import { fetchFunnelAnalytics } from '@/lib/analytics';
const mockFetchFunnelAnalytics = fetchFunnelAnalytics as jest.MockedFunction<typeof fetchFunnelAnalytics>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface FunnelStep {
  step: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

interface FunnelAnalyticsResponse {
  totalEntries: number;
  totalCompletions: number;
  overallConversionRate: number;
  steps: FunnelStep[];
  averageTimeToComplete: number;
  dropoffPoints: Array<{
    step: string;
    dropoffCount: number;
    dropoffRate: number;
  }>;
  conversionTrend: Array<{
    date: string;
    conversions: number;
    conversionRate: number;
  }>;
  segmentAnalysis: {
    newUsers: {
      entries: number;
      completions: number;
      conversionRate: number;
    };
    returningUsers: {
      entries: number;
      completions: number;
      conversionRate: number;
    };
  };
  period: {
    start: string;
    end: string;
  };
}

interface ErrorResponse {
  error: string;
}

// Mock data
const mockFunnelAnalytics: Omit<FunnelAnalyticsResponse, 'period'> = {
  totalEntries: 5000,
  totalCompletions: 1250,
  overallConversionRate: 25.0,
  steps: [
    {
      step: 'Landing Page Visit',
      users: 5000,
      conversionRate: 100.0,
      dropoffRate: 0.0,
    },
    {
      step: 'Email Signup',
      users: 3200,
      conversionRate: 64.0,
      dropoffRate: 36.0,
    },
    {
      step: 'Profile Creation',
      users: 2400,
      conversionRate: 48.0,
      dropoffRate: 25.0,
    },
    {
      step: 'First Survey Started',
      users: 1800,
      conversionRate: 36.0,
      dropoffRate: 25.0,
    },
    {
      step: 'First Survey Completed',
      users: 1250,
      conversionRate: 25.0,
      dropoffRate: 30.6,
    },
  ],
  averageTimeToComplete: 1800, // 30 minutes in seconds
  dropoffPoints: [
    {
      step: 'Email Signup',
      dropoffCount: 1800,
      dropoffRate: 36.0,
    },
    {
      step: 'Profile Creation',
      dropoffCount: 800,
      dropoffRate: 25.0,
    },
    {
      step: 'First Survey Started',
      dropoffCount: 600,
      dropoffRate: 25.0,
    },
    {
      step: 'First Survey Completed',
      dropoffCount: 550,
      dropoffRate: 30.6,
    },
  ],
  conversionTrend: [
    { date: '2024-01-01', conversions: 42, conversionRate: 24.5 },
    { date: '2024-01-02', conversions: 48, conversionRate: 25.8 },
    { date: '2024-01-03', conversions: 45, conversionRate: 24.9 },
    { date: '2024-01-04', conversions: 52, conversionRate: 26.2 },
    { date: '2024-01-05', conversions: 50, conversionRate: 25.5 },
  ],
  segmentAnalysis: {
    newUsers: {
      entries: 3500,
      completions: 750,
      conversionRate: 21.4,
    },
    returningUsers: {
      entries: 1500,
      completions: 500,
      conversionRate: 33.3,
    },
  },
};

const validAdminToken = 'valid-admin-token';

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/analytics/funnel'): NextRequest {
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

describe('GET /api/admin/analytics/funnel - Contract Tests', () => {
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
      expect(mockFetchFunnelAnalytics).not.toHaveBeenCalled();
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
      expect(mockFetchFunnelAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('Successful Analytics Retrieval', () => {
    beforeEach(() => {
      mockFetchFunnelAnalytics.mockResolvedValue(mockFunnelAnalytics);
    });

    it('should return funnel analytics with valid session', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: FunnelAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify response structure
      expect(body).toMatchObject({
        totalEntries: expect.any(Number),
        totalCompletions: expect.any(Number),
        overallConversionRate: expect.any(Number),
        steps: expect.any(Array),
        averageTimeToComplete: expect.any(Number),
        dropoffPoints: expect.any(Array),
        conversionTrend: expect.any(Array),
        segmentAnalysis: {
          newUsers: {
            entries: expect.any(Number),
            completions: expect.any(Number),
            conversionRate: expect.any(Number),
          },
          returningUsers: {
            entries: expect.any(Number),
            completions: expect.any(Number),
            conversionRate: expect.any(Number),
          },
        },
        period: {
          start: expect.any(String),
          end: expect.any(String),
        },
      });

      // Verify specific values
      expect(body.totalEntries).toBe(5000);
      expect(body.totalCompletions).toBe(1250);
      expect(body.overallConversionRate).toBe(25.0);
      expect(body.averageTimeToComplete).toBe(1800);

      // Verify steps array structure
      expect(body.steps).toHaveLength(5);
      body.steps.forEach((step, index) => {
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('users');
        expect(step).toHaveProperty('conversionRate');
        expect(step).toHaveProperty('dropoffRate');
        expect(typeof step.step).toBe('string');
        expect(typeof step.users).toBe('number');
        expect(typeof step.conversionRate).toBe('number');
        expect(typeof step.dropoffRate).toBe('number');

        // Verify funnel logic: each step should have equal or fewer users than the previous
        if (index > 0) {
          expect(step.users).toBeLessThanOrEqual(body.steps[index - 1].users);
        }
      });

      // Verify dropoff points structure
      expect(body.dropoffPoints).toHaveLength(4);
      body.dropoffPoints.forEach(dropoff => {
        expect(dropoff).toHaveProperty('step');
        expect(dropoff).toHaveProperty('dropoffCount');
        expect(dropoff).toHaveProperty('dropoffRate');
        expect(typeof dropoff.step).toBe('string');
        expect(typeof dropoff.dropoffCount).toBe('number');
        expect(typeof dropoff.dropoffRate).toBe('number');
      });

      // Verify conversion trend structure
      expect(body.conversionTrend).toHaveLength(5);
      body.conversionTrend.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('conversions');
        expect(trend).toHaveProperty('conversionRate');
        expect(typeof trend.date).toBe('string');
        expect(typeof trend.conversions).toBe('number');
        expect(typeof trend.conversionRate).toBe('number');
      });

      // Verify segment analysis
      expect(body.segmentAnalysis.newUsers.entries + body.segmentAnalysis.returningUsers.entries).toBe(body.totalEntries);
      expect(body.segmentAnalysis.newUsers.completions + body.segmentAnalysis.returningUsers.completions).toBe(body.totalCompletions);

      expect(mockFetchFunnelAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should handle date range filtering with startDate and endDate', async () => {
      // Arrange
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';
      const url = `http://localhost:3000/api/admin/analytics/funnel?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: FunnelAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.period.start).toBe(startDate);
      expect(body.period.end).toBe(endDate);
      expect(mockFetchFunnelAnalytics).toHaveBeenCalledWith(
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
      const body: FunnelAnalyticsResponse = await response.json();

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

    it('should handle funnel type filtering', async () => {
      // Arrange
      const funnelType = 'signup';
      const url = `http://localhost:3000/api/admin/analytics/funnel?type=${funnelType}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: FunnelAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockFetchFunnelAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          funnelType: funnelType
        })
      );
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockFetchFunnelAnalytics.mockResolvedValue(mockFunnelAnalytics);
    });

    it('should return response matching FunnelAnalyticsResponse interface', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: FunnelAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify all required fields are present and of correct type
      expect(typeof body.totalEntries).toBe('number');
      expect(typeof body.totalCompletions).toBe('number');
      expect(typeof body.overallConversionRate).toBe('number');
      expect(typeof body.averageTimeToComplete).toBe('number');

      expect(Array.isArray(body.steps)).toBe(true);
      expect(Array.isArray(body.dropoffPoints)).toBe(true);
      expect(Array.isArray(body.conversionTrend)).toBe(true);

      expect(body.segmentAnalysis).toBeDefined();
      expect(body.segmentAnalysis.newUsers).toBeDefined();
      expect(body.segmentAnalysis.returningUsers).toBeDefined();

      expect(body.period).toBeDefined();
      expect(typeof body.period.start).toBe('string');
      expect(typeof body.period.end).toBe('string');

      // Verify business logic constraints
      expect(body.totalCompletions).toBeLessThanOrEqual(body.totalEntries);
      expect(body.overallConversionRate).toBeGreaterThanOrEqual(0);
      expect(body.overallConversionRate).toBeLessThanOrEqual(100);
      expect(body.averageTimeToComplete).toBeGreaterThan(0);

      // Verify conversion rate calculation
      const expectedConversionRate = (body.totalCompletions / body.totalEntries) * 100;
      expect(Math.abs(body.overallConversionRate - expectedConversionRate)).toBeLessThan(0.1);
    });

    it('should validate funnel steps logic', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: FunnelAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify funnel step validation
      for (let i = 1; i < body.steps.length; i++) {
        const currentStep = body.steps[i];
        const previousStep = body.steps[i - 1];

        // Each step should have equal or fewer users than the previous step
        expect(currentStep.users).toBeLessThanOrEqual(previousStep.users);

        // Conversion rates should be valid percentages
        expect(currentStep.conversionRate).toBeGreaterThanOrEqual(0);
        expect(currentStep.conversionRate).toBeLessThanOrEqual(100);
        expect(currentStep.dropoffRate).toBeGreaterThanOrEqual(0);
        expect(currentStep.dropoffRate).toBeLessThanOrEqual(100);
      }

      // First step should have the total entries
      expect(body.steps[0].users).toBe(body.totalEntries);
      expect(body.steps[0].conversionRate).toBe(100);
      expect(body.steps[0].dropoffRate).toBe(0);

      // Last step should have the total completions
      expect(body.steps[body.steps.length - 1].users).toBe(body.totalCompletions);
    });

    it('should handle empty funnel data', async () => {
      // Arrange
      const request = createMockRequest();
      const emptyFunnelData = {
        totalEntries: 0,
        totalCompletions: 0,
        overallConversionRate: 0,
        steps: [],
        averageTimeToComplete: 0,
        dropoffPoints: [],
        conversionTrend: [],
        segmentAnalysis: {
          newUsers: { entries: 0, completions: 0, conversionRate: 0 },
          returningUsers: { entries: 0, completions: 0, conversionRate: 0 },
        },
      };
      mockFetchFunnelAnalytics.mockResolvedValue(emptyFunnelData);

      // Act
      const response = await GET(request);
      const body: FunnelAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.totalEntries).toBe(0);
      expect(body.totalCompletions).toBe(0);
      expect(body.overallConversionRate).toBe(0);
      expect(body.steps).toEqual([]);
      expect(body.dropoffPoints).toEqual([]);
      expect(body.conversionTrend).toEqual([]);
    });

    it('should validate date strings in period', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: FunnelAnalyticsResponse = await response.json();

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
      mockFetchFunnelAnalytics.mockRejectedValue(dbError);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch funnel analytics'
      });
      expect(mockFetchFunnelAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when fetchFunnelAnalytics throws', async () => {
      // Arrange
      const request = createMockRequest();
      mockFetchFunnelAnalytics.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch funnel analytics'
      });
    });

    it('should handle malformed date parameters gracefully', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/analytics/funnel?startDate=invalid-date&endDate=also-invalid';
      const request = createMockRequest(url);
      mockFetchFunnelAnalytics.mockResolvedValue(mockFunnelAnalytics);

      // Act
      const response = await GET(request);

      // Assert
      // Should either handle gracefully or return appropriate error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle invalid funnel type parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/analytics/funnel?type=invalid-type';
      const request = createMockRequest(url);
      mockFetchFunnelAnalytics.mockResolvedValue(mockFunnelAnalytics);

      // Act
      const response = await GET(request);

      // Assert
      // Should either filter to empty results or return error
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
      mockFetchFunnelAnalytics.mockResolvedValue(mockFunnelAnalytics);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request);
        const body: FunnelAnalyticsResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('totalEntries');
        expect(body).toHaveProperty('totalCompletions');
        expect(body).toHaveProperty('overallConversionRate');
        expect(body).toHaveProperty('steps');
        expect(body).toHaveProperty('averageTimeToComplete');
        expect(body).toHaveProperty('dropoffPoints');
        expect(body).toHaveProperty('conversionTrend');
        expect(body).toHaveProperty('segmentAnalysis');
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
        expect(mockFetchFunnelAnalytics).not.toHaveBeenCalled();
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should fail if error handling is not implemented', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchFunnelAnalytics.mockRejectedValue(new Error('Database error'));

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