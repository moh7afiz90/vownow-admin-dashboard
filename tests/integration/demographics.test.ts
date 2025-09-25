/**
 * T026: Integration Tests for User Demographics Analysis
 *
 * This test suite validates the complete user demographics analysis workflow.
 * Tests the integration between user data APIs, demographic calculations, and visualization components.
 *
 * Test Scenarios:
 * - Loading and analyzing demographic data (age, gender, location, etc.)
 * - Interactive demographic filtering and segmentation
 * - Cross-demographic correlation analysis
 * - Demographic trend analysis over time
 * - Demographic export and reporting
 * - Real-time demographic updates
 * - Geographic heat map visualizations
 * - Demographic comparison between user segments
 *
 * Integration Points:
 * - GET /api/admin/analytics/demographics
 * - GET /api/admin/analytics/user-segments
 * - GET /api/admin/analytics/geographic
 * - GET /api/admin/users (with demographic filters)
 * - POST /api/admin/reports/demographics
 * - WebSocket for real-time demographic changes
 * - Map visualization libraries
 * - CSV/Excel export functionality
 *
 * This test follows TDD principles and will FAIL initially until the complete
 * demographics analysis functionality is implemented.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { DemographicsAnalysis } from '@/components/analytics/DemographicsAnalysis';
import { DemographicChart } from '@/components/analytics/DemographicChart';
import { GeographicHeatMap } from '@/components/analytics/GeographicHeatMap';
import { UserSegmentComparison } from '@/components/analytics/UserSegmentComparison';

// Mock Chart.js and map libraries
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="demographic-bar-chart" data-chart-data={JSON.stringify(data)}>
      Demographics Bar Chart
    </div>
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="demographic-pie-chart" data-chart-data={JSON.stringify(data)}>
      Demographics Pie Chart
    </div>
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="demographic-trend-chart" data-chart-data={JSON.stringify(data)}>
      Demographics Trend Chart
    </div>
  ),
}));

// Mock leaflet for geographic visualization
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => (
    <div data-testid="geographic-map">{children}</div>
  ),
  TileLayer: () => <div data-testid="map-tiles" />,
  HeatmapLayer: ({ data }: any) => (
    <div data-testid="heatmap-layer" data-heatmap-points={data?.length || 0} />
  ),
  Marker: ({ position, children }: any) => (
    <div data-testid="map-marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="map-popup">{children}</div>,
}));

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
        timeRange: '30d',
        segment: 'all',
        demographic: 'age',
      };
      return params[key] || null;
    }),
  }),
  usePathname: () => '/admin/analytics/demographics',
}));

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock file download
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock ResizeObserver for responsive charts
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test data
const mockDemographicsData = {
  age: {
    '18-24': 2500,
    '25-34': 4200,
    '35-44': 3800,
    '45-54': 2100,
    '55-64': 1400,
    '65+': 800,
  },
  gender: {
    'Male': 7200,
    'Female': 6800,
    'Non-binary': 400,
    'Prefer not to say': 500,
  },
  location: {
    'United States': 8500,
    'Canada': 2100,
    'United Kingdom': 1800,
    'Australia': 1200,
    'Germany': 900,
    'Other': 400,
  },
  education: {
    'High School': 3200,
    'Bachelor\'s': 6500,
    'Master\'s': 4100,
    'PhD': 1100,
    'Other': 0,
  },
};

const mockGeographicData = [
  { lat: 40.7128, lng: -74.0060, count: 2500, city: 'New York' },
  { lat: 34.0522, lng: -118.2437, count: 1800, city: 'Los Angeles' },
  { lat: 41.8781, lng: -87.6298, count: 1200, city: 'Chicago' },
  { lat: 29.7604, lng: -95.3698, count: 900, city: 'Houston' },
  { lat: 33.4484, lng: -112.0740, count: 600, city: 'Phoenix' },
];

const mockTrendData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: '18-24',
      data: [400, 450, 420, 480, 510, 520],
      borderColor: '#FF6384',
    },
    {
      label: '25-34',
      data: [680, 720, 740, 700, 780, 800],
      borderColor: '#36A2EB',
    },
    {
      label: '35-44',
      data: [620, 610, 640, 660, 650, 680],
      borderColor: '#FFCE56',
    },
  ],
};

const mockUserSegments = [
  {
    id: 'power_users',
    name: 'Power Users',
    count: 1250,
    demographics: {
      averageAge: 32,
      genderDistribution: { Male: 60, Female: 35, Other: 5 },
      topLocations: ['New York', 'San Francisco', 'London'],
    },
  },
  {
    id: 'casual_users',
    name: 'Casual Users',
    count: 8500,
    demographics: {
      averageAge: 28,
      genderDistribution: { Male: 45, Female: 50, Other: 5 },
      topLocations: ['Los Angeles', 'Toronto', 'Sydney'],
    },
  },
];

describe('T026: User Demographics Analysis - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPush.mockClear();
  });

  describe('Demographics Data Loading and Display', () => {
    it('should load and display comprehensive demographic analysis', async () => {
      // This test will FAIL until demographics loading is implemented

      // Setup: Mock demographic APIs
      mockFetch
        // Main demographics data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        // Geographic data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockGeographicData }),
        })
        // Trend data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTrendData }),
        });

      // Act: Render demographics analysis
      render(<DemographicsAnalysis />);

      // Assert: Loading state initially
      expect(screen.getByText(/loading demographics/i)).toBeInTheDocument();

      // Assert: API calls made
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/analytics/demographics?timeRange=30d&segment=all',
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/analytics/geographic?timeRange=30d',
          expect.any(Object)
        );
      });

      // Assert: Demographic data displayed
      await waitFor(() => {
        // Age demographics
        expect(screen.getByText('25-34')).toBeInTheDocument();
        expect(screen.getByText('4,200')).toBeInTheDocument(); // Count for 25-34 age group

        // Gender demographics
        expect(screen.getByText('Male: 7,200')).toBeInTheDocument();
        expect(screen.getByText('Female: 6,800')).toBeInTheDocument();

        // Location demographics
        expect(screen.getByText('United States: 8,500')).toBeInTheDocument();
        expect(screen.getByText('Canada: 2,100')).toBeInTheDocument();
      });

      // Assert: Charts rendered
      expect(screen.getByTestId('demographic-bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('demographic-pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('geographic-map')).toBeInTheDocument();
    });

    it('should handle demographic category switching', async () => {
      // This test will FAIL until category switching is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockGeographicData }),
        });

      const user = userEvent.setup();
      render(<DemographicsAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('25-34')).toBeInTheDocument();
      });

      // Act: Switch to gender demographics
      const genderTab = screen.getByRole('tab', { name: /gender/i });
      await user.click(genderTab);

      // Assert: Gender data displayed
      await waitFor(() => {
        expect(screen.getByText(/male: 48%/i)).toBeInTheDocument();
        expect(screen.getByText(/female: 45%/i)).toBeInTheDocument();
      });

      // Act: Switch to location demographics
      const locationTab = screen.getByRole('tab', { name: /location/i });
      await user.click(locationTab);

      // Assert: Location data displayed
      await waitFor(() => {
        expect(screen.getByText(/united states: 57%/i)).toBeInTheDocument();
        expect(screen.getByText(/canada: 14%/i)).toBeInTheDocument();
      });
    });

    it('should display geographic heat map with user concentrations', async () => {
      // This test will FAIL until geographic visualization is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockGeographicData }),
        });

      render(<DemographicsAnalysis />);

      // Assert: Map loads with heatmap
      await waitFor(() => {
        expect(screen.getByTestId('geographic-map')).toBeInTheDocument();
        expect(screen.getByTestId('heatmap-layer')).toBeInTheDocument();
      });

      // Assert: Map markers for major cities
      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(5); // 5 cities in mock data

      // Assert: Heatmap points match data
      const heatmapLayer = screen.getByTestId('heatmap-layer');
      expect(heatmapLayer).toHaveAttribute('data-heatmap-points', '5');
    });
  });

  describe('Interactive Filtering and Segmentation', () => {
    it('should support demographic filtering with real-time updates', async () => {
      // This test will FAIL until filtering is implemented

      // Setup: Initial and filtered data responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        // Filtered data for 25-34 age group
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              ...mockDemographicsData,
              gender: { Male: 2400, Female: 1600, Other: 200 }, // Filtered subset
              location: { 'United States': 2800, 'Canada': 800, 'Other': 600 },
            }
          }),
        });

      const user = userEvent.setup();
      render(<DemographicsAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('25-34')).toBeInTheDocument();
      });

      // Act: Apply age filter
      const ageFilter = screen.getByLabelText(/age range/i);
      await user.selectOptions(ageFilter, '25-34');

      const applyFilterButton = screen.getByRole('button', { name: /apply filter/i });
      await user.click(applyFilterButton);

      // Assert: Filtered API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/analytics/demographics?timeRange=30d&segment=all&ageRange=25-34',
          expect.any(Object)
        );
      });

      // Assert: Updated demographics for filtered subset
      await waitFor(() => {
        expect(screen.getByText(/filtered results: 4,200 users/i)).toBeInTheDocument();
        expect(screen.getByText(/male: 57%/i)).toBeInTheDocument(); // Updated percentage
        expect(screen.getByText(/female: 38%/i)).toBeInTheDocument();
      });
    });

    it('should enable complex multi-demographic filtering', async () => {
      // This test will FAIL until multi-demographic filtering is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        // Multi-filtered data (25-34, Female, US)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              count: 1200,
              demographics: {
                education: { "Bachelor's": 600, "Master's": 400, "PhD": 200 },
                interests: { Technology: 800, Design: 300, Business: 100 },
              }
            }
          }),
        });

      const user = userEvent.setup();
      render(<DemographicsAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('25-34')).toBeInTheDocument();
      });

      // Act: Apply multiple filters
      await user.selectOptions(screen.getByLabelText(/age range/i), '25-34');
      await user.selectOptions(screen.getByLabelText(/gender/i), 'Female');
      await user.selectOptions(screen.getByLabelText(/location/i), 'United States');

      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      // Assert: Complex filtered query
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/analytics/demographics?timeRange=30d&segment=all&ageRange=25-34&gender=Female&location=United%20States',
          expect.any(Object)
        );
      });

      // Assert: Refined demographic breakdown
      await waitFor(() => {
        expect(screen.getByText(/1,200 users match filters/i)).toBeInTheDocument();
        expect(screen.getByText(/bachelor's: 50%/i)).toBeInTheDocument();
        expect(screen.getByText(/technology interest: 67%/i)).toBeInTheDocument();
      });
    });

    it('should provide demographic comparison between user segments', async () => {
      // This test will FAIL until segment comparison is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUserSegments }),
        });

      const user = userEvent.setup();
      render(<UserSegmentComparison />);

      // Assert: Segment selection available
      await waitFor(() => {
        expect(screen.getByLabelText(/select segments to compare/i)).toBeInTheDocument();
      });

      // Act: Select segments for comparison
      const segmentSelector = screen.getByLabelText(/select segments to compare/i);
      await user.click(segmentSelector);

      await user.click(screen.getByText('Power Users'));
      await user.click(screen.getByText('Casual Users'));

      const compareButton = screen.getByRole('button', { name: /compare segments/i });
      await user.click(compareButton);

      // Assert: Comparison data displayed
      await waitFor(() => {
        expect(screen.getByText(/power users vs casual users/i)).toBeInTheDocument();
        expect(screen.getByText(/average age: 32 vs 28/i)).toBeInTheDocument();
        expect(screen.getByText(/male: 60% vs 45%/i)).toBeInTheDocument();
      });

      // Assert: Side-by-side demographic charts
      const comparisonCharts = screen.getAllByTestId('demographic-comparison-chart');
      expect(comparisonCharts).toHaveLength(2); // One for each segment
    });
  });

  describe('Trend Analysis and Time-based Demographics', () => {
    it('should display demographic trends over time', async () => {
      // This test will FAIL until trend analysis is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTrendData }),
        });

      render(<DemographicsAnalysis />);

      // Assert: Trend chart rendered
      await waitFor(() => {
        expect(screen.getByTestId('demographic-trend-chart')).toBeInTheDocument();
      });

      // Assert: Trend analysis insights
      expect(screen.getByText(/25-34 age group growing by 18% over 6 months/i)).toBeInTheDocument();
      expect(screen.getByText(/18-24 age group stable/i)).toBeInTheDocument();

      // Assert: Trend period selector
      expect(screen.getByLabelText(/trend period/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('6m')).toBeInTheDocument(); // Default 6 months
    });

    it('should support custom date range analysis', async () => {
      // This test will FAIL until custom date ranges are implemented

      const customStartDate = new Date('2024-01-01');
      const customEndDate = new Date('2024-06-30');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTrendData }),
        });

      const user = userEvent.setup();
      render(<DemographicsAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('25-34')).toBeInTheDocument();
      });

      // Act: Set custom date range
      const startDatePicker = screen.getByLabelText(/start date/i);
      const endDatePicker = screen.getByLabelText(/end date/i);

      await user.type(startDatePicker, '2024-01-01');
      await user.type(endDatePicker, '2024-06-30');

      const applyDateRange = screen.getByRole('button', { name: /apply date range/i });
      await user.click(applyDateRange);

      // Assert: Custom date range API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('startDate=2024-01-01&endDate=2024-06-30'),
          expect.any(Object)
        );
      });

      // Assert: Custom period indicator
      expect(screen.getByText(/jan 1, 2024 - jun 30, 2024/i)).toBeInTheDocument();
    });

    it('should identify and highlight demographic anomalies', async () => {
      // This test will FAIL until anomaly detection is implemented

      const anomalyData = {
        ...mockTrendData,
        anomalies: [
          {
            date: 'Mar',
            demographic: '18-24',
            type: 'spike',
            severity: 'high',
            description: 'Unexpected 40% increase in 18-24 signups',
          },
          {
            date: 'Apr',
            demographic: '35-44',
            type: 'drop',
            severity: 'medium',
            description: '15% decrease from previous month',
          },
        ],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: anomalyData }),
        });

      render(<DemographicsAnalysis />);

      // Assert: Anomaly indicators on chart
      await waitFor(() => {
        expect(screen.getByTestId('anomaly-indicator-high')).toBeInTheDocument();
        expect(screen.getByTestId('anomaly-indicator-medium')).toBeInTheDocument();
      });

      // Assert: Anomaly alerts
      expect(screen.getByText(/2 demographic anomalies detected/i)).toBeInTheDocument();
      expect(screen.getByText(/unexpected 40% increase in 18-24 signups/i)).toBeInTheDocument();
    });
  });

  describe('Export and Reporting', () => {
    it('should enable demographic data export in multiple formats', async () => {
      // This test will FAIL until export functionality is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        // Export API
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['mock-csv-data'], { type: 'text/csv' }),
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="demographics-export.csv"',
          }),
        });

      const user = userEvent.setup();
      render(<DemographicsAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('25-34')).toBeInTheDocument();
      });

      // Act: Initiate export
      const exportButton = screen.getByRole('button', { name: /export demographics/i });
      await user.click(exportButton);

      // Assert: Export options available
      const csvExport = screen.getByRole('menuitem', { name: /export as csv/i });
      await user.click(csvExport);

      // Assert: Export API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/analytics/demographics/export',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              format: 'csv',
              filters: { timeRange: '30d', segment: 'all' },
              includeCharts: false,
            }),
          }
        );
      });

      // Assert: File download triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should generate comprehensive demographic reports with visualizations', async () => {
      // This test will FAIL until report generation is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData }),
        })
        // Report generation API
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reportId: 'report-123',
            status: 'processing',
            estimatedCompletion: new Date(Date.now() + 30000).toISOString(),
          }),
        })
        // Report status check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reportId: 'report-123',
            status: 'completed',
            downloadUrl: '/api/admin/reports/report-123/download',
          }),
        });

      const user = userEvent.setup();
      render(<DemographicsAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('25-34')).toBeInTheDocument();
      });

      // Act: Generate comprehensive report
      const reportButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(reportButton);

      // Configure report options
      await user.click(screen.getByLabelText(/include trend analysis/i));
      await user.click(screen.getByLabelText(/include geographic maps/i));
      await user.click(screen.getByLabelText(/include segment comparisons/i));

      const generateButton = screen.getByRole('button', { name: /generate comprehensive report/i });
      await user.click(generateButton);

      // Assert: Report generation started
      await waitFor(() => {
        expect(screen.getByText(/generating report.../i)).toBeInTheDocument();
        expect(screen.getByText(/estimated completion: 30 seconds/i)).toBeInTheDocument();
      });

      // Assert: Report completion
      await waitFor(() => {
        expect(screen.getByText(/report ready for download/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download report/i })).toBeInTheDocument();
      }, { timeout: 35000 });
    });
  });

  describe('Real-time Demographics and Performance', () => {
    it('should update demographics in real-time as new users register', async () => {
      // This test will FAIL until real-time updates are implemented

      // Mock WebSocket for real-time updates
      class MockWebSocket {
        onmessage: ((event: MessageEvent) => void) | null = null;
        onopen: ((event: Event) => void) | null = null;
        send = jest.fn();
        close = jest.fn();
        readyState = WebSocket.OPEN;
      }

      // @ts-ignore
      global.WebSocket = MockWebSocket;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockDemographicsData }),
      });

      render(<DemographicsAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('25-34')).toBeInTheDocument();
      });

      // Simulate real-time demographic update
      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/demographics');
      const realTimeUpdate = {
        type: 'demographics_update',
        data: {
          demographic: 'age',
          category: '25-34',
          previousCount: 4200,
          newCount: 4205,
          change: +5,
        },
        timestamp: new Date().toISOString(),
      };

      // Mock receiving WebSocket message
      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(realTimeUpdate),
        }));
      }

      // Assert: Real-time update reflected
      await waitFor(() => {
        expect(screen.getByText('4,205')).toBeInTheDocument(); // Updated count
        expect(screen.getByTestId('real-time-update-animation')).toBeInTheDocument();
      });
    });

    it('should optimize performance for large demographic datasets', async () => {
      // This test will FAIL until performance optimizations are implemented

      // Mock large dataset
      const largeDataset = {
        age: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`age-${i}`, Math.floor(Math.random() * 1000)])
        ),
        location: Object.fromEntries(
          Array.from({ length: 200 }, (_, i) => [`city-${i}`, Math.floor(Math.random() * 500)])
        ),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: largeDataset }),
      });

      render(<DemographicsAnalysis />);

      // Assert: Data virtualization for large lists
      await waitFor(() => {
        const demographicList = screen.getByTestId('demographic-list');
        // Should only render visible items, not all 100+200
        const listItems = within(demographicList).getAllByTestId(/demographic-item/);
        expect(listItems.length).toBeLessThan(50); // Virtualized rendering
      });

      // Assert: Performance indicators
      expect(screen.getByTestId('data-virtualization-indicator')).toBeInTheDocument();
      expect(screen.getByText(/showing 20 of 300 items/i)).toBeInTheDocument();
    });

    it('should handle concurrent demographic analysis requests', async () => {
      // This test will FAIL until concurrent request handling is implemented

      // Mock multiple simultaneous requests
      const requests = [
        { demographic: 'age', timeRange: '7d' },
        { demographic: 'gender', timeRange: '30d' },
        { demographic: 'location', timeRange: '90d' },
      ];

      // Set up different responses for each request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData, requestId: '1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData, requestId: '2' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockDemographicsData, requestId: '3' }),
        });

      const user = userEvent.setup();
      render(<DemographicsAnalysis />);

      // Act: Trigger multiple rapid requests
      const ageTab = screen.getByRole('tab', { name: /age/i });
      const genderTab = screen.getByRole('tab', { name: /gender/i });
      const locationTab = screen.getByRole('tab', { name: /location/i });

      await user.click(ageTab);
      await user.click(genderTab);
      await user.click(locationTab);

      // Assert: Request deduplication/cancellation
      await waitFor(() => {
        expect(screen.getByTestId('request-management-indicator')).toBeInTheDocument();
        expect(screen.getByText(/processing latest request/i)).toBeInTheDocument();
      });

      // Assert: Only latest request result shown
      await waitFor(() => {
        expect(screen.getByText(/location demographics loaded/i)).toBeInTheDocument();
      });
    });
  });
});