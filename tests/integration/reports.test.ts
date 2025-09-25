/**
 * T028: Integration Tests for Custom Report Generation
 *
 * This test suite validates the complete custom report generation workflow.
 * Tests the integration between report builder, data aggregation, and output generation.
 *
 * Test Scenarios:
 * - Visual report builder with drag-and-drop interface
 * - Custom query builder with advanced filters
 * - Multi-data source report aggregation
 * - Report template creation and management
 * - Scheduled report automation
 * - Interactive report viewing and drilling
 * - Report sharing and collaboration
 * - Performance optimization for complex reports
 *
 * Integration Points:
 * - POST /api/admin/reports/create
 * - GET /api/admin/reports/{reportId}/run
 * - POST /api/admin/reports/{reportId}/schedule
 * - GET /api/admin/reports/templates
 * - POST /api/admin/reports/{reportId}/share
 * - WebSocket for report generation progress
 * - Database query optimization
 * - Chart rendering and PDF generation
 *
 * This test follows TDD principles and will FAIL initially until the complete
 * report generation functionality is implemented.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { ReportTemplates } from '@/components/reports/ReportTemplates';
import { QueryBuilder } from '@/components/reports/QueryBuilder';

// Mock drag and drop
const mockDragEvent = {
  dataTransfer: {
    getData: jest.fn(),
    setData: jest.fn(),
    effectAllowed: 'move',
  },
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
};

// Mock Chart.js for report visualizations
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="report-bar-chart" data-chart-data={JSON.stringify(data)}>
      Report Bar Chart
    </div>
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="report-line-chart" data-chart-data={JSON.stringify(data)}>
      Report Line Chart
    </div>
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="report-pie-chart" data-chart-data={JSON.stringify(data)}>
      Report Pie Chart
    </div>
  ),
}));

// Mock PDF generation
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    addImage: jest.fn(),
    setFontSize: jest.fn(),
  }));
});

// Mock HTML to Canvas for PDF generation
jest.mock('html2canvas', () => {
  return jest.fn().mockImplementation(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock-image-data',
  }));
});

// Mock React DnD
jest.mock('react-dnd', () => ({
  useDrag: () => [{}, jest.fn(), jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
  DndProvider: ({ children }: any) => children,
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: jest.fn(),
}));

// Mock SQL parser/formatter
jest.mock('sql-formatter', () => ({
  format: (sql: string) => sql.toUpperCase().replace(/\s+/g, ' ').trim(),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: jest.fn((key) => {
      const params: Record<string, string> = {
        template: 'user_analytics',
        reportId: 'report-123',
      };
      return params[key] || null;
    }),
  }),
  usePathname: () => '/admin/reports',
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

// Test data
const mockReportDefinition = {
  id: 'report-123',
  name: 'User Analytics Report',
  description: 'Comprehensive analysis of user behavior and demographics',
  dataSources: [
    { id: 'users', name: 'Users', table: 'users' },
    { id: 'sessions', name: 'User Sessions', table: 'user_sessions' },
    { id: 'votes', name: 'Votes', table: 'votes' },
  ],
  sections: [
    {
      id: 'overview',
      type: 'metrics',
      title: 'Overview Metrics',
      metrics: [
        { field: 'users.count', label: 'Total Users', aggregation: 'count' },
        { field: 'sessions.avg_duration', label: 'Avg Session Duration', aggregation: 'avg' },
      ],
    },
    {
      id: 'growth',
      type: 'chart',
      title: 'User Growth Over Time',
      chartType: 'line',
      xAxis: 'users.created_at',
      yAxis: 'users.count',
      groupBy: 'month',
    },
    {
      id: 'demographics',
      type: 'chart',
      title: 'User Demographics',
      chartType: 'pie',
      field: 'users.age_group',
      aggregation: 'count',
    },
  ],
  filters: [
    { field: 'users.created_at', operator: 'between', values: ['2024-01-01', '2024-01-31'] },
    { field: 'users.status', operator: 'in', values: ['active', 'premium'] },
  ],
};

const mockReportData = {
  overview: {
    totalUsers: 15420,
    avgSessionDuration: 18.5,
  },
  growth: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Users',
      data: [1200, 1900, 3000, 2500, 2200, 2800],
    }],
  },
  demographics: {
    labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
    datasets: [{
      data: [2500, 4200, 3800, 2100, 800],
    }],
  },
};

const mockReportTemplates = [
  {
    id: 'user_analytics',
    name: 'User Analytics',
    description: 'Comprehensive user behavior analysis',
    category: 'User Management',
    preview: '/images/templates/user-analytics-preview.png',
    sections: ['overview', 'growth', 'demographics', 'engagement'],
  },
  {
    id: 'revenue_report',
    name: 'Revenue Analysis',
    description: 'Financial performance and revenue trends',
    category: 'Financial',
    preview: '/images/templates/revenue-preview.png',
    sections: ['revenue_overview', 'trends', 'breakdown'],
  },
  {
    id: 'engagement_metrics',
    name: 'User Engagement',
    description: 'User activity and engagement patterns',
    category: 'Engagement',
    preview: '/images/templates/engagement-preview.png',
    sections: ['activity', 'retention', 'feature_usage'],
  },
];

describe('T028: Custom Report Generation - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPush.mockClear();
  });

  describe('Report Builder Interface', () => {
    it('should provide drag-and-drop report builder interface', async () => {
      // This test will FAIL until drag-and-drop report builder is implemented

      // Setup: Mock data sources API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            dataSources: [
              { id: 'users', name: 'Users', fields: ['id', 'email', 'created_at', 'status'] },
              { id: 'votes', name: 'Votes', fields: ['id', 'user_id', 'created_at', 'value'] },
            ],
          }
        }),
      });

      const user = userEvent.setup();
      render(<ReportBuilder />);

      // Assert: Data sources panel loaded
      await waitFor(() => {
        expect(screen.getByText(/data sources/i)).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Votes')).toBeInTheDocument();
      });

      // Assert: Report canvas available
      expect(screen.getByTestId('report-canvas')).toBeInTheDocument();
      expect(screen.getByText(/drag components here/i)).toBeInTheDocument();

      // Act: Drag a metric component from palette
      const metricsComponent = screen.getByTestId('component-metrics');
      const reportCanvas = screen.getByTestId('report-canvas');

      fireEvent.dragStart(metricsComponent, mockDragEvent);
      fireEvent.dragOver(reportCanvas, mockDragEvent);
      fireEvent.drop(reportCanvas, mockDragEvent);

      // Assert: Component added to canvas
      await waitFor(() => {
        expect(screen.getByTestId('canvas-metrics-component')).toBeInTheDocument();
      });

      // Act: Configure the metrics component
      const configButton = within(screen.getByTestId('canvas-metrics-component'))
        .getByRole('button', { name: /configure/i });
      await user.click(configButton);

      // Assert: Configuration panel opens
      expect(screen.getByText(/configure metrics/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select field/i)).toBeInTheDocument();

      // Act: Configure metrics
      await user.selectOptions(screen.getByLabelText(/data source/i), 'users');
      await user.selectOptions(screen.getByLabelText(/field/i), 'id');
      await user.selectOptions(screen.getByLabelText(/aggregation/i), 'count');
      await user.type(screen.getByLabelText(/label/i), 'Total Users');

      await user.click(screen.getByRole('button', { name: /apply/i }));

      // Assert: Component configured
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText(/count of users.id/i)).toBeInTheDocument();
      });
    });

    it('should support visual query builder for complex data filtering', async () => {
      // This test will FAIL until visual query builder is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            dataSources: mockReportDefinition.dataSources,
            schema: {
              users: {
                id: { type: 'integer', nullable: false },
                email: { type: 'string', nullable: false },
                created_at: { type: 'timestamp', nullable: false },
                status: { type: 'enum', values: ['active', 'inactive', 'premium'] },
                age: { type: 'integer', nullable: true },
              }
            }
          }
        }),
      });

      const user = userEvent.setup();
      render(<QueryBuilder />);

      // Assert: Query builder interface loads
      await waitFor(() => {
        expect(screen.getByText(/query builder/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add condition/i })).toBeInTheDocument();
      });

      // Act: Add first condition
      await user.click(screen.getByRole('button', { name: /add condition/i }));

      // Assert: Condition builder appears
      const conditionBuilder = screen.getByTestId('condition-builder-0');
      expect(conditionBuilder).toBeInTheDocument();

      // Act: Configure first condition (user status = active)
      await user.selectOptions(
        within(conditionBuilder).getByLabelText(/field/i),
        'users.status'
      );
      await user.selectOptions(
        within(conditionBuilder).getByLabelText(/operator/i),
        'equals'
      );
      await user.selectOptions(
        within(conditionBuilder).getByLabelText(/value/i),
        'active'
      );

      // Act: Add second condition with AND logic
      await user.click(screen.getByRole('button', { name: /add condition/i }));
      const secondCondition = screen.getByTestId('condition-builder-1');

      await user.selectOptions(
        within(secondCondition).getByLabelText(/field/i),
        'users.created_at'
      );
      await user.selectOptions(
        within(secondCondition).getByLabelText(/operator/i),
        'between'
      );
      await user.type(
        within(secondCondition).getByLabelText(/from date/i),
        '2024-01-01'
      );
      await user.type(
        within(secondCondition).getByLabelText(/to date/i),
        '2024-01-31'
      );

      // Assert: Query preview generated
      await waitFor(() => {
        const queryPreview = screen.getByTestId('query-preview');
        expect(queryPreview).toHaveTextContent(/WHERE users\.status = 'active'/i);
        expect(queryPreview).toHaveTextContent(/AND users\.created_at BETWEEN/i);
      });

      // Act: Test query
      const testQueryButton = screen.getByRole('button', { name: /test query/i });
      await user.click(testQueryButton);

      // Assert: Query validation
      await waitFor(() => {
        expect(screen.getByText(/query is valid/i)).toBeInTheDocument();
        expect(screen.getByText(/estimated 8,500 results/i)).toBeInTheDocument();
      });
    });

    it('should enable multi-data source joins and relationships', async () => {
      // This test will FAIL until multi-source joins are implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            dataSources: mockReportDefinition.dataSources,
            relationships: [
              {
                from: 'users.id',
                to: 'sessions.user_id',
                type: 'one-to-many',
                name: 'User Sessions',
              },
              {
                from: 'users.id',
                to: 'votes.user_id',
                type: 'one-to-many',
                name: 'User Votes',
              },
            ],
          }
        }),
      });

      const user = userEvent.setup();
      render(<ReportBuilder />);

      await waitFor(() => {
        expect(screen.getByText(/data sources/i)).toBeInTheDocument();
      });

      // Act: Add chart component requiring joined data
      const chartComponent = screen.getByTestId('component-chart');
      const reportCanvas = screen.getByTestId('report-canvas');

      fireEvent.dragStart(chartComponent, mockDragEvent);
      fireEvent.drop(reportCanvas, mockDragEvent);

      await waitFor(() => {
        expect(screen.getByTestId('canvas-chart-component')).toBeInTheDocument();
      });

      // Act: Configure chart with joined data
      const configButton = within(screen.getByTestId('canvas-chart-component'))
        .getByRole('button', { name: /configure/i });
      await user.click(configButton);

      // Assert: Join configuration available
      expect(screen.getByText(/data relationships/i)).toBeInTheDocument();
      expect(screen.getByText(/user sessions/i)).toBeInTheDocument();

      // Act: Configure chart with joined data (users + sessions)
      await user.selectOptions(screen.getByLabelText(/primary data source/i), 'users');
      await user.click(screen.getByLabelText(/join with sessions/i));

      await user.selectOptions(screen.getByLabelText(/x-axis/i), 'users.created_at');
      await user.selectOptions(screen.getByLabelText(/y-axis/i), 'sessions.duration');
      await user.selectOptions(screen.getByLabelText(/aggregation/i), 'avg');

      await user.click(screen.getByRole('button', { name: /apply/i }));

      // Assert: Join configuration saved
      await waitFor(() => {
        expect(screen.getByText(/avg session duration by signup date/i)).toBeInTheDocument();
        expect(screen.getByTestId('join-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('Report Templates and Presets', () => {
    it('should provide pre-built report templates', async () => {
      // This test will FAIL until report templates are implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockReportTemplates }),
      });

      const user = userEvent.setup();
      render(<ReportTemplates />);

      // Assert: Templates gallery loads
      await waitFor(() => {
        expect(screen.getByText(/report templates/i)).toBeInTheDocument();
        expect(screen.getByText('User Analytics')).toBeInTheDocument();
        expect(screen.getByText('Revenue Analysis')).toBeInTheDocument();
        expect(screen.getByText('User Engagement')).toBeInTheDocument();
      });

      // Assert: Template categories
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
      expect(screen.getByText('Engagement')).toBeInTheDocument();

      // Act: Preview a template
      const userAnalyticsTemplate = screen.getByTestId('template-user_analytics');
      const previewButton = within(userAnalyticsTemplate)
        .getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      // Assert: Template preview modal
      expect(screen.getByText(/template preview/i)).toBeInTheDocument();
      expect(screen.getByText(/comprehensive user behavior analysis/i)).toBeInTheDocument();

      // Assert: Template sections listed
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Growth')).toBeInTheDocument();
      expect(screen.getByText('Demographics')).toBeInTheDocument();

      // Act: Use template
      const useTemplateButton = screen.getByRole('button', { name: /use this template/i });
      await user.click(useTemplateButton);

      // Assert: Redirect to report builder with template
      expect(mockPush).toHaveBeenCalledWith('/admin/reports/builder?template=user_analytics');
    });

    it('should allow template customization and saving as new template', async () => {
      // This test will FAIL until template customization is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockReportTemplates[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: 'custom-template-001',
              name: 'Custom User Analytics',
              basedOn: 'user_analytics',
            }
          }),
        });

      const user = userEvent.setup();
      render(<ReportBuilder templateId="user_analytics" />);

      // Assert: Template loaded in builder
      await waitFor(() => {
        expect(screen.getByText(/user analytics report/i)).toBeInTheDocument();
        expect(screen.getByText(/based on template: user analytics/i)).toBeInTheDocument();
      });

      // Act: Customize template - add new section
      const addSectionButton = screen.getByRole('button', { name: /add section/i });
      await user.click(addSectionButton);

      const sectionTypeSelector = screen.getByLabelText(/section type/i);
      await user.selectOptions(sectionTypeSelector, 'table');

      await user.type(screen.getByLabelText(/section title/i), 'Recent Users Table');

      const addSectionConfirm = screen.getByRole('button', { name: /add section/i });
      await user.click(addSectionConfirm);

      // Assert: New section added
      expect(screen.getByText('Recent Users Table')).toBeInTheDocument();

      // Act: Save as new template
      const templateMenu = screen.getByRole('button', { name: /template options/i });
      await user.click(templateMenu);

      const saveAsTemplateOption = screen.getByRole('menuitem', { name: /save as new template/i });
      await user.click(saveAsTemplateOption);

      // Assert: Save template dialog
      expect(screen.getByText(/save as new template/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/template name/i), 'Custom User Analytics');
      await user.type(screen.getByLabelText(/description/i), 'Enhanced user analytics with recent users table');
      await user.selectOptions(screen.getByLabelText(/category/i), 'User Management');

      const saveTemplateButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveTemplateButton);

      // Assert: Template saved
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/reports/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Custom User Analytics',
            description: 'Enhanced user analytics with recent users table',
            category: 'User Management',
            basedOn: 'user_analytics',
            sections: expect.any(Array),
          }),
        });
      });
    });
  });

  describe('Report Generation and Execution', () => {
    it('should generate reports with real-time progress updates', async () => {
      // This test will FAIL until report generation is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              jobId: 'report-job-456',
              status: 'processing',
              estimatedDuration: 120,
            }
          }),
        });

      const user = userEvent.setup();
      render(<ReportBuilder reportId="report-123" />);

      // Act: Run the report
      const runReportButton = screen.getByRole('button', { name: /run report/i });
      await user.click(runReportButton);

      // Assert: Report generation started
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/reports/report-123/run', {
          method: 'POST',
          headers: expect.any(Object),
        });
      });

      // Assert: Progress indicator shown
      expect(screen.getByText(/generating report/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated time: 2 minutes/i)).toBeInTheDocument();

      // Assert: WebSocket connection for progress
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/ws/admin/reports/report-job-456')
        );
      });

      // Simulate progress updates via WebSocket
      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/reports/report-job-456');

      const progressUpdate = {
        type: 'report_progress',
        jobId: 'report-job-456',
        progress: 45,
        currentSection: 'User Growth Over Time',
        sectionsCompleted: 1,
        totalSections: 3,
      };

      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(progressUpdate),
        }));
      }

      // Assert: Progress updated
      await waitFor(() => {
        expect(screen.getByText(/45% complete/i)).toBeInTheDocument();
        expect(screen.getByText(/processing: user growth over time/i)).toBeInTheDocument();
        expect(screen.getByText(/1 of 3 sections complete/i)).toBeInTheDocument();
      });

      // Simulate completion
      const completionUpdate = {
        type: 'report_complete',
        jobId: 'report-job-456',
        status: 'completed',
        reportUrl: '/api/admin/reports/report-123/view',
        generatedAt: new Date().toISOString(),
      };

      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(completionUpdate),
        }));
      }

      // Assert: Report completed
      await waitFor(() => {
        expect(screen.getByText(/report generated successfully/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view report/i })).toBeInTheDocument();
      });
    });

    it('should handle large reports with data streaming and pagination', async () => {
      // This test will FAIL until streaming reports are implemented

      const largeReportJob = {
        jobId: 'large-report-789',
        status: 'processing',
        estimatedRecords: 500000,
        streamingEnabled: true,
        chunkSize: 10000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: largeReportJob }),
      });

      const user = userEvent.setup();
      render(<ReportBuilder reportId="report-123" />);

      // Simulate large dataset warning
      const runReportButton = screen.getByRole('button', { name: /run report/i });
      await user.click(runReportButton);

      // Assert: Large report warning
      await waitFor(() => {
        expect(screen.getByText(/large report detected/i)).toBeInTheDocument();
        expect(screen.getByText(/estimated 500,000 records/i)).toBeInTheDocument();
        expect(screen.getByText(/streaming mode recommended/i)).toBeInTheDocument();
      });

      // Act: Confirm streaming mode
      const enableStreamingButton = screen.getByRole('button', { name: /enable streaming/i });
      await user.click(enableStreamingButton);

      // Assert: Streaming configuration
      expect(screen.getByLabelText(/chunk size/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument();

      // Act: Start streaming report
      const startStreamingButton = screen.getByRole('button', { name: /start streaming report/i });
      await user.click(startStreamingButton);

      // Assert: Streaming progress indicators
      await waitFor(() => {
        expect(screen.getByText(/streaming report generation/i)).toBeInTheDocument();
        expect(screen.getByText(/0 of 50 chunks processed/i)).toBeInTheDocument();
      });

      // Simulate streaming progress
      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/reports/large-report-789');

      const streamingProgress = {
        type: 'streaming_progress',
        jobId: 'large-report-789',
        chunksProcessed: 25,
        totalChunks: 50,
        recordsProcessed: 250000,
        totalRecords: 500000,
        currentChunk: {
          startRecord: 240001,
          endRecord: 250000,
        },
      };

      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(streamingProgress),
        }));
      }

      // Assert: Streaming progress shown
      await waitFor(() => {
        expect(screen.getByText(/25 of 50 chunks processed/i)).toBeInTheDocument();
        expect(screen.getByText(/250,000 of 500,000 records/i)).toBeInTheDocument();
        expect(screen.getByText(/processing records 240,001 - 250,000/i)).toBeInTheDocument();
      });
    });

    it('should support scheduled report execution and automation', async () => {
      // This test will FAIL until scheduled reports are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              scheduleId: 'schedule-report-001',
              reportId: 'report-123',
              frequency: 'weekly',
              nextRun: '2024-02-05T09:00:00.000Z',
              status: 'active',
            }
          }),
        });

      const user = userEvent.setup();
      render(<ReportBuilder reportId="report-123" />);

      // Act: Access scheduling options
      const scheduleButton = screen.getByRole('button', { name: /schedule report/i });
      await user.click(scheduleButton);

      // Assert: Scheduling configuration
      expect(screen.getByText(/schedule report generation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delivery method/i)).toBeInTheDocument();

      // Act: Configure schedule
      await user.selectOptions(screen.getByLabelText(/frequency/i), 'weekly');
      await user.selectOptions(screen.getByLabelText(/day of week/i), 'monday');
      await user.type(screen.getByLabelText(/time/i), '09:00');

      // Configure delivery
      await user.selectOptions(screen.getByLabelText(/delivery method/i), 'email');
      await user.type(screen.getByLabelText(/email recipients/i), 'admin@vownow.com,manager@vownow.com');

      // Act: Create schedule
      const createScheduleButton = screen.getByRole('button', { name: /create schedule/i });
      await user.click(createScheduleButton);

      // Assert: Schedule created
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/reports/report-123/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frequency: 'weekly',
            dayOfWeek: 'monday',
            time: '09:00',
            delivery: {
              method: 'email',
              recipients: ['admin@vownow.com', 'manager@vownow.com'],
            },
          }),
        });
      });

      // Assert: Schedule confirmation
      expect(screen.getByText(/report scheduled successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/next run: monday, feb 5 at 9:00 am/i)).toBeInTheDocument();
    });
  });

  describe('Report Viewing and Interaction', () => {
    it('should provide interactive report viewer with drill-down capabilities', async () => {
      // This test will FAIL until interactive viewer is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockReportDefinition,
            data: mockReportData,
            generatedAt: new Date().toISOString(),
          }
        }),
      });

      const user = userEvent.setup();
      render(<ReportViewer reportId="report-123" />);

      // Assert: Report viewer loads with data
      await waitFor(() => {
        expect(screen.getByText('User Analytics Report')).toBeInTheDocument();
        expect(screen.getByText('15,420')).toBeInTheDocument(); // Total users metric
        expect(screen.getByTestId('report-line-chart')).toBeInTheDocument(); // Growth chart
      });

      // Assert: Interactive elements available
      expect(screen.getByRole('button', { name: /filter data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();

      // Act: Click on chart data point for drill-down
      const growthChart = screen.getByTestId('report-line-chart');
      await user.click(growthChart);

      // Assert: Drill-down options appear
      expect(screen.getByText(/drill down into march data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view march details/i })).toBeInTheDocument();

      // Act: Drill down into specific month
      await user.click(screen.getByRole('button', { name: /view march details/i }));

      // Assert: Detailed view loaded
      await waitFor(() => {
        expect(screen.getByText(/march 2024 user details/i)).toBeInTheDocument();
        expect(screen.getByText(/3,000 new users in march/i)).toBeInTheDocument();
      });

      // Assert: Breadcrumb navigation
      expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
      expect(screen.getByText(/overview > march 2024/i)).toBeInTheDocument();
    });

    it('should support report filtering and dynamic data updates', async () => {
      // This test will FAIL until dynamic filtering is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { ...mockReportDefinition, data: mockReportData }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              overview: { totalUsers: 8200, avgSessionDuration: 22.3 },
              growth: {
                labels: ['Jan', 'Feb', 'Mar'],
                datasets: [{ label: 'Premium Users', data: [800, 950, 1200] }],
              },
            }
          }),
        });

      const user = userEvent.setup();
      render(<ReportViewer reportId="report-123" />);

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Act: Apply filter
      const filterButton = screen.getByRole('button', { name: /filter data/i });
      await user.click(filterButton);

      // Assert: Filter panel opens
      expect(screen.getByText(/report filters/i)).toBeInTheDocument();

      // Act: Set user type filter
      await user.selectOptions(screen.getByLabelText(/user type/i), 'premium');

      const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyFiltersButton);

      // Assert: Filtered data API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/reports/report-123/data',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filters: [
                { field: 'users.created_at', operator: 'between', values: ['2024-01-01', '2024-01-31'] },
                { field: 'users.status', operator: 'in', values: ['active', 'premium'] },
                { field: 'users.type', operator: 'equals', values: ['premium'] },
              ],
            }),
          }
        );
      });

      // Assert: Updated data displayed
      await waitFor(() => {
        expect(screen.getByText('8,200')).toBeInTheDocument(); // Filtered user count
        expect(screen.getByText(/premium users only/i)).toBeInTheDocument(); // Filter indicator
      });
    });

    it('should enable report export in multiple formats with customization', async () => {
      // This test will FAIL until export functionality is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { ...mockReportDefinition, data: mockReportData }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['mock-pdf-data'], { type: 'application/pdf' }),
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="user_analytics_report.pdf"',
          }),
        });

      const user = userEvent.setup();
      render(<ReportViewer reportId="report-123" />);

      await waitFor(() => {
        expect(screen.getByText('User Analytics Report')).toBeInTheDocument();
      });

      // Act: Export report
      const exportButton = screen.getByRole('button', { name: /export report/i });
      await user.click(exportButton);

      // Assert: Export options
      expect(screen.getByText(/export options/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/format/i)).toBeInTheDocument();

      // Act: Configure export
      await user.selectOptions(screen.getByLabelText(/format/i), 'pdf');
      await user.click(screen.getByLabelText(/include charts/i));
      await user.click(screen.getByLabelText(/include raw data/i));

      // Configure layout
      await user.selectOptions(screen.getByLabelText(/page orientation/i), 'landscape');
      await user.selectOptions(screen.getByLabelText(/chart resolution/i), 'high');

      // Act: Start export
      const startExportButton = screen.getByRole('button', { name: /export/i });
      await user.click(startExportButton);

      // Assert: Export API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/reports/report-123/export',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              format: 'pdf',
              options: {
                includeCharts: true,
                includeRawData: true,
                pageOrientation: 'landscape',
                chartResolution: 'high',
              },
            }),
          }
        );
      });

      // Assert: File download initiated
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Report Sharing and Collaboration', () => {
    it('should support report sharing with access controls', async () => {
      // This test will FAIL until sharing functionality is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { ...mockReportDefinition, data: mockReportData }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              shareId: 'share-abc123',
              shareUrl: 'https://admin.vownow.com/shared-reports/share-abc123',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              accessLevel: 'view',
            }
          }),
        });

      const user = userEvent.setup();
      render(<ReportViewer reportId="report-123" />);

      await waitFor(() => {
        expect(screen.getByText('User Analytics Report')).toBeInTheDocument();
      });

      // Act: Share report
      const shareButton = screen.getByRole('button', { name: /share report/i });
      await user.click(shareButton);

      // Assert: Sharing options
      expect(screen.getByText(/share report/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/access level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiration/i)).toBeInTheDocument();

      // Act: Configure sharing
      await user.selectOptions(screen.getByLabelText(/access level/i), 'view');
      await user.selectOptions(screen.getByLabelText(/expiration/i), '7_days');
      await user.click(screen.getByLabelText(/require login/i));

      // Act: Generate share link
      const generateLinkButton = screen.getByRole('button', { name: /generate link/i });
      await user.click(generateLinkButton);

      // Assert: Share API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/reports/report-123/share',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessLevel: 'view',
              expirationDays: 7,
              requireLogin: true,
            }),
          }
        );
      });

      // Assert: Share link provided
      await waitFor(() => {
        expect(screen.getByDisplayValue(/https:\/\/admin\.vownow\.com\/shared-reports\/share-abc123/)).toBeInTheDocument();
        expect(screen.getByText(/link expires in 7 days/i)).toBeInTheDocument();
      });

      // Act: Copy share link
      const copyLinkButton = screen.getByRole('button', { name: /copy link/i });
      await user.click(copyLinkButton);

      // Assert: Copy confirmation
      expect(screen.getByText(/link copied to clipboard/i)).toBeInTheDocument();
    });

    it('should enable collaborative report commenting and annotations', async () => {
      // This test will FAIL until collaboration features are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { ...mockReportDefinition, data: mockReportData }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              {
                id: 'comment-001',
                userId: 'admin-002',
                userName: 'Manager User',
                content: 'The March spike needs investigation',
                sectionId: 'growth',
                createdAt: '2024-01-15T14:30:00.000Z',
              }
            ]
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: 'comment-002',
              userId: 'admin-001',
              userName: 'Admin User',
              content: 'Agreed, will look into the marketing campaign data',
              sectionId: 'growth',
              createdAt: new Date().toISOString(),
            }
          }),
        });

      const user = userEvent.setup();
      render(<ReportViewer reportId="report-123" collaborative />);

      await waitFor(() => {
        expect(screen.getByText('User Analytics Report')).toBeInTheDocument();
      });

      // Assert: Comments loaded
      await waitFor(() => {
        expect(screen.getByText(/the march spike needs investigation/i)).toBeInTheDocument();
        expect(screen.getByText('Manager User')).toBeInTheDocument();
      });

      // Act: Add new comment
      const addCommentButton = screen.getByRole('button', { name: /add comment/i });
      await user.click(addCommentButton);

      // Assert: Comment form appears
      expect(screen.getByLabelText(/comment/i)).toBeInTheDocument();

      // Act: Write and submit comment
      await user.type(
        screen.getByLabelText(/comment/i),
        'Agreed, will look into the marketing campaign data'
      );

      const submitCommentButton = screen.getByRole('button', { name: /submit comment/i });
      await user.click(submitCommentButton);

      // Assert: Comment submission API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/reports/report-123/comments',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: 'Agreed, will look into the marketing campaign data',
              sectionId: 'growth',
            }),
          }
        );
      });

      // Assert: New comment appears
      await waitFor(() => {
        expect(screen.getByText(/agreed, will look into the marketing campaign data/i)).toBeInTheDocument();
      });
    });
  });
});