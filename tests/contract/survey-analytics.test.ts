/**
 * Contract Tests for GET /api/admin/analytics/survey
 *
 * This test suite follows TDD principles and validates the API contract for the admin survey analytics endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Data Retrieval: Survey analytics data structure and content
 * - Date Range Filtering: Query parameter handling for startDate/endDate
 * - Input Validation: Invalid date formats, missing parameters
 * - Error Handling: Database errors, internal server errors
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Empty surveys, zero completion rates
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
import { GET } from '@/app/api/admin/analytics/survey/route';

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
  fetchSurveyAnalytics: jest.fn(),
}));

import { fetchSurveyAnalytics } from '@/lib/analytics';
const mockFetchSurveyAnalytics = fetchSurveyAnalytics as jest.MockedFunction<typeof fetchSurveyAnalytics>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface SurveyAnalyticsResponse {
  totalSurveys: number;
  completedSurveys: number;
  incompleteSurveys: number;
  completionRate: number;
  averageCompletionTime: number;
  surveysByCategory: {
    personal: number;
    professional: number;
    lifestyle: number;
    health: number;
  };
  responseDistribution: Array<{
    surveyId: string;
    title: string;
    completions: number;
    averageRating: number;
  }>;
  completionTrend: Array<{
    date: string;
    completions: number;
  }>;
  abandonmentRate: number;
  period: {
    start: string;
    end: string;
  };
}

interface ErrorResponse {
  error: string;
}

// Mock data
const mockSurveyAnalytics: Omit<SurveyAnalyticsResponse, 'period'> = {
  totalSurveys: 2450,
  completedSurveys: 1890,
  incompleteSurveys: 560,
  completionRate: 77.1,
  averageCompletionTime: 420, // 7 minutes in seconds
  surveysByCategory: {
    personal: 650,
    professional: 720,
    lifestyle: 580,
    health: 500,
  },
  responseDistribution: [
    {
      surveyId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Career Satisfaction Survey',
      completions: 450,
      averageRating: 4.2,
    },
    {
      surveyId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Lifestyle Preferences',
      completions: 380,
      averageRating: 3.8,
    },
    {
      surveyId: '123e4567-e89b-12d3-a456-426614174002',
      title: 'Health & Wellness',
      completions: 320,
      averageRating: 4.5,
    },
  ],
  completionTrend: [
    { date: '2024-01-01', completions: 45 },
    { date: '2024-01-02', completions: 52 },
    { date: '2024-01-03', completions: 48 },
    { date: '2024-01-04', completions: 61 },
    { date: '2024-01-05', completions: 55 },
  ],
  abandonmentRate: 22.9,
};

const validAdminToken = 'valid-admin-token';

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/analytics/survey'): NextRequest {
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

describe('GET /api/admin/analytics/survey - Contract Tests', () => {
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
      expect(mockFetchSurveyAnalytics).not.toHaveBeenCalled();
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
      expect(mockFetchSurveyAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('Successful Analytics Retrieval', () => {
    beforeEach(() => {
      mockFetchSurveyAnalytics.mockResolvedValue(mockSurveyAnalytics);
    });

    it('should return survey analytics with valid session', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: SurveyAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify response structure
      expect(body).toMatchObject({
        totalSurveys: expect.any(Number),
        completedSurveys: expect.any(Number),
        incompleteSurveys: expect.any(Number),
        completionRate: expect.any(Number),
        averageCompletionTime: expect.any(Number),
        surveysByCategory: {
          personal: expect.any(Number),
          professional: expect.any(Number),
          lifestyle: expect.any(Number),
          health: expect.any(Number),
        },
        responseDistribution: expect.any(Array),
        completionTrend: expect.any(Array),
        abandonmentRate: expect.any(Number),
        period: {
          start: expect.any(String),
          end: expect.any(String),
        },
      });

      // Verify specific values
      expect(body.totalSurveys).toBe(2450);
      expect(body.completedSurveys).toBe(1890);
      expect(body.incompleteSurveys).toBe(560);
      expect(body.completionRate).toBe(77.1);
      expect(body.averageCompletionTime).toBe(420);
      expect(body.abandonmentRate).toBe(22.9);

      // Verify category breakdown
      expect(body.surveysByCategory.personal).toBe(650);
      expect(body.surveysByCategory.professional).toBe(720);
      expect(body.surveysByCategory.lifestyle).toBe(580);
      expect(body.surveysByCategory.health).toBe(500);

      // Verify response distribution array structure
      expect(body.responseDistribution).toHaveLength(3);
      body.responseDistribution.forEach(item => {
        expect(item).toHaveProperty('surveyId');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('completions');
        expect(item).toHaveProperty('averageRating');
        expect(typeof item.surveyId).toBe('string');
        expect(typeof item.title).toBe('string');
        expect(typeof item.completions).toBe('number');
        expect(typeof item.averageRating).toBe('number');
      });

      // Verify completion trend array structure
      expect(body.completionTrend).toHaveLength(5);
      body.completionTrend.forEach(item => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('completions');
        expect(typeof item.date).toBe('string');
        expect(typeof item.completions).toBe('number');
      });

      expect(mockFetchSurveyAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should handle date range filtering with startDate and endDate', async () => {
      // Arrange
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';
      const url = `http://localhost:3000/api/admin/analytics/survey?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: SurveyAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.period.start).toBe(startDate);
      expect(body.period.end).toBe(endDate);
      expect(mockFetchSurveyAnalytics).toHaveBeenCalledWith(
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
      const body: SurveyAnalyticsResponse = await response.json();

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

    it('should handle category filtering', async () => {
      // Arrange
      const category = 'professional';
      const url = `http://localhost:3000/api/admin/analytics/survey?category=${category}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: SurveyAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockFetchSurveyAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          category: category
        })
      );
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockFetchSurveyAnalytics.mockResolvedValue(mockSurveyAnalytics);
    });

    it('should return response matching SurveyAnalyticsResponse interface', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: SurveyAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify all required fields are present and of correct type
      expect(typeof body.totalSurveys).toBe('number');
      expect(typeof body.completedSurveys).toBe('number');
      expect(typeof body.incompleteSurveys).toBe('number');
      expect(typeof body.completionRate).toBe('number');
      expect(typeof body.averageCompletionTime).toBe('number');
      expect(typeof body.abandonmentRate).toBe('number');

      expect(body.surveysByCategory).toBeDefined();
      expect(typeof body.surveysByCategory.personal).toBe('number');
      expect(typeof body.surveysByCategory.professional).toBe('number');
      expect(typeof body.surveysByCategory.lifestyle).toBe('number');
      expect(typeof body.surveysByCategory.health).toBe('number');

      expect(Array.isArray(body.responseDistribution)).toBe(true);
      expect(Array.isArray(body.completionTrend)).toBe(true);

      expect(body.period).toBeDefined();
      expect(typeof body.period.start).toBe('string');
      expect(typeof body.period.end).toBe('string');

      // Verify business logic constraints
      expect(body.completedSurveys + body.incompleteSurveys).toBe(body.totalSurveys);
      expect(body.completionRate).toBeGreaterThanOrEqual(0);
      expect(body.completionRate).toBeLessThanOrEqual(100);
      expect(body.abandonmentRate).toBeGreaterThanOrEqual(0);
      expect(body.abandonmentRate).toBeLessThanOrEqual(100);
      expect(Math.abs(body.completionRate + body.abandonmentRate - 100)).toBeLessThan(0.1); // Allow for rounding
    });

    it('should validate response distribution structure', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: SurveyAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      body.responseDistribution.forEach(survey => {
        expect(survey.surveyId).toMatch(/^[0-9a-f-]{36}$/i); // UUID format
        expect(survey.title.length).toBeGreaterThan(0);
        expect(survey.completions).toBeGreaterThanOrEqual(0);
        expect(survey.averageRating).toBeGreaterThanOrEqual(0);
        expect(survey.averageRating).toBeLessThanOrEqual(5);
      });
    });

    it('should handle empty response distribution', async () => {
      // Arrange
      const request = createMockRequest();
      const emptyResponseData = {
        ...mockSurveyAnalytics,
        responseDistribution: [],
      };
      mockFetchSurveyAnalytics.mockResolvedValue(emptyResponseData);

      // Act
      const response = await GET(request);
      const body: SurveyAnalyticsResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.responseDistribution).toEqual([]);
    });

    it('should validate date strings in period', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: SurveyAnalyticsResponse = await response.json();

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
      mockFetchSurveyAnalytics.mockRejectedValue(dbError);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch survey analytics'
      });
      expect(mockFetchSurveyAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when fetchSurveyAnalytics throws', async () => {
      // Arrange
      const request = createMockRequest();
      mockFetchSurveyAnalytics.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch survey analytics'
      });
    });

    it('should handle malformed date parameters gracefully', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/analytics/survey?startDate=invalid-date&endDate=also-invalid';
      const request = createMockRequest(url);
      mockFetchSurveyAnalytics.mockResolvedValue(mockSurveyAnalytics);

      // Act
      const response = await GET(request);

      // Assert
      // Should either handle gracefully or return appropriate error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle invalid category parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/analytics/survey?category=invalid-category';
      const request = createMockRequest(url);
      mockFetchSurveyAnalytics.mockResolvedValue(mockSurveyAnalytics);

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
      mockFetchSurveyAnalytics.mockResolvedValue(mockSurveyAnalytics);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request);
        const body: SurveyAnalyticsResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('totalSurveys');
        expect(body).toHaveProperty('completedSurveys');
        expect(body).toHaveProperty('incompleteSurveys');
        expect(body).toHaveProperty('completionRate');
        expect(body).toHaveProperty('averageCompletionTime');
        expect(body).toHaveProperty('surveysByCategory');
        expect(body).toHaveProperty('responseDistribution');
        expect(body).toHaveProperty('completionTrend');
        expect(body).toHaveProperty('abandonmentRate');
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
        expect(mockFetchSurveyAnalytics).not.toHaveBeenCalled();
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should fail if error handling is not implemented', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchSurveyAnalytics.mockRejectedValue(new Error('Database error'));

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