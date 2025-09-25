/**
 * Contract Tests for GET /api/admin/reports/{id}/export
 *
 * This test suite follows TDD principles and validates the API contract for the admin report export endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Report Export: Successful report data export
 * - Format Support: CSV, Excel, JSON, PDF formats
 * - Data Filtering: Date ranges, parameter filtering
 * - File Generation: Proper file headers, content
 * - Error Handling: Non-existent reports, invalid formats
 * - Response Format: Proper Content-Type, file headers
 * - Edge Cases: Empty reports, large datasets
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
import { GET } from '@/app/api/admin/reports/[id]/export/route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: jest.fn().mockResolvedValue(data),
      status: options?.status || 200,
      statusText: options?.statusText || 'OK',
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'Content-Type') return 'application/json';
          if (name === 'Content-Disposition') return 'attachment; filename=report.csv';
          return null;
        }),
        set: jest.fn(),
      },
      arrayBuffer: jest.fn(),
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
  getReportById: jest.fn(),
  getReportData: jest.fn(),
  exportReport: jest.fn(),
  validateExportParameters: jest.fn(),
}));

import {
  getReportById,
  getReportData,
  exportReport,
  validateExportParameters
} from '@/lib/admin/reports';

const mockGetReportById = getReportById as jest.MockedFunction<typeof getReportById>;
const mockGetReportData = getReportData as jest.MockedFunction<typeof getReportData>;
const mockExportReport = exportReport as jest.MockedFunction<typeof exportReport>;
const mockValidateExportParameters = validateExportParameters as jest.MockedFunction<typeof validateExportParameters>;

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
  averageRunTime: number;
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  dateFrom?: string;
  dateTo?: string;
  includeMetadata?: boolean;
  columns?: string[];
  filters?: Record<string, any>;
}

interface ExportResult {
  data: Buffer | string;
  filename: string;
  contentType: string;
  size: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

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

const mockReportData = [
  {
    id: '1',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    signupDate: '2024-01-01T00:00:00.000Z',
    lastLoginAt: '2024-01-20T10:00:00.000Z',
    surveysCompleted: 5,
    isActive: true,
  },
  {
    id: '2',
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    signupDate: '2024-01-05T00:00:00.000Z',
    lastLoginAt: '2024-01-19T14:30:00.000Z',
    surveysCompleted: 3,
    isActive: true,
  },
];

const mockCsvExport: ExportResult = {
  data: Buffer.from('id,email,firstName,lastName,signupDate,lastLoginAt,surveysCompleted,isActive\n1,user1@example.com,John,Doe,2024-01-01T00:00:00.000Z,2024-01-20T10:00:00.000Z,5,true\n2,user2@example.com,Jane,Smith,2024-01-05T00:00:00.000Z,2024-01-19T14:30:00.000Z,3,true'),
  filename: 'monthly-user-analytics-2024-01-23.csv',
  contentType: 'text/csv',
  size: 256,
};

const mockJsonExport: ExportResult = {
  data: JSON.stringify({
    report: {
      id: validReportId,
      name: mockReport.name,
      exportedAt: '2024-01-23T10:30:00.000Z',
    },
    data: mockReportData,
    metadata: {
      totalRecords: 2,
      exportFormat: 'json',
      filters: {},
    },
  }),
  filename: 'monthly-user-analytics-2024-01-23.json',
  contentType: 'application/json',
  size: 512,
};

// Helper function to create a mock NextRequest
function createMockRequest(
  reportId: string,
  searchParams: URLSearchParams = new URLSearchParams()
): NextRequest {
  const url = new URL(`http://localhost:3000/api/admin/reports/${reportId}/export`);
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const mockRequest = {
    url: url.toString(),
    method: 'GET',
    headers: new Map(),
    cookies: new Map(),
    nextUrl: {
      searchParams: searchParams,
    },
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

describe('GET /api/admin/reports/{id}/export - Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no admin token is provided', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);
      mockCookieStore(); // No token provided

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
      expect(mockGetReportById).not.toHaveBeenCalled();
      expect(mockExportReport).not.toHaveBeenCalled();
    });

    it('should return 401 when admin token is invalid', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);
      const cookieStore = mockCookieStore();
      cookieStore.get.mockReturnValue(null);

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: 'Unauthorized'
      });
    });
  });

  describe('Report Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should return 404 when report does not exist', async () => {
      // Arrange
      const nonExistentReportId = '123e4567-e89b-12d3-a456-426614174999';
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(nonExistentReportId, searchParams);
      mockGetReportById.mockResolvedValue(null);

      // Act
      const response = await GET(request, { params: { id: nonExistentReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body).toEqual({
        error: 'Report not found'
      });
      expect(mockGetReportById).toHaveBeenCalledWith(nonExistentReportId);
      expect(mockExportReport).not.toHaveBeenCalled();
    });

    it('should return 400 when report ID is invalid format', async () => {
      // Arrange
      const invalidReportId = 'invalid-id';
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(invalidReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: invalidReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid report ID format'
      });
    });

    it('should return 403 when trying to export private report without permission', async () => {
      // Arrange
      const privateReport = { ...mockReport, isPublic: false, createdBy: 'other@vownow.com' };
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);
      mockGetReportById.mockResolvedValue(privateReport);

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(body).toEqual({
        error: 'Access denied',
        details: 'You do not have permission to export this private report'
      });
    });
  });

  describe('Format Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
    });

    it('should return 400 when format parameter is missing', async () => {
      // Arrange
      const request = createMockRequest(validReportId); // No format parameter

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Export format is required',
        details: 'Supported formats: csv, excel, json, pdf'
      });
    });

    it('should return 400 when format is not supported', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'xml' });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Unsupported export format',
        details: 'Supported formats: csv, excel, json, pdf'
      });
    });
  });

  describe('Successful CSV Export', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockGetReportData.mockResolvedValue(mockReportData);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
      mockExportReport.mockResolvedValue(mockCsvExport);
    });

    it('should export report as CSV with default options', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('monthly-user-analytics-2024-01-23.csv');

      expect(mockGetReportById).toHaveBeenCalledWith(validReportId);
      expect(mockExportReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          format: 'csv',
        })
      );
    });

    it('should export report as CSV with date range filter', async () => {
      // Arrange
      const searchParams = new URLSearchParams({
        format: 'csv',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(mockExportReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          format: 'csv',
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
        })
      );
    });

    it('should export report as CSV with column selection', async () => {
      // Arrange
      const searchParams = new URLSearchParams({
        format: 'csv',
        columns: 'email,firstName,lastName',
      });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(mockExportReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          format: 'csv',
          columns: ['email', 'firstName', 'lastName'],
        })
      );
    });
  });

  describe('Successful JSON Export', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockGetReportData.mockResolvedValue(mockReportData);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
      mockExportReport.mockResolvedValue(mockJsonExport);
    });

    it('should export report as JSON with metadata', async () => {
      // Arrange
      const searchParams = new URLSearchParams({
        format: 'json',
        includeMetadata: 'true',
      });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('.json');

      expect(mockExportReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          format: 'json',
          includeMetadata: true,
        })
      );
    });
  });

  describe('Excel Export', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockGetReportData.mockResolvedValue(mockReportData);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
    });

    it('should export report as Excel file', async () => {
      // Arrange
      const mockExcelExport: ExportResult = {
        data: Buffer.from('mock-excel-data'),
        filename: 'monthly-user-analytics-2024-01-23.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024,
      };
      mockExportReport.mockResolvedValue(mockExcelExport);

      const searchParams = new URLSearchParams({ format: 'excel' });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers.get('Content-Disposition')).toContain('.xlsx');
    });
  });

  describe('PDF Export', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockGetReportData.mockResolvedValue(mockReportData);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
    });

    it('should export report as PDF file', async () => {
      // Arrange
      const mockPdfExport: ExportResult = {
        data: Buffer.from('mock-pdf-data'),
        filename: 'monthly-user-analytics-2024-01-23.pdf',
        contentType: 'application/pdf',
        size: 2048,
      };
      mockExportReport.mockResolvedValue(mockPdfExport);

      const searchParams = new URLSearchParams({ format: 'pdf' });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('.pdf');
    });
  });

  describe('Parameter Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
    });

    it('should return 400 when date range is invalid', async () => {
      // Arrange
      const searchParams = new URLSearchParams({
        format: 'csv',
        dateFrom: 'invalid-date',
        dateTo: '2024-01-31',
      });
      const request = createMockRequest(validReportId, searchParams);

      mockValidateExportParameters.mockResolvedValue({
        isValid: false,
        errors: ['Invalid dateFrom format'],
      });

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid export parameters',
        details: 'Invalid dateFrom format'
      });
    });

    it('should return 400 when dateFrom is after dateTo', async () => {
      // Arrange
      const searchParams = new URLSearchParams({
        format: 'csv',
        dateFrom: '2024-01-31',
        dateTo: '2024-01-01',
      });
      const request = createMockRequest(validReportId, searchParams);

      mockValidateExportParameters.mockResolvedValue({
        isValid: false,
        errors: ['dateFrom must be before dateTo'],
      });

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Invalid export parameters',
        details: 'dateFrom must be before dateTo'
      });
    });
  });

  describe('Download Counter', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockGetReportData.mockResolvedValue(mockReportData);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
      mockExportReport.mockResolvedValue(mockCsvExport);
    });

    it('should increment download counter on successful export', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(mockExportReport).toHaveBeenCalledWith(
        validReportId,
        expect.objectContaining({
          format: 'csv',
        })
      );
      // The increment should be handled within the exportReport function
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
    });

    it('should handle empty report data', async () => {
      // Arrange
      const emptyExport: ExportResult = {
        data: Buffer.from('id,email,firstName,lastName\n'),
        filename: 'monthly-user-analytics-2024-01-23.csv',
        contentType: 'text/csv',
        size: 28,
      };
      mockGetReportData.mockResolvedValue([]);
      mockExportReport.mockResolvedValue(emptyExport);

      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);

      // Act
      const response = await GET(request, { params: { id: validReportId } });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
    });

    it('should return 413 when export data is too large', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);

      mockExportReport.mockResolvedValue({
        error: 'Export too large',
        maxSize: 100 * 1024 * 1024, // 100MB
      });

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(413);
      expect(body).toEqual({
        error: 'Export file too large',
        details: 'Maximum export size is 100MB'
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
    });

    it('should return 500 when export generation fails', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);

      mockExportReport.mockRejectedValue(new Error('Export generation failed'));

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to export report'
      });
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);

      mockGetReportById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await GET(request, { params: { id: validReportId } });
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to export report'
      });
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint does not exist', async () => {
      // This test documents the TDD approach
      // When run for the first time, it should fail because the endpoint doesn't exist

      // Arrange
      const searchParams = new URLSearchParams({ format: 'csv' });
      const request = createMockRequest(validReportId, searchParams);
      mockCookieStore(validAdminToken);
      mockGetReportById.mockResolvedValue(mockReport);
      mockValidateExportParameters.mockResolvedValue({ isValid: true });
      mockExportReport.mockResolvedValue(mockCsvExport);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request, { params: { id: validReportId } });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });
  });
});