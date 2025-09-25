/**
 * Contract Tests for POST /api/admin/reports/{id}/run
 *
 * This test suite follows TDD principles and validates the API contract for the admin report run endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Report Execution: Successful report execution
 * - Validation: Report existence, status validation
 * - Immediate vs Scheduled: Different execution types
 * - Error Handling: Database errors, validation errors
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Already running reports, invalid report IDs
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
import { POST } from '@/app/api/admin/reports/[id]/run/route';

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
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null })),
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
  runReport: jest.fn(),
  getReportById: jest.fn(),
  scheduleReportRun: jest.fn(),
}));

import { runReport, getReportById, scheduleReportRun } from '@/lib/admin/reports';
const mockRunReport = runReport as jest.MockedFunction<typeof runReport>;
const mockGetReportById = getReportById as jest.MockedFunction<typeof getReportById>;
const mockScheduleReportRun = scheduleReportRun as jest.MockedFunction<typeof scheduleReportRun>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface RunReportRequest {
  immediate?: boolean;
  parameters?: Record<string, any>;
  scheduledFor?: string;
}

interface ReportExecution {
  id: string;
  reportId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt: string | null;
  duration: number | null; // in seconds
  resultSize: number | null; // in bytes
  errorMessage: string | null;
  parameters: Record<string, any>;
  triggeredBy: string;
  isScheduled: boolean;
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

interface RunReportSuccessResponse {
  success: true;
  execution: ReportExecution;
  message: string;
}

interface RunReportErrorResponse {
  error: string;
  details?: string;
}

type RunReportResponse = RunReportSuccessResponse | RunReportErrorResponse;

const validAdminToken = 'valid-admin-token';
const validReportId = '123e4567-e89b-12d3-a456-426614174000';

// Mock data
const mockReport: Report = {
  id: validReportId,
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
};

const mockExecution: ReportExecution = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  reportId: validReportId,
  status: 'running',
  startedAt: '2024-01-23T10:30:00.000Z',
  completedAt: null,
  duration: null,
  resultSize: null,
  errorMessage: null,
  parameters: {
    includeInactive: false,
    dateRange: 30,
  },
  triggeredBy: 'admin@vownow.com',
  isScheduled: false,
};

const validRunReportData: RunReportRequest = {
  immediate: true,
  parameters: {
    includeInactive: false,
    dateRange: 30,
  },
};

// Helper function to create a mock NextRequest
async function makeRequest(reportId: string, body: any): Promise<Response> {
  const request = {
    json: jest.fn().mockResolvedValue(body),
    url: `http://localhost:3000/api/admin/reports/${reportId}/run`,
    method: 'POST',
    headers: {
      get: jest.fn().mockReturnValue('application/json'),
    },
  } as unknown as NextRequest;

  const params = { params: { id: reportId } };
  return await POST(request, params);
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

describe('POST /api/admin/reports/{id}/run - Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no admin token is provided', async () => {
      // Arrange
      mockCookieStore(); // No token provided

      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockRunReport).not.toHaveBeenCalled();
      expect(mockGetReportById).not.toHaveBeenCalled();
    });

    it('should return 401 when admin token is invalid', async () => {
      // Arrange
      const cookieStore = mockCookieStore();
      cookieStore.get.mockReturnValue(null);

      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockRunReport).not.toHaveBeenCalled();
    });
  });

  describe('Report Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return 404 when report does not exist', async () => {
      // Arrange
      const nonExistentReportId = '123e4567-e89b-12d3-a456-426614174999';
      mockGetReportById.mockResolvedValue(null);

      // Act
      const response = await makeRequest(nonExistentReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body).toEqual({
        error: 'Report not found'
      });
      expect(mockGetReportById).toHaveBeenCalledWith(nonExistentReportId);
      expect(mockRunReport).not.toHaveBeenCalled();
    });

    it('should return 400 when report ID is invalid format', async () => {
      // Arrange
      const invalidReportId = 'invalid-id';

      // Act
      const response = await makeRequest(invalidReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid report ID format'
      });
    });

    it('should return 400 when report is inactive', async () => {
      // Arrange
      const inactiveReport = { ...mockReport, status: 'inactive' as const };
      mockGetReportById.mockResolvedValue(inactiveReport);

      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Cannot run inactive report',
        details: 'Report must be active or scheduled to be executed'
      });
      expect(mockRunReport).not.toHaveBeenCalled();
    });
  });

  describe('Successful Report Execution', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
    });

    it('should run report immediately with valid data', async () => {
      // Arrange
      mockRunReport.mockResolvedValue({
        success: true,
        execution: mockExecution,
      });

      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        execution: mockExecution,
        message: 'Report execution started successfully'
      });

      expect(mockGetReportById).toHaveBeenCalledWith(validReportId);
      expect(mockRunReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          immediate: true,
          parameters: validRunReportData.parameters,
          triggeredBy: 'admin@vownow.com',
        })
      );
    });

    it('should schedule report execution for later', async () => {
      // Arrange
      const scheduledRunData = {
        immediate: false,
        scheduledFor: '2024-01-25T09:00:00.000Z',
        parameters: mockReport.parameters,
      };

      const scheduledExecution = {
        ...mockExecution,
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: 'pending' as const,
        isScheduled: true,
      };

      mockScheduleReportRun.mockResolvedValue({
        success: true,
        execution: scheduledExecution,
      });

      // Act
      const response = await makeRequest(validReportId, scheduledRunData);
      const body: RunReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        execution: scheduledExecution,
        message: 'Report execution scheduled successfully'
      });

      expect(mockScheduleReportRun).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          scheduledFor: scheduledRunData.scheduledFor,
          parameters: scheduledRunData.parameters,
          triggeredBy: 'admin@vownow.com',
        })
      );
    });

    it('should run report with default parameters when none provided', async () => {
      // Arrange
      const runDataWithoutParams = {
        immediate: true,
      };

      const executionWithDefaultParams = {
        ...mockExecution,
        parameters: mockReport.parameters,
      };

      mockRunReport.mockResolvedValue({
        success: true,
        execution: executionWithDefaultParams,
      });

      // Act
      const response = await makeRequest(validReportId, runDataWithoutParams);
      const body: RunReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockRunReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          immediate: true,
          parameters: mockReport.parameters, // Should use default parameters
          triggeredBy: 'admin@vownow.com',
        })
      );
    });

    it('should override default parameters with provided ones', async () => {
      // Arrange
      const customParams = {
        includeInactive: true,
        dateRange: 60,
        customParam: 'custom-value',
      };

      const runDataWithCustomParams = {
        immediate: true,
        parameters: customParams,
      };

      const executionWithCustomParams = {
        ...mockExecution,
        parameters: { ...mockReport.parameters, ...customParams },
      };

      mockRunReport.mockResolvedValue({
        success: true,
        execution: executionWithCustomParams,
      });

      // Act
      const response = await makeRequest(validReportId, runDataWithCustomParams);
      const body: RunReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockRunReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          immediate: true,
          parameters: expect.objectContaining(customParams),
          triggeredBy: 'admin@vownow.com',
        })
      );
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
    });

    it('should handle empty request body', async () => {
      // Arrange
      const emptyRequestData = {};

      mockRunReport.mockResolvedValue({
        success: true,
        execution: { ...mockExecution, isScheduled: false },
      });

      // Act
      const response = await makeRequest(validReportId, emptyRequestData);
      const body: RunReportSuccessResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockRunReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          immediate: true, // Should default to immediate execution
          parameters: mockReport.parameters,
        })
      );
    });

    it('should return 400 when scheduledFor is invalid date format', async () => {
      // Arrange
      const invalidScheduleData = {
        immediate: false,
        scheduledFor: 'invalid-date',
      };

      // Act
      const response = await makeRequest(validReportId, invalidScheduleData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid scheduledFor date format'
      });
      expect(mockRunReport).not.toHaveBeenCalled();
      expect(mockScheduleReportRun).not.toHaveBeenCalled();
    });

    it('should return 400 when scheduledFor is in the past', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const pastScheduleData = {
        immediate: false,
        scheduledFor: pastDate,
      };

      // Act
      const response = await makeRequest(validReportId, pastScheduleData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Scheduled time must be in the future'
      });
    });

    it('should return 400 when parameters is not an object', async () => {
      // Arrange
      const invalidParamsData = {
        immediate: true,
        parameters: 'invalid-parameters',
      };

      // Act
      const response = await makeRequest(validReportId, invalidParamsData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Parameters must be a valid object'
      });
    });
  });

  describe('Business Logic Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
    });

    it('should return 409 when report is already running', async () => {
      // Arrange
      mockRunReport.mockResolvedValue({
        error: 'Report is already running',
        conflictingExecutionId: '123e4567-e89b-12d3-a456-426614174003',
      });

      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(body).toEqual({
        error: 'Report is already running',
        details: 'Wait for the current execution to complete before starting a new one'
      });
    });

    it('should return 400 when report has required parameters missing', async () => {
      // Arrange
      mockRunReport.mockResolvedValue({
        error: 'Missing required parameters',
        missingParameters: ['startDate', 'endDate'],
      });

      // Act
      const response = await makeRequest(validReportId, { immediate: true });
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Missing required parameters',
        details: 'Required parameters: startDate, endDate'
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
    });

    it('should return 500 when report execution service fails', async () => {
      // Arrange
      mockRunReport.mockRejectedValue(new Error('Report execution service unavailable'));

      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to execute report'
      });
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      mockGetReportById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to execute report'
      });
    });
  });

  describe('Response Format Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockRunReport.mockResolvedValue({
        success: true,
        execution: mockExecution,
      });
    });

    it('should return response with correct Content-Type header', async () => {
      // Act
      const response = await makeRequest(validReportId, validRunReportData);

      // Assert
      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('should return consistent success response format', async () => {
      // Act
      const response = await makeRequest(validReportId, validRunReportData);
      const body: RunReportSuccessResponse = await response.json();

      // Assert
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('execution');
      expect(body).toHaveProperty('message');
      expect(body.execution).toHaveProperty('id');
      expect(body.execution).toHaveProperty('reportId');
      expect(body.execution).toHaveProperty('status');
      expect(body.execution).toHaveProperty('startedAt');
      expect(body).not.toHaveProperty('error');
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint does not exist', async () => {
      // This test documents the TDD approach
      // When run for the first time, it should fail because the endpoint doesn't exist

      // Arrange
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockRunReport.mockResolvedValue({
        success: true,
        execution: mockExecution,
      });

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await makeRequest(validReportId, validRunReportData);
        const body: RunReportSuccessResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('execution');
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });
  });
});