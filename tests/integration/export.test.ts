/**
 * T027: Integration Tests for User Data Export
 *
 * This test suite validates the complete user data export workflow.
 * Tests the integration between export APIs, data processing, and file generation.
 *
 * Test Scenarios:
 * - Bulk user data export in multiple formats (CSV, Excel, JSON)
 * - Filtered export with custom criteria and date ranges
 * - Large dataset export with pagination and streaming
 * - Export job queuing and progress tracking
 * - Export with data transformation and anonymization
 * - Scheduled export automation
 * - Export history and audit logging
 * - Error handling and retry mechanisms for failed exports
 *
 * Integration Points:
 * - POST /api/admin/export/users
 * - GET /api/admin/export/status/{jobId}
 * - GET /api/admin/export/download/{jobId}
 * - GET /api/admin/export/history
 * - DELETE /api/admin/export/{jobId}
 * - WebSocket for export progress updates
 * - File storage and cleanup
 * - Background job processing
 *
 * This test follows TDD principles and will FAIL initially until the complete
 * export functionality is implemented.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { ExportInterface } from '@/components/export/ExportInterface';
import { ExportHistory } from '@/components/export/ExportHistory';
import { ExportProgress } from '@/components/export/ExportProgress';
import { ExportFilters } from '@/components/export/ExportFilters';

// Mock file operations
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock date picker
jest.mock('react-datepicker', () => ({
  __esModule: true,
  default: ({ selected, onChange, ...props }: any) => (
    <input
      data-testid="date-picker"
      type="date"
      value={selected?.toISOString().split('T')[0] || ''}
      onChange={(e) => onChange(new Date(e.target.value))}
      {...props}
    />
  ),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: jest.fn((key) => {
      const params: Record<string, string> = {
        format: 'csv',
        includeDeleted: 'false',
      };
      return params[key] || null;
    }),
  }),
  usePathname: () => '/admin/export',
}));

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock WebSocket for real-time progress updates
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState: number = WebSocket.CONNECTING;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send = jest.fn();
  close = jest.fn();
}

// @ts-ignore
global.WebSocket = MockWebSocket;

// Mock notifications
const mockNotify = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('@/lib/notifications', () => ({
  notify: mockNotify,
}));

// Test data
const mockExportJob = {
  id: 'export-job-123',
  status: 'pending',
  format: 'csv',
  filters: {
    dateRange: { start: '2024-01-01', end: '2024-01-31' },
    userTypes: ['active', 'premium'],
    includeDeleted: false,
  },
  totalRecords: 15420,
  processedRecords: 0,
  createdAt: '2024-01-01T10:00:00.000Z',
  estimatedCompletion: '2024-01-01T10:05:00.000Z',
};

const mockExportHistory = [
  {
    id: 'export-job-120',
    status: 'completed',
    format: 'csv',
    recordCount: 12500,
    fileSize: '2.4 MB',
    createdAt: '2023-12-28T14:30:00.000Z',
    completedAt: '2023-12-28T14:33:15.000Z',
    downloadUrl: '/api/admin/export/download/export-job-120',
    expiresAt: '2024-01-04T14:33:15.000Z',
  },
  {
    id: 'export-job-119',
    status: 'failed',
    format: 'xlsx',
    recordCount: 0,
    error: 'Memory limit exceeded',
    createdAt: '2023-12-27T09:15:00.000Z',
    failedAt: '2023-12-27T09:18:22.000Z',
  },
  {
    id: 'export-job-118',
    status: 'completed',
    format: 'json',
    recordCount: 8900,
    fileSize: '18.7 MB',
    createdAt: '2023-12-25T16:45:00.000Z',
    completedAt: '2023-12-25T16:52:08.000Z',
    downloadUrl: '/api/admin/export/download/export-job-118',
    expiresAt: '2024-01-01T16:52:08.000Z',
  },
];

const mockUserData = [
  {
    id: 'user-001',
    email: 'user1@example.com',
    name: 'John Doe',
    createdAt: '2023-06-15T08:30:00.000Z',
    status: 'active',
    userType: 'premium',
  },
  {
    id: 'user-002',
    email: 'user2@example.com',
    name: 'Jane Smith',
    createdAt: '2023-07-22T14:15:00.000Z',
    status: 'active',
    userType: 'free',
  },
];

describe('T027: User Data Export - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPush.mockClear();
    Object.values(mockNotify).forEach(fn => fn.mockClear());
  });

  describe('Export Interface and Job Creation', () => {
    it('should create export job with specified format and filters', async () => {
      // This test will FAIL until export job creation is implemented

      // Setup: Mock export job creation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockExportJob }),
      });

      const user = userEvent.setup();
      render(<ExportInterface />);

      // Assert: Export form loads
      expect(screen.getByText(/export user data/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/export format/i)).toBeInTheDocument();

      // Act: Select export format
      const formatSelector = screen.getByLabelText(/export format/i);
      await user.selectOptions(formatSelector, 'csv');

      // Act: Configure filters
      const includeDeletedCheckbox = screen.getByLabelText(/include deleted users/i);
      await user.click(includeDeletedCheckbox);

      const userTypeSelector = screen.getByLabelText(/user types/i);
      await user.selectOptions(userTypeSelector, ['active', 'premium']);

      // Act: Set date range
      const startDatePicker = screen.getByLabelText(/start date/i);
      const endDatePicker = screen.getByLabelText(/end date/i);

      await user.type(startDatePicker, '2024-01-01');
      await user.type(endDatePicker, '2024-01-31');

      // Act: Start export
      const startExportButton = screen.getByRole('button', { name: /start export/i });
      await user.click(startExportButton);

      // Assert: Export job creation API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/export/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          },
          body: JSON.stringify({
            format: 'csv',
            filters: {
              dateRange: { start: '2024-01-01', end: '2024-01-31' },
              userTypes: ['active', 'premium'],
              includeDeleted: true,
            },
            options: {
              includeHeaders: true,
              anonymizeEmails: false,
            },
          }),
        });
      });

      // Assert: Job created notification
      await waitFor(() => {
        expect(mockNotify.info).toHaveBeenCalledWith(
          'Export job created successfully. You will be notified when it completes.'
        );
      });

      // Assert: Progress tracking starts
      expect(screen.getByTestId('export-progress-tracker')).toBeInTheDocument();
      expect(screen.getByText(/job id: export-job-123/i)).toBeInTheDocument();
    });

    it('should validate export parameters and show appropriate errors', async () => {
      // This test will FAIL until validation is implemented

      const user = userEvent.setup();
      render(<ExportInterface />);

      // Act: Try to start export without selecting format
      const startExportButton = screen.getByRole('button', { name: /start export/i });
      await user.click(startExportButton);

      // Assert: Validation error displayed
      expect(screen.getByText(/please select an export format/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();

      // Act: Select format but invalid date range
      const formatSelector = screen.getByLabelText(/export format/i);
      await user.selectOptions(formatSelector, 'csv');

      const startDatePicker = screen.getByLabelText(/start date/i);
      const endDatePicker = screen.getByLabelText(/end date/i);

      await user.type(startDatePicker, '2024-01-31');
      await user.type(endDatePicker, '2024-01-01'); // End before start

      await user.click(startExportButton);

      // Assert: Date validation error
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should support advanced export options and data transformation', async () => {
      // This test will FAIL until advanced options are implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockExportJob, id: 'export-job-124' } }),
      });

      const user = userEvent.setup();
      render(<ExportInterface />);

      // Act: Expand advanced options
      const advancedToggle = screen.getByRole('button', { name: /advanced options/i });
      await user.click(advancedToggle);

      // Assert: Advanced options revealed
      expect(screen.getByLabelText(/anonymize email addresses/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/include profile pictures/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data compression/i)).toBeInTheDocument();

      // Act: Configure advanced options
      await user.click(screen.getByLabelText(/anonymize email addresses/i));
      await user.click(screen.getByLabelText(/include profile pictures/i));
      await user.selectOptions(screen.getByLabelText(/data compression/i), 'gzip');

      // Act: Select custom field mapping
      const customFieldsToggle = screen.getByRole('button', { name: /custom field mapping/i });
      await user.click(customFieldsToggle);

      const fieldMappings = screen.getByTestId('field-mappings');
      const emailField = within(fieldMappings).getByLabelText(/email field name/i);
      await user.clear(emailField);
      await user.type(emailField, 'user_email');

      // Act: Set export format to Excel with multiple sheets
      await user.selectOptions(screen.getByLabelText(/export format/i), 'xlsx');
      await user.click(screen.getByLabelText(/split into multiple sheets/i));

      // Act: Start export
      await user.click(screen.getByRole('button', { name: /start export/i }));

      // Assert: Advanced options sent in API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/export/users', {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            format: 'xlsx',
            filters: expect.any(Object),
            options: {
              includeHeaders: true,
              anonymizeEmails: true,
              includeProfilePictures: true,
              compression: 'gzip',
              multipleSheets: true,
              fieldMappings: {
                email: 'user_email',
              },
            },
          }),
        });
      });
    });
  });

  describe('Export Progress Tracking and Real-time Updates', () => {
    it('should track export progress with real-time updates via WebSocket', async () => {
      // This test will FAIL until progress tracking is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockExportJob }),
      });

      render(<ExportProgress jobId="export-job-123" />);

      // Assert: Initial progress state
      expect(screen.getByText(/export in progress/i)).toBeInTheDocument();
      expect(screen.getByText(/0 of 15,420 records processed/i)).toBeInTheDocument();

      // Assert: WebSocket connection established
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/ws/admin/export/export-job-123')
        );
      });

      // Simulate WebSocket progress updates
      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/export/export-job-123');

      // First progress update
      const progressUpdate1 = {
        type: 'export_progress',
        jobId: 'export-job-123',
        processedRecords: 5000,
        totalRecords: 15420,
        status: 'processing',
        estimatedCompletion: '2024-01-01T10:03:30.000Z',
      };

      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(progressUpdate1),
        }));
      }

      // Assert: Progress updated
      await waitFor(() => {
        expect(screen.getByText(/5,000 of 15,420 records processed/i)).toBeInTheDocument();
        expect(screen.getByText(/32% complete/i)).toBeInTheDocument();
      });

      // Final completion update
      const completionUpdate = {
        type: 'export_complete',
        jobId: 'export-job-123',
        status: 'completed',
        downloadUrl: '/api/admin/export/download/export-job-123',
        fileSize: '3.2 MB',
        recordCount: 15420,
      };

      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(completionUpdate),
        }));
      }

      // Assert: Completion state
      await waitFor(() => {
        expect(screen.getByText(/export completed successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/15,420 records exported/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download file/i })).toBeInTheDocument();
      });
    });

    it('should handle export failures with detailed error information', async () => {
      // This test will FAIL until error handling is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockExportJob }),
      });

      render(<ExportProgress jobId="export-job-123" />);

      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/export/export-job-123');

      // Simulate export failure
      const failureUpdate = {
        type: 'export_failed',
        jobId: 'export-job-123',
        status: 'failed',
        error: {
          code: 'MEMORY_LIMIT_EXCEEDED',
          message: 'Export file size exceeds maximum allowed limit (500MB)',
          suggestion: 'Try reducing the date range or applying additional filters',
        },
        processedRecords: 8500,
        totalRecords: 15420,
      };

      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(failureUpdate),
        }));
      }

      // Assert: Failure state displayed
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
        expect(screen.getByText(/memory limit exceeded/i)).toBeInTheDocument();
        expect(screen.getByText(/try reducing the date range/i)).toBeInTheDocument();
      });

      // Assert: Retry options available
      expect(screen.getByRole('button', { name: /retry with smaller dataset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();

      // Assert: Partial progress shown
      expect(screen.getByText(/8,500 of 15,420 records processed before failure/i)).toBeInTheDocument();
    });

    it('should support export job cancellation during processing', async () => {
      // This test will FAIL until job cancellation is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { ...mockExportJob, status: 'processing' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Export job cancelled' }),
        });

      const user = userEvent.setup();
      render(<ExportProgress jobId="export-job-123" />);

      // Assert: Cancel button available during processing
      expect(screen.getByRole('button', { name: /cancel export/i })).toBeInTheDocument();

      // Act: Cancel the export
      await user.click(screen.getByRole('button', { name: /cancel export/i }));

      // Assert: Confirmation dialog
      expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /yes, cancel export/i }));

      // Assert: Cancellation API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/export/export-job-123/cancel',
          { method: 'POST', headers: expect.any(Object) }
        );
      });

      // Assert: Cancellation state
      await waitFor(() => {
        expect(screen.getByText(/export cancelled/i)).toBeInTheDocument();
        expect(mockNotify.info).toHaveBeenCalledWith('Export job cancelled successfully');
      });
    });
  });

  describe('File Download and Management', () => {
    it('should handle file download with proper security headers', async () => {
      // This test will FAIL until secure download is implemented

      const mockBlob = new Blob(['mock-csv-data'], { type: 'text/csv' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="user_export_2024-01-01.csv"',
          'Content-Type': 'text/csv',
          'Content-Length': '1024',
        }),
      });

      const user = userEvent.setup();
      render(<ExportInterface />);

      // Simulate completed export
      const downloadButton = screen.getByRole('button', { name: /download completed export/i });
      await user.click(downloadButton);

      // Assert: Download API called with proper authentication
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/export/download/export-job-123',
          {
            method: 'GET',
            headers: {
              'Authorization': expect.stringContaining('Bearer'),
            },
          }
        );
      });

      // Assert: File download triggered
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);

      // Assert: Download analytics tracked
      expect(screen.getByTestId('download-analytics')).toBeInTheDocument();
    });

    it('should automatically clean up expired export files', async () => {
      // This test will FAIL until file cleanup is implemented

      const expiredExport = {
        ...mockExportHistory[0],
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
        status: 'expired',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [expiredExport, ...mockExportHistory.slice(1)] }),
      });

      render(<ExportHistory />);

      // Assert: Expired export marked as such
      await waitFor(() => {
        expect(screen.getByText(/expired/i)).toBeInTheDocument();
        expect(screen.getByText(/file no longer available/i)).toBeInTheDocument();
      });

      // Assert: Download button disabled for expired exports
      const expiredRow = screen.getByTestId(`export-row-${expiredExport.id}`);
      const downloadButton = within(expiredRow).getByRole('button', { name: /download/i });
      expect(downloadButton).toBeDisabled();

      // Assert: Cleanup suggestion shown
      expect(screen.getByText(/expired files are automatically removed/i)).toBeInTheDocument();
    });

    it('should support bulk download of multiple export files', async () => {
      // This test will FAIL until bulk download is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockExportHistory }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            downloadUrl: '/api/admin/export/bulk-download/bulk-123',
            jobId: 'bulk-123',
            fileCount: 2,
            totalSize: '21.1 MB',
          }),
        });

      const user = userEvent.setup();
      render(<ExportHistory />);

      await waitFor(() => {
        expect(screen.getByText(/export history/i)).toBeInTheDocument();
      });

      // Act: Select multiple completed exports
      const completedExports = screen.getAllByTestId(/export-row-export-job-1(18|20)/);

      for (const exportRow of completedExports) {
        const checkbox = within(exportRow).getByRole('checkbox');
        await user.click(checkbox);
      }

      // Act: Initiate bulk download
      const bulkDownloadButton = screen.getByRole('button', { name: /download selected/i });
      await user.click(bulkDownloadButton);

      // Assert: Bulk download API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/export/bulk-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportIds: ['export-job-120', 'export-job-118'],
          }),
        });
      });

      // Assert: Bulk download progress shown
      expect(screen.getByText(/preparing bulk download/i)).toBeInTheDocument();
      expect(screen.getByText(/2 files, 21.1 mb total/i)).toBeInTheDocument();
    });
  });

  describe('Export History and Audit Trail', () => {
    it('should display comprehensive export history with filtering', async () => {
      // This test will FAIL until export history is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockExportHistory, totalCount: 25, page: 1, pageSize: 10 }),
      });

      const user = userEvent.setup();
      render(<ExportHistory />);

      // Assert: Export history loads
      await waitFor(() => {
        expect(screen.getByText(/export history/i)).toBeInTheDocument();
        expect(screen.getByText(/25 total exports/i)).toBeInTheDocument();
      });

      // Assert: History entries displayed
      expect(screen.getByText(/export-job-120/i)).toBeInTheDocument();
      expect(screen.getByText(/12,500 records/i)).toBeInTheDocument();
      expect(screen.getByText(/2.4 MB/i)).toBeInTheDocument();
      expect(screen.getByTestId('status-completed')).toBeInTheDocument();

      // Assert: Failed export shown with error
      expect(screen.getByText(/export-job-119/i)).toBeInTheDocument();
      expect(screen.getByTestId('status-failed')).toBeInTheDocument();
      expect(screen.getByText(/memory limit exceeded/i)).toBeInTheDocument();

      // Act: Filter by status
      const statusFilter = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(statusFilter, 'completed');

      // Assert: Filtered API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/export/history?status=completed&page=1&pageSize=10',
          expect.any(Object)
        );
      });
    });

    it('should provide detailed audit information for each export', async () => {
      // This test will FAIL until audit details are implemented

      const detailedExport = {
        ...mockExportHistory[0],
        auditInfo: {
          initiatedBy: {
            id: 'admin-001',
            name: 'Admin User',
            email: 'admin@vownow.com',
          },
          filters: {
            dateRange: { start: '2023-12-01', end: '2023-12-31' },
            userTypes: ['active', 'premium'],
            totalFiltered: 12500,
          },
          processing: {
            startTime: '2023-12-28T14:30:00.000Z',
            endTime: '2023-12-28T14:33:15.000Z',
            duration: '3m 15s',
            serverUsed: 'export-worker-02',
          },
          dataClassification: {
            containsPII: true,
            containsFinancial: false,
            complianceFlags: ['GDPR'],
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [detailedExport] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: detailedExport }),
        });

      const user = userEvent.setup();
      render(<ExportHistory />);

      await waitFor(() => {
        expect(screen.getByText(/export-job-120/i)).toBeInTheDocument();
      });

      // Act: View export details
      const detailsButton = screen.getByRole('button', { name: /view details/i });
      await user.click(detailsButton);

      // Assert: Audit information displayed
      await waitFor(() => {
        expect(screen.getByText(/export details/i)).toBeInTheDocument();
        expect(screen.getByText(/initiated by: admin user/i)).toBeInTheDocument();
        expect(screen.getByText(/processing time: 3m 15s/i)).toBeInTheDocument();
        expect(screen.getByText(/server: export-worker-02/i)).toBeInTheDocument();
        expect(screen.getByText(/contains pii: yes/i)).toBeInTheDocument();
        expect(screen.getByText(/compliance: gdpr/i)).toBeInTheDocument();
      });

      // Assert: Filter details shown
      expect(screen.getByText(/date range: dec 1 - dec 31, 2023/i)).toBeInTheDocument();
      expect(screen.getByText(/user types: active, premium/i)).toBeInTheDocument();
    });

    it('should support export history search and pagination', async () => {
      // This test will FAIL until search and pagination are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockExportHistory, totalCount: 125, page: 1, pageSize: 10 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [mockExportHistory[0]],
            totalCount: 1,
            page: 1,
            pageSize: 10
          }),
        });

      const user = userEvent.setup();
      render(<ExportHistory />);

      await waitFor(() => {
        expect(screen.getByText(/125 total exports/i)).toBeInTheDocument();
      });

      // Assert: Pagination controls
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByText(/page 1 of 13/i)).toBeInTheDocument();

      // Act: Search exports
      const searchInput = screen.getByPlaceholderText(/search exports/i);
      await user.type(searchInput, 'export-job-120');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Assert: Search API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/export/history?search=export-job-120&page=1&pageSize=10',
          expect.any(Object)
        );
      });

      // Assert: Search results
      expect(screen.getByText(/1 total exports/i)).toBeInTheDocument();
      expect(screen.getByText(/export-job-120/i)).toBeInTheDocument();
    });
  });

  describe('Scheduled Exports and Automation', () => {
    it('should create and manage scheduled export jobs', async () => {
      // This test will FAIL until scheduled exports are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              scheduleId: 'schedule-001',
              name: 'Monthly Active Users Export',
              frequency: 'monthly',
              nextRun: '2024-02-01T09:00:00.000Z',
              lastRun: '2024-01-01T09:00:00.000Z',
              status: 'active',
            }
          }),
        });

      const user = userEvent.setup();
      render(<ExportInterface />);

      // Act: Switch to scheduled exports tab
      const scheduledTab = screen.getByRole('tab', { name: /scheduled exports/i });
      await user.click(scheduledTab);

      // Assert: Schedule creation form
      expect(screen.getByText(/create scheduled export/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/schedule name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();

      // Act: Configure scheduled export
      await user.type(screen.getByLabelText(/schedule name/i), 'Monthly Active Users Export');
      await user.selectOptions(screen.getByLabelText(/frequency/i), 'monthly');
      await user.selectOptions(screen.getByLabelText(/export format/i), 'csv');

      // Set run time
      const runTimeInput = screen.getByLabelText(/run time/i);
      await user.type(runTimeInput, '09:00');

      // Act: Create schedule
      const createScheduleButton = screen.getByRole('button', { name: /create schedule/i });
      await user.click(createScheduleButton);

      // Assert: Schedule creation API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/export/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Monthly Active Users Export',
            frequency: 'monthly',
            runTime: '09:00',
            format: 'csv',
            filters: expect.any(Object),
          }),
        });
      });

      // Assert: Schedule created confirmation
      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalledWith('Scheduled export created successfully');
        expect(screen.getByText(/next run: feb 1, 2024 at 9:00 am/i)).toBeInTheDocument();
      });
    });

    it('should handle scheduled export execution and notifications', async () => {
      // This test will FAIL until scheduled execution is implemented

      const scheduledExportRun = {
        scheduleId: 'schedule-001',
        executionId: 'execution-001',
        status: 'completed',
        recordCount: 8950,
        fileSize: '2.1 MB',
        downloadUrl: '/api/admin/export/download/execution-001',
        executedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: scheduledExportRun }),
      });

      render(<ExportHistory showScheduled />);

      // Simulate WebSocket notification for completed scheduled export
      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/export/scheduled');

      const scheduledCompleteNotification = {
        type: 'scheduled_export_complete',
        data: scheduledExportRun,
      };

      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(scheduledCompleteNotification),
        }));
      }

      // Assert: Scheduled export completion notification
      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalledWith(
          'Scheduled export "Monthly Active Users Export" completed successfully'
        );
      });

      // Assert: New export appears in history
      expect(screen.getByText(/execution-001/i)).toBeInTheDocument();
      expect(screen.getByText(/8,950 records/i)).toBeInTheDocument();
      expect(screen.getByTestId('scheduled-export-badge')).toBeInTheDocument();
    });
  });

  describe('Performance and Large Dataset Handling', () => {
    it('should handle large dataset exports with streaming and pagination', async () => {
      // This test will FAIL until streaming export is implemented

      const largeExportJob = {
        ...mockExportJob,
        id: 'large-export-456',
        totalRecords: 1000000, // 1 million records
        estimatedSize: '250 MB',
        processingMethod: 'streaming',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: largeExportJob }),
      });

      const user = userEvent.setup();
      render(<ExportInterface />);

      // Act: Select large date range (triggers large dataset warning)
      const startDatePicker = screen.getByLabelText(/start date/i);
      const endDatePicker = screen.getByLabelText(/end date/i);

      await user.type(startDatePicker, '2020-01-01');
      await user.type(endDatePicker, '2024-01-31');

      // Assert: Large dataset warning
      await waitFor(() => {
        expect(screen.getByText(/large dataset detected/i)).toBeInTheDocument();
        expect(screen.getByText(/estimated 1,000,000 records/i)).toBeInTheDocument();
        expect(screen.getByText(/streaming export recommended/i)).toBeInTheDocument();
      });

      // Act: Confirm large export
      const confirmLargeExport = screen.getByRole('button', { name: /proceed with streaming export/i });
      await user.click(confirmLargeExport);

      // Assert: Streaming export options
      expect(screen.getByLabelText(/chunk size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/compression level/i)).toBeInTheDocument();

      // Act: Start large export
      await user.click(screen.getByRole('button', { name: /start large export/i }));

      // Assert: Streaming export API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/export/users', {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            format: 'csv',
            filters: expect.any(Object),
            options: {
              streaming: true,
              chunkSize: 10000,
              compression: 'gzip',
            },
          }),
        });
      });
    });

    it('should optimize export performance with database query optimization', async () => {
      // This test will FAIL until query optimization is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockExportJob,
            optimization: {
              indexesUsed: ['idx_users_created_at', 'idx_users_status'],
              queryPlan: 'optimized_range_scan',
              estimatedPerformance: 'fast',
            },
          }
        }),
      });

      const user = userEvent.setup();
      render(<ExportInterface />);

      // Act: Configure export with optimizable filters
      await user.selectOptions(screen.getByLabelText(/user status/i), 'active');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      await user.type(screen.getByLabelText(/end date/i), '2024-01-31');

      // Act: Check query optimization
      const optimizeButton = screen.getByRole('button', { name: /optimize query/i });
      await user.click(optimizeButton);

      // Assert: Query optimization info displayed
      await waitFor(() => {
        expect(screen.getByText(/query optimization: fast/i)).toBeInTheDocument();
        expect(screen.getByText(/indexes used: 2/i)).toBeInTheDocument();
        expect(screen.getByText(/estimated export time: 2-3 minutes/i)).toBeInTheDocument();
      });

      // Act: Start optimized export
      await user.click(screen.getByRole('button', { name: /start optimized export/i }));

      // Assert: Optimized export parameters sent
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/export/users', {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            format: 'csv',
            filters: expect.any(Object),
            options: {
              useOptimizedQuery: true,
              indexHints: ['idx_users_created_at', 'idx_users_status'],
            },
          }),
        });
      });
    });
  });
});