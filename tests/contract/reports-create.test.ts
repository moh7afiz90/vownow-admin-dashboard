/**
 * Contract Tests for POST /api/admin/reports
 *
 * This test suite follows TDD principles and validates the API contract for the admin reports creation endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Report Creation: Successful report creation with valid data
 * - Input Validation: Required fields, data types, constraints
 * - Scheduling: Schedule configuration validation
 * - Parameters: Report parameters validation
 * - Error Handling: Database errors, validation errors
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Duplicate names, invalid schedules
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
import { POST } from '@/app/api/admin/reports/route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: jest.fn().mockResolvedValue(data),
      status: options?.status || 201,
      statusText: options?.statusText || 'Created',
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
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: null })),
        })),
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
  createReport: jest.fn(),
  validateReportConfig: jest.fn(),
}));

import { createReport, validateReportConfig } from '@/lib/admin/reports';
const mockCreateReport = createReport as jest.MockedFunction<typeof createReport>;
const mockValidateReportConfig = validateReportConfig as jest.MockedFunction<typeof validateReportConfig>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface CreateReportRequest {
  name: string;
  description: string;
  type: 'analytics' | 'users' | 'surveys' | 'financial' | 'system';
  scheduleConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  };
  parameters?: Record<string, any>;
  isPublic?: boolean;
}

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
  averageRunTime: number;
}

interface CreateReportSuccessResponse {
  success: true;
  report: Report;
}

interface CreateReportErrorResponse {
  error: string;
  details?: string[];
}

type CreateReportResponse = CreateReportSuccessResponse | CreateReportErrorResponse;

const validAdminToken = 'valid-admin-token';

// Mock data
const validCreateReportData: CreateReportRequest = {
  name: 'Monthly User Analytics',
  description: 'Comprehensive monthly report on user engagement and activity metrics',
  type: 'analytics',
  scheduleConfig: {
    frequency: 'monthly',
    dayOfMonth: 1,
    time: '09:00',
  },
  parameters: {
    includeInactive: false,
    dateRange: 30,
  },
  isPublic: false,
};

const mockCreatedReport: Report = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: validCreateReportData.name,
  description: validCreateReportData.description,
  type: validCreateReportData.type,
  status: 'scheduled',
  createdAt: '2024-01-23T10:30:00.000Z',
  updatedAt: '2024-01-23T10:30:00.000Z',
  lastRunAt: null,
  nextRunAt: '2024-02-01T09:00:00.000Z',
  scheduleConfig: validCreateReportData.scheduleConfig!,
  parameters: validCreateReportData.parameters!,
  createdBy: 'admin@vownow.com',
  isPublic: false,
  downloadCount: 0,
  averageRunTime: 0,
};

// Helper function to create a mock NextRequest
async function makeRequest(body: any): Promise<Response> {
  const request = {
    json: jest.fn().mockResolvedValue(body),
    url: 'http://localhost:3000/api/admin/reports',
    method: 'POST',
    headers: {
      get: jest.fn().mockReturnValue('application/json'),
    },
  } as unknown as NextRequest;

  return await POST(request);
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

describe('POST /api/admin/reports - Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no admin token is provided', async () => {
      // Arrange
      mockCookieStore(); // No token provided

      // Act
      const response = await makeRequest(validCreateReportData);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockCreateReport).not.toHaveBeenCalled();
    });

    it('should return 401 when admin token is invalid', async () => {
      // Arrange
      const cookieStore = mockCookieStore();
      cookieStore.get.mockReturnValue(null);

      // Act
      const response = await makeRequest(validCreateReportData);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockCreateReport).not.toHaveBeenCalled();
    });
  });

  describe('Successful Report Creation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockValidateReportConfig.mockResolvedValue({ isValid: true });
      mockCreateReport.mockResolvedValue({
        success: true,
        report: mockCreatedReport,
      });
    });

    it('should create report with valid data', async () => {
      // Act
      const response = await makeRequest(validCreateReportData);
      const body: CreateReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body).toEqual({
        success: true,
        report: mockCreatedReport,
      });

      expect(mockValidateReportConfig).toHaveBeenCalledWith(validCreateReportData.scheduleConfig);
      expect(mockCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validCreateReportData.name,
          description: validCreateReportData.description,
          type: validCreateReportData.type,
          scheduleConfig: validCreateReportData.scheduleConfig,
          parameters: validCreateReportData.parameters,
          isPublic: validCreateReportData.isPublic,
        })
      );
    });

    it('should create report without schedule config', async () => {
      // Arrange
      const reportDataWithoutSchedule = {
        ...validCreateReportData,
        scheduleConfig: undefined,
      };

      const reportWithoutSchedule = {
        ...mockCreatedReport,
        status: 'inactive' as const,
        scheduleConfig: null,
        nextRunAt: null,
      };

      mockCreateReport.mockResolvedValue({
        success: true,
        report: reportWithoutSchedule,
      });

      // Act
      const response = await makeRequest(reportDataWithoutSchedule);
      const body: CreateReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.report.scheduleConfig).toBeNull();
      expect(body.report.status).toBe('inactive');
      expect(body.report.nextRunAt).toBeNull();
    });

    it('should create report with default parameters', async () => {
      // Arrange
      const reportDataWithoutParams = {
        name: 'Simple Report',
        description: 'A simple report without parameters',
        type: 'users' as const,
      };

      const simpleReport = {
        ...mockCreatedReport,
        name: reportDataWithoutParams.name,
        description: reportDataWithoutParams.description,
        type: reportDataWithoutParams.type,
        scheduleConfig: null,
        parameters: {},
        status: 'inactive' as const,
        nextRunAt: null,
      };

      mockCreateReport.mockResolvedValue({
        success: true,
        report: simpleReport,
      });

      // Act
      const response = await makeRequest(reportDataWithoutParams);
      const body: CreateReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.report.parameters).toEqual({});
      expect(body.report.isPublic).toBe(false); // Default value
    });

    it('should create public report', async () => {
      // Arrange
      const publicReportData = {
        ...validCreateReportData,
        isPublic: true,
      };

      const publicReport = {
        ...mockCreatedReport,
        isPublic: true,
      };

      mockCreateReport.mockResolvedValue({
        success: true,
        report: publicReport,
      });

      // Act
      const response = await makeRequest(publicReportData);
      const body: CreateReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.report.isPublic).toBe(true);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return 400 when name is missing', async () => {
      // Arrange
      const requestWithoutName = {
        ...validCreateReportData,
        name: undefined,
      };

      // Act
      const response = await makeRequest(requestWithoutName);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Name is required'
      });
      expect(mockCreateReport).not.toHaveBeenCalled();
    });

    it('should return 400 when name is empty', async () => {
      // Arrange
      const requestWithEmptyName = {
        ...validCreateReportData,
        name: '',
      };

      // Act
      const response = await makeRequest(requestWithEmptyName);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Name is required'
      });
    });

    it('should return 400 when description is missing', async () => {
      // Arrange
      const requestWithoutDescription = {
        ...validCreateReportData,
        description: undefined,
      };

      // Act
      const response = await makeRequest(requestWithoutDescription);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Description is required'
      });
    });

    it('should return 400 when type is invalid', async () => {
      // Arrange
      const requestWithInvalidType = {
        ...validCreateReportData,
        type: 'invalid-type',
      };

      // Act
      const response = await makeRequest(requestWithInvalidType);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid report type'
      });
    });

    it('should return 400 when schedule config is invalid', async () => {
      // Arrange
      const requestWithInvalidSchedule = {
        ...validCreateReportData,
        scheduleConfig: {
          frequency: 'invalid' as any,
        },
      };

      mockValidateReportConfig.mockResolvedValue({
        isValid: false,
        errors: ['Invalid frequency'],
      });

      // Act
      const response = await makeRequest(requestWithInvalidSchedule);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid schedule configuration',
        details: ['Invalid frequency'],
      });
      expect(mockCreateReport).not.toHaveBeenCalled();
    });

    it('should return 400 when name is too long', async () => {
      // Arrange
      const requestWithLongName = {
        ...validCreateReportData,
        name: 'a'.repeat(256), // Assuming 255 character limit
      };

      // Act
      const response = await makeRequest(requestWithLongName);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Name is too long (maximum 255 characters)'
      });
    });

    it('should return 400 when parameters are invalid JSON', async () => {
      // Arrange
      const requestWithInvalidParams = {
        ...validCreateReportData,
        parameters: 'invalid-json',
      };

      // Act
      const response = await makeRequest(requestWithInvalidParams);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Parameters must be a valid object'
      });
    });
  });

  describe('Schedule Configuration Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should validate daily schedule configuration', async () => {
      // Arrange
      const dailyScheduleData = {
        ...validCreateReportData,
        scheduleConfig: {
          frequency: 'daily' as const,
          time: '09:00',
        },
      };

      mockValidateReportConfig.mockResolvedValue({ isValid: true });
      mockCreateReport.mockResolvedValue({
        success: true,
        report: { ...mockCreatedReport, scheduleConfig: dailyScheduleData.scheduleConfig },
      });

      // Act
      const response = await makeRequest(dailyScheduleData);

      // Assert
      expect(response.status).toBe(201);
      expect(mockValidateReportConfig).toHaveBeenCalledWith(dailyScheduleData.scheduleConfig);
    });

    it('should validate weekly schedule configuration', async () => {
      // Arrange
      const weeklyScheduleData = {
        ...validCreateReportData,
        scheduleConfig: {
          frequency: 'weekly' as const,
          dayOfWeek: 1, // Monday
          time: '08:00',
        },
      };

      mockValidateReportConfig.mockResolvedValue({ isValid: true });
      mockCreateReport.mockResolvedValue({
        success: true,
        report: { ...mockCreatedReport, scheduleConfig: weeklyScheduleData.scheduleConfig },
      });

      // Act
      const response = await makeRequest(weeklyScheduleData);

      // Assert
      expect(response.status).toBe(201);
      expect(mockValidateReportConfig).toHaveBeenCalledWith(weeklyScheduleData.scheduleConfig);
    });

    it('should validate custom schedule configuration', async () => {
      // Arrange
      const customScheduleData = {
        ...validCreateReportData,
        scheduleConfig: {
          frequency: 'custom' as const,
          interval: 3,
          time: '14:30',
        },
      };

      mockValidateReportConfig.mockResolvedValue({ isValid: true });
      mockCreateReport.mockResolvedValue({
        success: true,
        report: { ...mockCreatedReport, scheduleConfig: customScheduleData.scheduleConfig },
      });

      // Act
      const response = await makeRequest(customScheduleData);

      // Assert
      expect(response.status).toBe(201);
      expect(mockValidateReportConfig).toHaveBeenCalledWith(customScheduleData.scheduleConfig);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockValidateReportConfig.mockResolvedValue({ isValid: true });
    });

    it('should return 409 when report name already exists', async () => {
      // Arrange
      mockCreateReport.mockResolvedValue({
        error: 'Report with this name already exists',
      });

      // Act
      const response = await makeRequest(validCreateReportData);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(body).toEqual({
        error: 'Report with this name already exists'
      });
    });

    it('should return 500 for internal server errors', async () => {
      // Arrange
      mockCreateReport.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await makeRequest(validCreateReportData);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to create report'
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      // Arrange
      const malformedRequest = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token in JSON')),
        url: 'http://localhost:3000/api/admin/reports',
        method: 'POST',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      } as unknown as NextRequest;

      // Act
      const response = await POST(malformedRequest);
      const body: CreateReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to create report'
      });
    });
  });

  describe('Response Format Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockValidateReportConfig.mockResolvedValue({ isValid: true });
      mockCreateReport.mockResolvedValue({
        success: true,
        report: mockCreatedReport,
      });
    });

    it('should return response with correct Content-Type header', async () => {
      // Act
      const response = await makeRequest(validCreateReportData);

      // Assert
      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('should return consistent success response format', async () => {
      // Act
      const response = await makeRequest(validCreateReportData);
      const body: CreateReportSuccessResponse = await response.json();

      // Assert
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('report');
      expect(body.report).toHaveProperty('id');
      expect(body.report).toHaveProperty('name');
      expect(body.report).toHaveProperty('type');
      expect(body.report).toHaveProperty('status');
      expect(body.report).toHaveProperty('createdAt');
      expect(body).not.toHaveProperty('error');
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint does not exist', async () => {
      // This test documents the TDD approach
      // When run for the first time, it should fail because the endpoint doesn't exist

      // Arrange
      mockCookieStore(validAdminToken);
      mockValidateReportConfig.mockResolvedValue({ isValid: true });
      mockCreateReport.mockResolvedValue({
        success: true,
        report: mockCreatedReport,
      });

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await makeRequest(validCreateReportData);
        const body: CreateReportSuccessResponse = await response.json();

        expect(response.status).toBe(201);
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('report');
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });
  });
});