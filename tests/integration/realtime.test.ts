/**
 * T030: Integration Tests for Real-time Metric Updates
 *
 * This test suite validates the complete real-time metrics update system.
 * Tests the integration between WebSocket connections, metric streaming, and UI updates.
 *
 * Test Scenarios:
 * - WebSocket connection establishment and management
 * - Real-time metric streaming and data synchronization
 * - Live dashboard updates with animation and transitions
 * - Multi-channel subscription management
 * - Connection resilience and automatic reconnection
 * - Real-time notification system
 * - Live user activity monitoring
 * - Performance monitoring under high-frequency updates
 *
 * Integration Points:
 * - WebSocket /ws/admin/metrics
 * - WebSocket /ws/admin/users/activity
 * - WebSocket /ws/admin/system/health
 * - GET /api/admin/realtime/status
 * - POST /api/admin/realtime/subscribe
 * - Client-side state management
 * - UI update optimization
 * - Browser notification API
 *
 * This test follows TDD principles and will FAIL initially until the complete
 * real-time functionality is implemented.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { RealtimeDashboard } from '@/components/realtime/RealtimeDashboard';
import { RealtimeMetrics } from '@/components/realtime/RealtimeMetrics';
import { LiveActivityFeed } from '@/components/realtime/LiveActivityFeed';
import { ConnectionStatus } from '@/components/realtime/ConnectionStatus';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState: number = MockWebSocket.CONNECTING;
  url: string;

  private static instances: MockWebSocket[] = [];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    MockWebSocket.instances.push(this);

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send = jest.fn((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  });

  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  });

  // Test helper to simulate connection failure
  simulateError = (error?: Error) => {
    this.readyState = MockWebSocket.CLOSED;
    this.onerror?.(new ErrorEvent('error', { error }));
  };

  // Test helper to simulate received message
  simulateMessage = (data: any) => {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  };

  static getInstance = (url?: string): MockWebSocket | undefined => {
    return MockWebSocket.instances.find(ws => !url || ws.url.includes(url));
  };

  static clearInstances = () => {
    MockWebSocket.instances = [];
  };
}

// @ts-ignore
global.WebSocket = MockWebSocket;

// Mock fetch for initial API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock browser notifications
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: jest.fn().mockImplementation((title, options) => ({
    title,
    body: options?.body,
    icon: options?.icon,
    close: jest.fn(),
  })),
});

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'granted',
});

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: jest.fn().mockResolvedValue('granted'),
});

// Mock performance API for timing measurements
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/admin/dashboard',
}));

// Test data
const mockMetricUpdate = {
  type: 'metric_update',
  timestamp: new Date().toISOString(),
  data: {
    totalUsers: 15425, // +5 from previous
    activeUsers: 8940,  // +8 from previous
    newUsers: 237,      // +3 from previous
    revenue: 125150,    // +150 from previous
  },
  changes: {
    totalUsers: { previous: 15420, current: 15425, delta: +5 },
    activeUsers: { previous: 8932, current: 8940, delta: +8 },
    newUsers: { previous: 234, current: 237, delta: +3 },
    revenue: { previous: 125000, current: 125150, delta: +150 },
  },
};

const mockUserActivity = {
  type: 'user_activity',
  timestamp: new Date().toISOString(),
  data: {
    userId: 'user-001',
    userName: 'John Doe',
    action: 'vote_created',
    details: {
      voteId: 'vote-123',
      voteTitle: 'Best Programming Languages 2024',
      voteValue: 'JavaScript',
    },
    location: 'New York, NY',
    deviceInfo: {
      platform: 'desktop',
      browser: 'Chrome',
    },
  },
};

const mockSystemAlert = {
  type: 'system_alert',
  timestamp: new Date().toISOString(),
  severity: 'warning',
  data: {
    alertId: 'alert-456',
    title: 'High Database Load',
    message: 'Database CPU usage has exceeded 80% for the past 5 minutes',
    affectedServices: ['user-service', 'vote-service'],
    suggestedActions: ['Scale database', 'Optimize queries'],
  },
};

const mockConnectionStatus = {
  connected: true,
  lastUpdate: new Date().toISOString(),
  channels: [
    { name: 'metrics', status: 'connected', messageCount: 145 },
    { name: 'user_activity', status: 'connected', messageCount: 89 },
    { name: 'system_alerts', status: 'connected', messageCount: 12 },
  ],
  latency: 42, // ms
  reconnectCount: 0,
};

describe('T030: Real-time Metric Updates - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPush.mockClear();
    MockWebSocket.clearInstances();

    // Clear any existing timers
    jest.clearAllTimers();
  });

  describe('WebSocket Connection Management', () => {
    it('should establish WebSocket connections to multiple channels', async () => {
      // This test will FAIL until WebSocket connection management is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeDashboard />);

      // Assert: Multiple WebSocket connections established
      await waitFor(() => {
        expect(MockWebSocket.getInstance('metrics')).toBeDefined();
        expect(MockWebSocket.getInstance('user_activity')).toBeDefined();
        expect(MockWebSocket.getInstance('system_alerts')).toBeDefined();
      });

      // Assert: Connection status API called
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/realtime/status');

      // Assert: Connection indicators shown
      await waitFor(() => {
        expect(screen.getByTestId('realtime-status-connected')).toBeInTheDocument();
        expect(screen.getByText(/3 channels connected/i)).toBeInTheDocument();
        expect(screen.getByText(/latency: 42ms/i)).toBeInTheDocument();
      });
    });

    it('should handle connection failures and implement automatic reconnection', async () => {
      // This test will FAIL until connection resilience is implemented

      jest.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { ...mockConnectionStatus, connected: false } }),
      });

      render(<RealtimeDashboard />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('metrics')).toBeDefined();
      });

      const metricsWs = MockWebSocket.getInstance('metrics')!;

      // Simulate connection failure
      act(() => {
        metricsWs.simulateError(new Error('Connection lost'));
      });

      // Assert: Connection error state
      await waitFor(() => {
        expect(screen.getByTestId('realtime-status-disconnected')).toBeInTheDocument();
        expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
      });

      // Assert: Reconnection attempt indicator
      expect(screen.getByText(/attempting to reconnect/i)).toBeInTheDocument();

      // Simulate reconnection after delay
      act(() => {
        jest.advanceTimersByTime(5000); // 5 second reconnect delay
      });

      // Assert: New connection attempted
      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBeGreaterThan(3); // New instances created
      });

      // Simulate successful reconnection
      const newMetricsWs = MockWebSocket.instances[MockWebSocket.instances.length - 3];
      act(() => {
        newMetricsWs.readyState = MockWebSocket.OPEN;
        newMetricsWs.onopen?.(new Event('open'));
      });

      // Assert: Connection restored
      await waitFor(() => {
        expect(screen.getByTestId('realtime-status-connected')).toBeInTheDocument();
        expect(screen.getByText(/connection restored/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should support selective channel subscription management', async () => {
      // This test will FAIL until subscription management is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConnectionStatus }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const user = userEvent.setup();
      render(<RealtimeDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('realtime-status-connected')).toBeInTheDocument();
      });

      // Act: Open channel subscription settings
      const settingsButton = screen.getByRole('button', { name: /realtime settings/i });
      await user.click(settingsButton);

      // Assert: Channel subscription options
      expect(screen.getByText(/channel subscriptions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/metrics updates/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user activity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/system alerts/i)).toBeInTheDocument();

      // Act: Disable user activity channel
      const userActivityToggle = screen.getByLabelText(/user activity/i);
      await user.click(userActivityToggle);

      // Act: Apply subscription changes
      const applyButton = screen.getByRole('button', { name: /apply changes/i });
      await user.click(applyButton);

      // Assert: Subscription API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/realtime/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channels: ['metrics', 'system_alerts'], // user_activity removed
          }),
        });
      });

      // Assert: Connection closed for disabled channel
      const userActivityWs = MockWebSocket.getInstance('user_activity');
      expect(userActivityWs?.close).toHaveBeenCalled();
    });
  });

  describe('Real-time Metric Updates', () => {
    it('should receive and display live metric updates with animations', async () => {
      // This test will FAIL until live metric updates are implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeMetrics />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('metrics')).toBeDefined();
      });

      const metricsWs = MockWebSocket.getInstance('metrics')!;

      // Simulate initial state
      expect(screen.getByText('15,420')).toBeInTheDocument(); // Initial total users

      // Simulate real-time metric update
      act(() => {
        metricsWs.simulateMessage(mockMetricUpdate);
      });

      // Assert: Metrics updated with animation
      await waitFor(() => {
        expect(screen.getByText('15,425')).toBeInTheDocument(); // Updated total users
        expect(screen.getByTestId('metric-update-animation')).toBeInTheDocument();
      });

      // Assert: Change indicators shown
      expect(screen.getByText('+5')).toBeInTheDocument(); // Total users delta
      expect(screen.getByText('+8')).toBeInTheDocument(); // Active users delta
      expect(screen.getByTestId('positive-change-indicator')).toBeInTheDocument();

      // Assert: Update timestamp shown
      expect(screen.getByText(/updated just now/i)).toBeInTheDocument();
    });

    it('should handle high-frequency updates with rate limiting and batching', async () => {
      // This test will FAIL until update batching is implemented

      jest.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeMetrics updateBatchInterval={1000} />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('metrics')).toBeDefined();
      });

      const metricsWs = MockWebSocket.getInstance('metrics')!;

      // Simulate rapid-fire updates
      const updates = Array.from({ length: 10 }, (_, i) => ({
        ...mockMetricUpdate,
        data: {
          ...mockMetricUpdate.data,
          totalUsers: 15420 + i + 1,
          activeUsers: 8932 + i + 1,
        },
      }));

      // Send updates rapidly
      updates.forEach((update, index) => {
        setTimeout(() => {
          act(() => {
            metricsWs.simulateMessage(update);
          });
        }, index * 50); // 50ms intervals
      });

      // Advance time to trigger rapid updates
      act(() => {
        jest.advanceTimersByTime(500); // All updates sent
      });

      // Assert: Updates are batched (not all individual updates shown)
      await waitFor(() => {
        expect(screen.getByTestId('update-batching-indicator')).toBeInTheDocument();
        expect(screen.getByText(/batching updates/i)).toBeInTheDocument();
      });

      // Advance time to trigger batch processing
      act(() => {
        jest.advanceTimersByTime(1000); // Batch interval
      });

      // Assert: Final batched values shown
      await waitFor(() => {
        expect(screen.getByText('15,430')).toBeInTheDocument(); // Final value after batching
        expect(screen.getByText(/10 updates processed/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should provide historical trend visualization with live updates', async () => {
      // This test will FAIL until trend visualization is implemented

      const trendData = {
        type: 'trend_update',
        data: {
          metric: 'totalUsers',
          window: '1h',
          points: [
            { timestamp: '2024-01-20T14:00:00Z', value: 15400 },
            { timestamp: '2024-01-20T14:15:00Z', value: 15410 },
            { timestamp: '2024-01-20T14:30:00Z', value: 15420 },
            { timestamp: '2024-01-20T14:45:00Z', value: 15425 }, // Live update
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeMetrics showTrends />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('metrics')).toBeDefined();
      });

      const metricsWs = MockWebSocket.getInstance('metrics')!;

      // Simulate trend data update
      act(() => {
        metricsWs.simulateMessage(trendData);
      });

      // Assert: Trend chart updated
      await waitFor(() => {
        expect(screen.getByTestId('live-trend-chart')).toBeInTheDocument();
        expect(screen.getByText(/15,425 users/i)).toBeInTheDocument();
      });

      // Assert: Live data point highlighted
      expect(screen.getByTestId('live-data-point')).toBeInTheDocument();

      // Simulate additional live update
      const newTrendUpdate = {
        ...trendData,
        data: {
          ...trendData.data,
          points: [
            ...trendData.data.points,
            { timestamp: '2024-01-20T15:00:00Z', value: 15430 },
          ],
        },
      };

      act(() => {
        metricsWs.simulateMessage(newTrendUpdate);
      });

      // Assert: Chart smoothly updated
      await waitFor(() => {
        expect(screen.getByText(/15,430 users/i)).toBeInTheDocument();
        expect(screen.getByTestId('chart-update-animation')).toBeInTheDocument();
      });
    });
  });

  describe('Live Activity Monitoring', () => {
    it('should display real-time user activity feed with filtering', async () => {
      // This test will FAIL until activity feed is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      const user = userEvent.setup();
      render(<LiveActivityFeed />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('user_activity')).toBeDefined();
      });

      const activityWs = MockWebSocket.getInstance('user_activity')!;

      // Simulate user activity
      act(() => {
        activityWs.simulateMessage(mockUserActivity);
      });

      // Assert: Activity displayed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/created a vote/i)).toBeInTheDocument();
        expect(screen.getByText('Best Programming Languages 2024')).toBeInTheDocument();
        expect(screen.getByText('New York, NY')).toBeInTheDocument();
      });

      // Assert: Activity metadata shown
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
      expect(screen.getByTestId('activity-type-vote')).toBeInTheDocument();

      // Act: Apply activity filter
      const filterButton = screen.getByRole('button', { name: /filter activity/i });
      await user.click(filterButton);

      const voteFilter = screen.getByLabelText(/votes only/i);
      await user.click(voteFilter);

      // Assert: Filter applied
      expect(screen.getByTestId('active-filter-votes')).toBeInTheDocument();

      // Simulate different activity type (should be filtered out)
      const commentActivity = {
        ...mockUserActivity,
        data: {
          ...mockUserActivity.data,
          action: 'comment_created',
          details: { commentId: 'comment-456', content: 'Great discussion!' },
        },
      };

      act(() => {
        activityWs.simulateMessage(commentActivity);
      });

      // Assert: Filtered activity not shown
      expect(screen.queryByText(/created a comment/i)).not.toBeInTheDocument();
    });

    it('should support activity aggregation and summary statistics', async () => {
      // This test will FAIL until activity aggregation is implemented

      const activitySummary = {
        type: 'activity_summary',
        timestamp: new Date().toISOString(),
        data: {
          timeWindow: '1h',
          summary: {
            totalActions: 145,
            uniqueUsers: 89,
            topActions: [
              { action: 'vote_created', count: 56 },
              { action: 'comment_created', count: 34 },
              { action: 'profile_updated', count: 28 },
              { action: 'user_login', count: 27 },
            ],
            topLocations: [
              { location: 'New York, NY', count: 23 },
              { location: 'Los Angeles, CA', count: 18 },
              { location: 'Chicago, IL', count: 15 },
            ],
          },
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<LiveActivityFeed showSummary />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('user_activity')).toBeDefined();
      });

      const activityWs = MockWebSocket.getInstance('user_activity')!;

      // Simulate activity summary update
      act(() => {
        activityWs.simulateMessage(activitySummary);
      });

      // Assert: Summary statistics displayed
      await waitFor(() => {
        expect(screen.getByText(/145 total actions/i)).toBeInTheDocument();
        expect(screen.getByText(/89 unique users/i)).toBeInTheDocument();
        expect(screen.getByText(/last hour/i)).toBeInTheDocument();
      });

      // Assert: Top actions breakdown
      expect(screen.getByText(/votes: 56/i)).toBeInTheDocument();
      expect(screen.getByText(/comments: 34/i)).toBeInTheDocument();
      expect(screen.getByText(/profiles: 28/i)).toBeInTheDocument();

      // Assert: Geographic distribution
      expect(screen.getByText(/new york: 23/i)).toBeInTheDocument();
      expect(screen.getByText(/los angeles: 18/i)).toBeInTheDocument();
    });

    it('should trigger notifications for significant activity spikes', async () => {
      // This test will FAIL until activity notifications are implemented

      const activitySpike = {
        type: 'activity_spike',
        timestamp: new Date().toISOString(),
        severity: 'info',
        data: {
          metric: 'vote_created',
          currentRate: 45, // votes per minute
          normalRate: 12,  // typical rate
          spikeRatio: 3.75,
          duration: '5 minutes',
          possibleCause: 'Trending vote: "Best Programming Languages 2024"',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<LiveActivityFeed enableNotifications />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('user_activity')).toBeDefined();
      });

      const activityWs = MockWebSocket.getInstance('user_activity')!;

      // Simulate activity spike
      act(() => {
        activityWs.simulateMessage(activitySpike);
      });

      // Assert: Spike notification displayed
      await waitFor(() => {
        expect(screen.getByTestId('activity-spike-notification')).toBeInTheDocument();
        expect(screen.getByText(/activity spike detected/i)).toBeInTheDocument();
        expect(screen.getByText(/45 votes per minute/i)).toBeInTheDocument();
        expect(screen.getByText(/3.7x normal rate/i)).toBeInTheDocument();
      });

      // Assert: Browser notification triggered
      expect(window.Notification).toHaveBeenCalledWith(
        'Activity Spike Detected',
        expect.objectContaining({
          body: expect.stringContaining('45 votes per minute'),
          icon: expect.any(String),
        })
      );

      // Assert: Possible cause shown
      expect(screen.getByText(/trending vote/i)).toBeInTheDocument();
    });
  });

  describe('System Health and Alerts', () => {
    it('should monitor system health with real-time alerts', async () => {
      // This test will FAIL until system monitoring is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeDashboard />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('system_alerts')).toBeDefined();
      });

      const alertsWs = MockWebSocket.getInstance('system_alerts')!;

      // Simulate system alert
      act(() => {
        alertsWs.simulateMessage(mockSystemAlert);
      });

      // Assert: System alert displayed
      await waitFor(() => {
        expect(screen.getByTestId('system-alert-warning')).toBeInTheDocument();
        expect(screen.getByText('High Database Load')).toBeInTheDocument();
        expect(screen.getByText(/cpu usage has exceeded 80%/i)).toBeInTheDocument();
      });

      // Assert: Affected services listed
      expect(screen.getByText('user-service')).toBeInTheDocument();
      expect(screen.getByText('vote-service')).toBeInTheDocument();

      // Assert: Suggested actions provided
      expect(screen.getByText('Scale database')).toBeInTheDocument();
      expect(screen.getByText('Optimize queries')).toBeInTheDocument();

      // Assert: Alert severity indicated
      expect(screen.getByTestId('alert-severity-warning')).toBeInTheDocument();
    });

    it('should provide system performance metrics with threshold monitoring', async () => {
      // This test will FAIL until performance monitoring is implemented

      const performanceMetrics = {
        type: 'performance_metrics',
        timestamp: new Date().toISOString(),
        data: {
          cpu: { usage: 78, threshold: 80, status: 'warning' },
          memory: { usage: 65, threshold: 85, status: 'normal' },
          database: {
            connections: { current: 145, max: 200, status: 'normal' },
            queryTime: { avg: 125, threshold: 200, status: 'normal' },
          },
          api: {
            responseTime: { avg: 89, threshold: 150, status: 'normal' },
            errorRate: { rate: 0.5, threshold: 2.0, status: 'normal' },
          },
          websocket: {
            connections: { current: 256, max: 1000, status: 'normal' },
            messageRate: { rate: 145, capacity: 500, status: 'normal' },
          },
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeDashboard showSystemHealth />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('system_alerts')).toBeDefined();
      });

      const systemWs = MockWebSocket.getInstance('system_alerts')!;

      // Simulate performance metrics update
      act(() => {
        systemWs.simulateMessage(performanceMetrics);
      });

      // Assert: Performance metrics displayed
      await waitFor(() => {
        expect(screen.getByText(/system performance/i)).toBeInTheDocument();
        expect(screen.getByText(/cpu: 78%/i)).toBeInTheDocument();
        expect(screen.getByText(/memory: 65%/i)).toBeInTheDocument();
        expect(screen.getByText(/db connections: 145\/200/i)).toBeInTheDocument();
      });

      // Assert: Threshold status indicators
      expect(screen.getByTestId('cpu-status-warning')).toBeInTheDocument(); // Near threshold
      expect(screen.getByTestId('memory-status-normal')).toBeInTheDocument();
      expect(screen.getByTestId('api-status-normal')).toBeInTheDocument();

      // Assert: WebSocket specific metrics
      expect(screen.getByText(/ws connections: 256/i)).toBeInTheDocument();
      expect(screen.getByText(/message rate: 145\/min/i)).toBeInTheDocument();
    });

    it('should handle critical alerts with immediate notification and escalation', async () => {
      // This test will FAIL until critical alert handling is implemented

      const criticalAlert = {
        type: 'critical_alert',
        timestamp: new Date().toISOString(),
        severity: 'critical',
        data: {
          alertId: 'critical-001',
          title: 'Database Connection Pool Exhausted',
          message: 'All database connections are in use. New requests are being queued.',
          affectedServices: ['all'],
          immediateActions: [
            'Restart connection pool',
            'Scale database instances',
            'Enable connection pooling optimization',
          ],
          escalationLevel: 'immediate',
          estimatedImpact: 'All user-facing features affected',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      const user = userEvent.setup();
      render(<RealtimeDashboard />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('system_alerts')).toBeDefined();
      });

      const alertsWs = MockWebSocket.getInstance('system_alerts')!;

      // Simulate critical alert
      act(() => {
        alertsWs.simulateMessage(criticalAlert);
      });

      // Assert: Critical alert modal appears
      await waitFor(() => {
        expect(screen.getByTestId('critical-alert-modal')).toBeInTheDocument();
        expect(screen.getByText('CRITICAL ALERT')).toBeInTheDocument();
        expect(screen.getByText('Database Connection Pool Exhausted')).toBeInTheDocument();
      });

      // Assert: Immediate actions provided
      expect(screen.getByText('Restart connection pool')).toBeInTheDocument();
      expect(screen.getByText('Scale database instances')).toBeInTheDocument();

      // Assert: Impact assessment shown
      expect(screen.getByText(/all user-facing features affected/i)).toBeInTheDocument();

      // Assert: Critical notification sent
      expect(window.Notification).toHaveBeenCalledWith(
        'CRITICAL ALERT',
        expect.objectContaining({
          body: expect.stringContaining('Database Connection Pool'),
          tag: 'critical-alert',
        })
      );

      // Act: Acknowledge alert
      const acknowledgeButton = screen.getByRole('button', { name: /acknowledge/i });
      await user.click(acknowledgeButton);

      // Assert: Alert acknowledged
      expect(screen.getByText(/alert acknowledged/i)).toBeInTheDocument();
      expect(screen.getByTestId('alert-acknowledged-indicator')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization and Resource Management', () => {
    it('should optimize rendering performance under high-frequency updates', async () => {
      // This test will FAIL until performance optimization is implemented

      jest.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeMetrics optimizeUpdates maxUpdateRate={10} />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('metrics')).toBeDefined();
      });

      const metricsWs = MockWebSocket.getInstance('metrics')!;

      // Simulate very high-frequency updates (100 updates in rapid succession)
      const updates = Array.from({ length: 100 }, (_, i) => ({
        ...mockMetricUpdate,
        data: { ...mockMetricUpdate.data, totalUsers: 15420 + i },
      }));

      // Send all updates rapidly
      updates.forEach((update) => {
        act(() => {
          metricsWs.simulateMessage(update);
        });
      });

      // Assert: Performance optimization kicks in
      await waitFor(() => {
        expect(screen.getByTestId('performance-optimization-active')).toBeInTheDocument();
        expect(screen.getByText(/limiting update rate/i)).toBeInTheDocument();
      });

      // Advance time to allow throttled updates
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Assert: Final value reached despite throttling
      await waitFor(() => {
        expect(screen.getByText('15,519')).toBeInTheDocument(); // Final value
      });

      // Assert: Performance metrics shown
      expect(screen.getByText(/100 updates received/i)).toBeInTheDocument();
      expect(screen.getByText(/10 renders performed/i)).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should manage memory usage with message history cleanup', async () => {
      // This test will FAIL until memory management is implemented

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<LiveActivityFeed maxHistorySize={50} enableMemoryOptimization />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('user_activity')).toBeDefined();
      });

      const activityWs = MockWebSocket.getInstance('user_activity')!;

      // Simulate 100 activity messages (exceeds max history)
      Array.from({ length: 100 }, (_, i) => {
        const activity = {
          ...mockUserActivity,
          data: {
            ...mockUserActivity.data,
            userId: `user-${i.toString().padStart(3, '0')}`,
            userName: `User ${i}`,
          },
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        };

        act(() => {
          activityWs.simulateMessage(activity);
        });
      });

      // Assert: Memory optimization active
      await waitFor(() => {
        expect(screen.getByTestId('memory-optimization-active')).toBeInTheDocument();
      });

      // Assert: History size limited
      const activityItems = screen.getAllByTestId(/activity-item-/);
      expect(activityItems.length).toBeLessThanOrEqual(50);

      // Assert: Most recent items retained
      expect(screen.getByText('User 99')).toBeInTheDocument(); // Most recent
      expect(screen.queryByText('User 0')).not.toBeInTheDocument(); // Oldest removed

      // Assert: Memory usage indicator
      expect(screen.getByText(/memory usage optimized/i)).toBeInTheDocument();
    });

    it('should provide connection quality monitoring and adaptive features', async () => {
      // This test will FAIL until connection quality monitoring is implemented

      jest.useFakeTimers();

      const connectionQuality = {
        type: 'connection_quality',
        timestamp: new Date().toISOString(),
        data: {
          latency: 250, // High latency
          packetLoss: 2.5,
          stability: 'poor',
          recommendedActions: [
            'Reduce update frequency',
            'Enable data compression',
            'Switch to polling fallback',
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConnectionStatus }),
      });

      render(<RealtimeDashboard adaptiveMode />);

      await waitFor(() => {
        expect(MockWebSocket.getInstance('metrics')).toBeDefined();
      });

      const metricsWs = MockWebSocket.getInstance('metrics')!;

      // Simulate poor connection quality
      act(() => {
        metricsWs.simulateMessage(connectionQuality);
      });

      // Assert: Connection quality warning
      await waitFor(() => {
        expect(screen.getByTestId('connection-quality-poor')).toBeInTheDocument();
        expect(screen.getByText(/high latency: 250ms/i)).toBeInTheDocument();
        expect(screen.getByText(/packet loss: 2.5%/i)).toBeInTheDocument();
      });

      // Assert: Adaptive recommendations shown
      expect(screen.getByText(/adaptive mode suggestions/i)).toBeInTheDocument();
      expect(screen.getByText('Reduce update frequency')).toBeInTheDocument();

      // Assert: Auto-adaptation triggered
      await waitFor(() => {
        expect(screen.getByTestId('adaptive-mode-active')).toBeInTheDocument();
        expect(screen.getByText(/updates reduced to conserve bandwidth/i)).toBeInTheDocument();
      });

      // Simulate connection improvement
      const improvedQuality = {
        ...connectionQuality,
        data: {
          latency: 45,
          packetLoss: 0.1,
          stability: 'good',
        },
      };

      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds later
        metricsWs.simulateMessage(improvedQuality);
      });

      // Assert: Normal mode restored
      await waitFor(() => {
        expect(screen.getByTestId('connection-quality-good')).toBeInTheDocument();
        expect(screen.getByText(/normal update frequency restored/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  afterEach(() => {
    // Cleanup WebSocket instances
    MockWebSocket.clearInstances();
  });
});