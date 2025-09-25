/**
 * T025: Integration Tests for Dashboard Metrics Viewing
 *
 * This test suite validates the complete dashboard metrics workflow.
 * Tests the integration between metrics APIs, data aggregation, and dashboard components.
 *
 * Test Scenarios:
 * - Loading and displaying key performance metrics
 * - Real-time metric updates and auto-refresh
 * - Interactive metric filtering and time range selection
 * - Error handling for failed metric requests
 * - Data aggregation across multiple metric endpoints
 * - Performance optimization with metric caching
 * - Responsive design for different screen sizes
 * - Accessibility compliance for dashboard components
 *
 * Integration Points:
 * - GET /api/admin/dashboard/metrics
 * - GET /api/admin/analytics/stats
 * - GET /api/admin/analytics/user-growth
 * - GET /api/admin/analytics/revenue
 * - GET /api/admin/analytics/activity
 * - WebSocket for real-time updates
 * - Local storage for user preferences
 * - Chart.js integration for data visualization
 *
 * This test follows TDD principles and will FAIL initially until the complete
 * dashboard functionality is implemented.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
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
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {data.labels?.[0] && <span>Chart: {data.labels[0]}</span>}
    </div>
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {data.labels?.[0] && <span>Chart: {data.labels[0]}</span>}
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)}>
      {data.labels?.[0] && <span>Chart: {data.labels[0]}</span>}
    </div>
  ),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue('7d'),
  }),
  usePathname: () => '/admin/dashboard',
}));

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock WebSocket for real-time updates
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

// Mock IntersectionObserver for lazy loading
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver for responsive charts
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test data
const mockMetrics = {
  totalUsers: 15420,
  activeUsers: 8932,
  newUsers: 234,
  churnRate: 2.3,
  revenue: 125000,
  avgSessionDuration: 18.5,
  bounceRate: 32.1,
  conversionRate: 4.7,
};

const mockUserGrowthData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'New Users',
      data: [1200, 1900, 3000, 2500, 2200, 2800],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
    },
  ],
};

const mockRevenueData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [
    {
      label: 'Revenue ($)',
      data: [25000, 32000, 28000, 40000],
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      borderColor: 'rgba(16, 185, 129, 1)',
    },
  ],
};

const mockActivityData = {
  labels: ['Votes', 'Comments', 'Shares', 'Profile Views'],
  datasets: [
    {
      data: [45, 25, 20, 10],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    },
  ],
};

describe('T025: Dashboard Metrics Viewing - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPush.mockClear();
  });

  describe('Dashboard Loading and Data Display', () => {
    it('should load and display all key metrics on dashboard', async () => {
      // This test will FAIL until metrics loading is implemented

      // Setup: Mock all metric API responses
      mockFetch
        // Main metrics
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMetrics }),
        })
        // User growth data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUserGrowthData }),
        })
        // Revenue data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRevenueData }),
        })
        // Activity data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockActivityData }),
        });

      // Act: Render dashboard
      render(<Dashboard />);

      // Assert: Loading state initially
      expect(screen.getByText(/loading metrics/i)).toBeInTheDocument();

      // Assert: All API endpoints called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/dashboard/metrics?timeRange=7d', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          },
        });
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics/user-growth?timeRange=7d');
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics/revenue?timeRange=7d');
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics/activity?timeRange=7d');
      });

      // Assert: Key metrics displayed
      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument(); // Total users
        expect(screen.getByText('8,932')).toBeInTheDocument();  // Active users
        expect(screen.getByText('234')).toBeInTheDocument();    // New users
        expect(screen.getByText('2.3%')).toBeInTheDocument();   // Churn rate
        expect(screen.getByText('$125,000')).toBeInTheDocument(); // Revenue
      });

      // Assert: Charts rendered
      expect(screen.getByTestId('line-chart')).toBeInTheDocument(); // User growth
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();  // Revenue
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument(); // Activity
    });

    it('should handle metric aggregation from multiple endpoints', async () => {
      // This test will FAIL until data aggregation is implemented

      const partialMetrics1 = { totalUsers: 15420, activeUsers: 8932 };
      const partialMetrics2 = { newUsers: 234, churnRate: 2.3 };
      const partialMetrics3 = { revenue: 125000, avgSessionDuration: 18.5 };

      // Setup: Mock responses from different endpoints
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: partialMetrics1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: partialMetrics2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: partialMetrics3 }),
        });

      render(<Dashboard />);

      // Assert: All partial data aggregated and displayed
      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
        expect(screen.getByText('8,932')).toBeInTheDocument();
        expect(screen.getByText('234')).toBeInTheDocument();
        expect(screen.getByText('$125,000')).toBeInTheDocument();
      });

      // Assert: Aggregation complete indicator
      expect(screen.getByTestId('metrics-complete-indicator')).toBeInTheDocument();
    });

    it('should display proper loading states for different metric sections', async () => {
      // This test will FAIL until granular loading states are implemented

      let resolveMetrics: (value: any) => void;
      let resolveCharts: (value: any) => void;

      const metricsPromise = new Promise(resolve => {
        resolveMetrics = resolve;
      });
      const chartsPromise = new Promise(resolve => {
        resolveCharts = resolve;
      });

      // Setup: Delayed responses
      mockFetch
        .mockImplementationOnce(() => metricsPromise)
        .mockImplementationOnce(() => chartsPromise);

      render(<Dashboard />);

      // Assert: Individual loading states
      expect(screen.getByTestId('metrics-cards-loading')).toBeInTheDocument();
      expect(screen.getByTestId('charts-loading')).toBeInTheDocument();

      // Resolve metrics first
      resolveMetrics!({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('metrics-cards-loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('charts-loading')).toBeInTheDocument(); // Still loading
      });

      // Resolve charts
      resolveCharts!({
        ok: true,
        json: async () => ({ data: mockUserGrowthData }),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('charts-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Interactive Features', () => {
    it('should handle time range filtering and refresh data', async () => {
      // This test will FAIL until time range filtering is implemented

      // Setup: Initial data
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMetrics }),
        })
        // Data for different time range
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { ...mockMetrics, totalUsers: 12000, newUsers: 180 }
          }),
        });

      const user = userEvent.setup();
      render(<Dashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Act: Change time range
      const timeRangeSelector = screen.getByLabelText(/time range/i);
      await user.selectOptions(timeRangeSelector, '30d');

      // Assert: New API call with different time range
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/dashboard/metrics?timeRange=30d',
          expect.any(Object)
        );
      });

      // Assert: Updated data displayed
      await waitFor(() => {
        expect(screen.getByText('12,000')).toBeInTheDocument(); // Updated total users
        expect(screen.getByText('180')).toBeInTheDocument();    // Updated new users
      });
    });

    it('should support drill-down navigation from metric cards', async () => {
      // This test will FAIL until drill-down navigation is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });

      const user = userEvent.setup();
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Act: Click on total users card
      const totalUsersCard = screen.getByTestId('total-users-card');
      await user.click(totalUsersCard);

      // Assert: Navigation to users page
      expect(mockPush).toHaveBeenCalledWith('/admin/users?metric=total');

      // Act: Click on revenue card
      const revenueCard = screen.getByTestId('revenue-card');
      await user.click(revenueCard);

      // Assert: Navigation to revenue analytics
      expect(mockPush).toHaveBeenCalledWith('/admin/analytics/revenue');
    });

    it('should handle chart interactions and tooltips', async () => {
      // This test will FAIL until chart interactions are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMetrics }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUserGrowthData }),
        });

      const user = userEvent.setup();
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Act: Hover over chart data point
      const chart = screen.getByTestId('line-chart');
      await user.hover(chart);

      // Assert: Tooltip appears with data
      await waitFor(() => {
        expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
        expect(screen.getByText(/1,900 new users/i)).toBeInTheDocument();
      });

      // Act: Click on chart legend
      const legend = within(chart).getByText('New Users');
      await user.click(legend);

      // Assert: Chart data toggles visibility
      expect(screen.getByTestId('chart-dataset-hidden')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should receive and display real-time metric updates via WebSocket', async () => {
      // This test will FAIL until WebSocket integration is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Assert: WebSocket connection established
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('/ws/admin/metrics')
      );

      // Simulate real-time update
      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/metrics');
      const realTimeUpdate = {
        type: 'metrics_update',
        data: {
          ...mockMetrics,
          totalUsers: 15450, // Updated count
          activeUsers: 8965,
          newUsers: 267,
        },
        timestamp: new Date().toISOString(),
      };

      // Mock receiving WebSocket message
      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(realTimeUpdate),
        }));
      }

      // Assert: UI updates with new data
      await waitFor(() => {
        expect(screen.getByText('15,450')).toBeInTheDocument();
        expect(screen.getByText('8,965')).toBeInTheDocument();
        expect(screen.getByText('267')).toBeInTheDocument();
      });

      // Assert: Update indicator shown
      expect(screen.getByTestId('real-time-update-indicator')).toBeInTheDocument();
    });

    it('should handle auto-refresh with configurable intervals', async () => {
      // This test will FAIL until auto-refresh is implemented

      jest.useFakeTimers();

      let callCount = 0;
      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          data: { ...mockMetrics, totalUsers: 15420 + callCount++ * 10 }
        }),
      }));

      const user = userEvent.setup();
      render(<Dashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByLabelText(/auto refresh/i);
      await user.click(autoRefreshToggle);

      // Set refresh interval
      const intervalSelector = screen.getByLabelText(/refresh interval/i);
      await user.selectOptions(intervalSelector, '30'); // 30 seconds

      // Advance time by 30 seconds
      jest.advanceTimersByTime(30000);

      // Assert: Data refreshed
      await waitFor(() => {
        expect(screen.getByText('15,430')).toBeInTheDocument(); // Updated by 10
      });

      // Advance time by another 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('15,440')).toBeInTheDocument(); // Updated by another 10
      });

      jest.useRealTimers();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API failures gracefully with retry mechanism', async () => {
      // This test will FAIL until error recovery is implemented

      // Setup: First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMetrics }),
        });

      const user = userEvent.setup();
      render(<Dashboard />);

      // Assert: Error state displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to load metrics/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Act: Click retry
      await user.click(screen.getByRole('button', { name: /retry/i }));

      // Assert: Data loads successfully
      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
        expect(screen.queryByText(/failed to load metrics/i)).not.toBeInTheDocument();
      });
    });

    it('should handle partial data loading failures', async () => {
      // This test will FAIL until partial failure handling is implemented

      // Setup: Some endpoints succeed, others fail
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMetrics }),
        })
        .mockRejectedValueOnce(new Error('Chart data failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRevenueData }),
        });

      render(<Dashboard />);

      // Assert: Metrics load successfully
      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Assert: Failed chart shows error state
      expect(screen.getByTestId('chart-error-state')).toBeInTheDocument();
      expect(screen.getByText(/failed to load user growth chart/i)).toBeInTheDocument();

      // Assert: Successful chart displays
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument(); // Revenue chart
    });

    it('should recover from WebSocket connection failures', async () => {
      // This test will FAIL until WebSocket recovery is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Simulate WebSocket connection failure
      const wsInstance = new MockWebSocket('ws://localhost/ws/admin/metrics');
      if (wsInstance.onerror) {
        wsInstance.onerror(new Event('error'));
      }

      // Assert: Connection error indicator
      await waitFor(() => {
        expect(screen.getByTestId('websocket-error-indicator')).toBeInTheDocument();
        expect(screen.getByText(/real-time updates unavailable/i)).toBeInTheDocument();
      });

      // Assert: Automatic reconnection attempt
      await waitFor(() => {
        expect(screen.getByText(/attempting to reconnect/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Performance and Caching', () => {
    it('should implement metric caching to reduce API calls', async () => {
      // This test will FAIL until caching is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
        headers: new Headers({
          'Cache-Control': 'max-age=300', // 5 minutes
          'ETag': '"abc123"',
        }),
      });

      const user = userEvent.setup();
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // First API call made
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Act: Navigate away and back (simulate route change)
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Assert: No new API call due to cache (within 5 minutes)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Assert: Cache hit indicator
      expect(screen.getByTestId('cache-hit-indicator')).toBeInTheDocument();
    });

    it('should optimize chart rendering for large datasets', async () => {
      // This test will FAIL until chart optimization is implemented

      const largeDataset = {
        labels: Array.from({ length: 1000 }, (_, i) => `Day ${i + 1}`),
        datasets: [{
          label: 'Large Dataset',
          data: Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000)),
        }],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockMetrics }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: largeDataset }),
        });

      render(<Dashboard />);

      // Assert: Chart renders with data sampling/virtualization
      await waitFor(() => {
        const chart = screen.getByTestId('line-chart');
        const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
        expect(chartData.labels.length).toBeLessThan(100); // Sampled data
      });

      // Assert: Performance optimization indicator
      expect(screen.getByTestId('chart-optimized-indicator')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Responsive Design', () => {
    it('should meet accessibility requirements for dashboard components', async () => {
      // This test will FAIL until accessibility features are implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Assert: ARIA labels and roles
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Admin Dashboard');

      const metricsRegion = screen.getByRole('region', { name: /key metrics/i });
      expect(metricsRegion).toBeInTheDocument();

      const chartsRegion = screen.getByRole('region', { name: /analytics charts/i });
      expect(chartsRegion).toBeInTheDocument();

      // Assert: Keyboard navigation
      const firstMetricCard = screen.getByTestId('total-users-card');
      expect(firstMetricCard).toHaveAttribute('tabindex', '0');
      expect(firstMetricCard).toHaveAttribute('role', 'button');

      // Assert: Screen reader announcements
      expect(screen.getByLabelText(/15,420 total users/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard loaded successfully/i)).toBeInTheDocument();
    });

    it('should adapt layout for different screen sizes', async () => {
      // This test will FAIL until responsive design is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });

      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Mock window.matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
      });

      // Assert: Mobile layout applied
      const metricsGrid = screen.getByTestId('metrics-grid');
      expect(metricsGrid).toHaveClass('grid-cols-1'); // Single column on mobile

      const chartsContainer = screen.getByTestId('charts-container');
      expect(chartsContainer).toHaveClass('flex-col'); // Stacked charts on mobile

      // Assert: Condensed metric cards
      expect(screen.getByTestId('condensed-metric-view')).toBeInTheDocument();
    });
  });
});