/**
 * T029: Integration Tests for User Search and Filtering
 *
 * This test suite validates the complete user search and filtering workflow.
 * Tests the integration between search APIs, filtering components, and result display.
 *
 * Test Scenarios:
 * - Full-text search across user profiles and metadata
 * - Advanced filtering with multiple criteria combinations
 * - Real-time search suggestions and autocomplete
 * - Bulk user operations (select, modify, export)
 * - Search result sorting and pagination
 * - Saved search queries and quick filters
 * - Search performance optimization
 * - Search analytics and user behavior tracking
 *
 * Integration Points:
 * - GET /api/admin/users/search
 * - POST /api/admin/users/filter
 * - GET /api/admin/users/suggestions
 * - POST /api/admin/users/bulk-actions
 * - GET /api/admin/users/saved-searches
 * - WebSocket for real-time search updates
 * - Search indexing and optimization
 * - Faceted search and aggregations
 *
 * This test follows TDD principles and will FAIL initially until the complete
 * search and filtering functionality is implemented.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { UserSearch } from '@/components/users/UserSearch';
import { SearchFilters } from '@/components/users/SearchFilters';
import { SearchResults } from '@/components/users/SearchResults';
import { BulkActions } from '@/components/users/BulkActions';

// Mock debounce for search input
jest.mock('lodash.debounce', () => {
  return jest.fn((fn) => {
    fn.cancel = jest.fn();
    fn.flush = jest.fn();
    return fn;
  });
});

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
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({
    get: jest.fn((key) => {
      const params: Record<string, string> = {
        q: '',
        status: 'all',
        page: '1',
        sort: 'created_at',
        order: 'desc',
      };
      return params[key] || null;
    }),
    toString: () => 'q=&status=all&page=1&sort=created_at&order=desc',
  }),
  usePathname: () => '/admin/users',
}));

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock intersection observer for infinite scroll
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn((element) => {
    // Simulate intersection for testing
    setTimeout(() => callback([{ isIntersecting: true, target: element }]), 100);
  }),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
});

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
const mockUsers = [
  {
    id: 'user-001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    status: 'active',
    userType: 'premium',
    createdAt: '2023-06-15T08:30:00.000Z',
    lastLoginAt: '2024-01-20T14:22:00.000Z',
    location: 'New York, NY',
    age: 32,
    profileCompleteness: 85,
    totalVotes: 245,
    reputation: 1200,
  },
  {
    id: 'user-002',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    status: 'active',
    userType: 'free',
    createdAt: '2023-07-22T14:15:00.000Z',
    lastLoginAt: '2024-01-19T09:45:00.000Z',
    location: 'Los Angeles, CA',
    age: 28,
    profileCompleteness: 92,
    totalVotes: 180,
    reputation: 950,
  },
  {
    id: 'user-003',
    email: 'mike.wilson@example.com',
    name: 'Mike Wilson',
    status: 'inactive',
    userType: 'free',
    createdAt: '2023-05-10T11:20:00.000Z',
    lastLoginAt: '2023-12-15T16:30:00.000Z',
    location: 'Chicago, IL',
    age: 45,
    profileCompleteness: 60,
    totalVotes: 45,
    reputation: 320,
  },
];

const mockSearchSuggestions = [
  { type: 'user', value: 'john.doe@example.com', label: 'John Doe (john.doe@example.com)' },
  { type: 'domain', value: 'example.com', label: 'Users from example.com (3 users)' },
  { type: 'location', value: 'New York', label: 'Users in New York (12 users)' },
  { type: 'saved', value: 'premium_inactive', label: 'Premium Inactive Users (saved search)' },
];

const mockSavedSearches = [
  {
    id: 'search-001',
    name: 'Premium Inactive Users',
    query: {
      userType: 'premium',
      status: 'inactive',
      lastLoginBefore: '2023-12-01',
    },
    createdAt: '2024-01-10T10:00:00.000Z',
    resultCount: 156,
  },
  {
    id: 'search-002',
    name: 'New Users This Month',
    query: {
      createdAfter: '2024-01-01',
      profileCompleteness: { min: 80 },
    },
    createdAt: '2024-01-15T15:30:00.000Z',
    resultCount: 89,
  },
];

const mockSearchFacets = {
  status: [
    { value: 'active', count: 12500, label: 'Active' },
    { value: 'inactive', count: 2100, label: 'Inactive' },
    { value: 'suspended', count: 85, label: 'Suspended' },
  ],
  userType: [
    { value: 'free', count: 10200, label: 'Free' },
    { value: 'premium', count: 4500, label: 'Premium' },
  ],
  location: [
    { value: 'United States', count: 8500, label: 'United States' },
    { value: 'Canada', count: 2100, label: 'Canada' },
    { value: 'United Kingdom', count: 1800, label: 'United Kingdom' },
  ],
};

describe('T029: User Search and Filtering - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
    Object.values(mockNotify).forEach(fn => fn.mockClear());
  });

  describe('Search Interface and Basic Functionality', () => {
    it('should provide comprehensive search interface with real-time suggestions', async () => {
      // This test will FAIL until search interface is implemented

      // Setup: Mock search API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers, totalCount: 15420, page: 1, pageSize: 20 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSearchSuggestions }),
        });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Assert: Search interface loads
      expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /advanced filters/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saved searches/i })).toBeInTheDocument();

      // Act: Start typing in search box
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'john');

      // Assert: Search suggestions API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/users/suggestions?q=john',
          expect.any(Object)
        );
      });

      // Assert: Suggestions dropdown appears
      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
        expect(screen.getByText('John Doe (john.doe@example.com)')).toBeInTheDocument();
        expect(screen.getByText('Users from example.com (3 users)')).toBeInTheDocument();
      });

      // Act: Select a suggestion
      await user.click(screen.getByText('John Doe (john.doe@example.com)'));

      // Assert: Search executed with selected suggestion
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/users/search?q=john.doe%40example.com&page=1&pageSize=20',
          expect.any(Object)
        );
      });

      // Assert: Search results displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should handle full-text search across multiple user fields', async () => {
      // This test will FAIL until full-text search is implemented

      const searchResults = [
        {
          ...mockUsers[0],
          searchHighlight: {
            email: '<mark>john.doe</mark>@example.com',
            name: '<mark>John</mark> Doe',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: searchResults, totalCount: 1, searchTerms: ['john'] }),
      });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Act: Search for user across multiple fields
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'john new york premium');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Assert: Full-text search API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/users/search?q=john%20new%20york%20premium&page=1&pageSize=20',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': expect.stringContaining('Bearer'),
            },
          }
        );
      });

      // Assert: Search highlights displayed
      await waitFor(() => {
        expect(screen.getByTestId('search-highlight')).toBeInTheDocument();
        // Check that HTML highlighting is rendered (would be processed by dangerouslySetInnerHTML)
        expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      });

      // Assert: Search metadata shown
      expect(screen.getByText(/1 result found/i)).toBeInTheDocument();
      expect(screen.getByText(/searched for: john, new, york, premium/i)).toBeInTheDocument();
    });

    it('should provide instant search with debounced API calls', async () => {
      // This test will FAIL until instant search is implemented

      jest.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockUsers.slice(0, 1), totalCount: 1 }),
      });

      const user = userEvent.setup({ delay: null });
      render(<UserSearch enableInstantSearch />);

      const searchInput = screen.getByPlaceholderText(/search users/i);

      // Act: Type rapidly (should debounce)
      await user.type(searchInput, 'j');
      await user.type(searchInput, 'o');
      await user.type(searchInput, 'h');
      await user.type(searchInput, 'n');

      // Assert: No API calls yet (debounced)
      expect(mockFetch).not.toHaveBeenCalled();

      // Act: Wait for debounce delay
      jest.advanceTimersByTime(500);

      // Assert: Single API call made after debounce
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/users/search?q=john&page=1&pageSize=20&instant=true',
          expect.any(Object)
        );
      });

      // Assert: Instant results displayed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByTestId('instant-search-indicator')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Advanced Filtering and Faceted Search', () => {
    it('should provide comprehensive filtering interface with faceted search', async () => {
      // This test will FAIL until advanced filtering is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers, totalCount: 15420, facets: mockSearchFacets }),
        });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Act: Open advanced filters
      const advancedFiltersButton = screen.getByRole('button', { name: /advanced filters/i });
      await user.click(advancedFiltersButton);

      // Assert: Filter panel opens with facets
      expect(screen.getByText(/advanced filters/i)).toBeInTheDocument();

      // Assert: Status facets
      const statusSection = screen.getByTestId('facet-status');
      expect(within(statusSection).getByText('Active (12,500)')).toBeInTheDocument();
      expect(within(statusSection).getByText('Inactive (2,100)')).toBeInTheDocument();
      expect(within(statusSection).getByText('Suspended (85)')).toBeInTheDocument();

      // Assert: User type facets
      const userTypeSection = screen.getByTestId('facet-userType');
      expect(within(userTypeSection).getByText('Free (10,200)')).toBeInTheDocument();
      expect(within(userTypeSection).getByText('Premium (4,500)')).toBeInTheDocument();

      // Act: Apply status filter
      const activeStatusFilter = within(statusSection).getByLabelText(/active/i);
      await user.click(activeStatusFilter);

      // Act: Apply user type filter
      const premiumTypeFilter = within(userTypeSection).getByLabelText(/premium/i);
      await user.click(premiumTypeFilter);

      // Act: Apply filters
      const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyFiltersButton);

      // Assert: Filtered search API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/users/search?status=active&userType=premium&page=1&pageSize=20',
          expect.any(Object)
        );
      });

      // Assert: Active filters displayed
      expect(screen.getByTestId('active-filter-status')).toBeInTheDocument();
      expect(screen.getByTestId('active-filter-userType')).toBeInTheDocument();
      expect(screen.getByText(/2 filters applied/i)).toBeInTheDocument();
    });

    it('should support complex filter combinations with date ranges and numeric ranges', async () => {
      // This test will FAIL until complex filtering is implemented

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers.slice(0, 2), totalCount: 2 }),
      });

      const user = userEvent.setup();
      render(<SearchFilters />);

      // Act: Set date range filter
      const createdAfterPicker = screen.getByLabelText(/created after/i);
      const createdBeforePicker = screen.getByLabelText(/created before/i);

      await user.type(createdAfterPicker, '2023-06-01');
      await user.type(createdBeforePicker, '2023-08-31');

      // Act: Set numeric range filters
      const minAgeInput = screen.getByLabelText(/minimum age/i);
      const maxAgeInput = screen.getByLabelText(/maximum age/i);

      await user.type(minAgeInput, '25');
      await user.type(maxAgeInput, '40');

      // Act: Set profile completeness range
      const minCompletenessInput = screen.getByLabelText(/minimum profile completeness/i);
      await user.type(minCompletenessInput, '80');

      // Act: Set activity filter
      const lastLoginAfter = screen.getByLabelText(/last login after/i);
      await user.type(lastLoginAfter, '2024-01-01');

      // Act: Apply complex filters
      const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyFiltersButton);

      // Assert: Complex filter API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/users/search'),
          {
            method: 'GET',
            headers: expect.any(Object),
          }
        );

        // Check that URL contains all filter parameters
        const callUrl = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as string;
        expect(callUrl).toContain('createdAfter=2023-06-01');
        expect(callUrl).toContain('createdBefore=2023-08-31');
        expect(callUrl).toContain('minAge=25');
        expect(callUrl).toContain('maxAge=40');
        expect(callUrl).toContain('minProfileCompleteness=80');
        expect(callUrl).toContain('lastLoginAfter=2024-01-01');
      });

      // Assert: Complex filter summary
      expect(screen.getByText(/6 filters applied/i)).toBeInTheDocument();
      expect(screen.getByText(/created: jun 1 - aug 31, 2023/i)).toBeInTheDocument();
      expect(screen.getByText(/age: 25-40 years/i)).toBeInTheDocument();
    });

    it('should enable filter presets and quick filters', async () => {
      // This test will FAIL until filter presets are implemented

      const filterPresets = [
        { id: 'new_users', name: 'New Users (Last 30 days)', count: 234 },
        { id: 'inactive_premium', name: 'Inactive Premium Users', count: 89 },
        { id: 'low_engagement', name: 'Low Engagement Users', count: 156 },
        { id: 'incomplete_profiles', name: 'Incomplete Profiles', count: 312 },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: filterPresets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers.slice(0, 2), totalCount: 234 }),
        });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Assert: Quick filter presets load
      await waitFor(() => {
        expect(screen.getByText(/quick filters/i)).toBeInTheDocument();
        expect(screen.getByText('New Users (Last 30 days)')).toBeInTheDocument();
        expect(screen.getByText('234')).toBeInTheDocument(); // Count badge
      });

      // Act: Apply quick filter
      const newUsersFilter = screen.getByRole('button', { name: /new users \(last 30 days\)/i });
      await user.click(newUsersFilter);

      // Assert: Quick filter applied
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/users/search?preset=new_users&page=1&pageSize=20',
          expect.any(Object)
        );
      });

      // Assert: Filter indicator
      expect(screen.getByTestId('active-preset-new_users')).toBeInTheDocument();
      expect(screen.getByText(/quick filter: new users/i)).toBeInTheDocument();
    });
  });

  describe('Search Results Display and Interaction', () => {
    it('should display search results with sortable columns and pagination', async () => {
      // This test will FAIL until sortable results are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: mockUsers,
            totalCount: 15420,
            page: 1,
            pageSize: 20,
            sortBy: 'created_at',
            sortOrder: 'desc',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [...mockUsers].reverse(), // Simulated sort change
            totalCount: 15420,
            page: 1,
            pageSize: 20,
            sortBy: 'name',
            sortOrder: 'asc',
          }),
        });

      const user = userEvent.setup();
      render(<SearchResults />);

      // Assert: Results table loads with data
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Assert: Sortable column headers
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      expect(nameHeader).toHaveAttribute('role', 'columnheader');
      expect(within(nameHeader).getByTestId('sort-indicator')).toBeInTheDocument();

      // Assert: Pagination controls
      expect(screen.getByText(/showing 1-20 of 15,420 results/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();

      // Act: Sort by name
      await user.click(nameHeader);

      // Assert: Sort API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/users/search?sort=name&order=asc&page=1&pageSize=20',
          expect.any(Object)
        );
      });

      // Assert: Results reordered
      const tableRows = screen.getAllByRole('row');
      const firstDataRow = tableRows[1]; // Skip header row
      expect(within(firstDataRow).getByText('Jane Smith')).toBeInTheDocument(); // Now first after sorting
    });

    it('should support bulk selection and actions on search results', async () => {
      // This test will FAIL until bulk actions are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers, totalCount: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, affected: 2 }),
        });

      const user = userEvent.setup();
      render(<SearchResults enableBulkActions />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Assert: Bulk selection checkboxes present
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      expect(selectAllCheckbox).toBeInTheDocument();

      const individualCheckboxes = screen.getAllByLabelText(/select user/i);
      expect(individualCheckboxes).toHaveLength(3);

      // Act: Select first two users
      await user.click(individualCheckboxes[0]); // John Doe
      await user.click(individualCheckboxes[1]); // Jane Smith

      // Assert: Bulk actions toolbar appears
      await waitFor(() => {
        expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();
        expect(screen.getByText(/2 users selected/i)).toBeInTheDocument();
      });

      // Assert: Bulk action options available
      expect(screen.getByRole('button', { name: /bulk edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export selected/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change status/i })).toBeInTheDocument();

      // Act: Perform bulk status change
      const changeStatusButton = screen.getByRole('button', { name: /change status/i });
      await user.click(changeStatusButton);

      // Assert: Status change options
      expect(screen.getByText(/change status for 2 users/i)).toBeInTheDocument();
      await user.selectOptions(screen.getByLabelText(/new status/i), 'inactive');

      const confirmStatusChange = screen.getByRole('button', { name: /confirm change/i });
      await user.click(confirmStatusChange);

      // Assert: Bulk action API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/users/bulk-actions',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'change_status',
              userIds: ['user-001', 'user-002'],
              payload: { status: 'inactive' },
            }),
          }
        );
      });

      // Assert: Success notification
      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalledWith('Successfully updated 2 users');
      });
    });

    it('should provide detailed user information in expandable rows', async () => {
      // This test will FAIL until expandable rows are implemented

      const detailedUser = {
        ...mockUsers[0],
        profile: {
          bio: 'Software developer with 5 years of experience',
          interests: ['Technology', 'Programming', 'AI'],
          socialLinks: {
            twitter: '@johndoe',
            linkedin: '/in/johndoe',
          },
        },
        activity: {
          totalSessions: 145,
          avgSessionDuration: 24.5,
          lastAction: 'Voted on "Best Programming Languages 2024"',
          recentVotes: [
            { id: 'vote-001', title: 'Best Programming Languages 2024', date: '2024-01-20' },
            { id: 'vote-002', title: 'Remote Work Preferences', date: '2024-01-19' },
          ],
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers, totalCount: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: detailedUser }),
        });

      const user = userEvent.setup();
      render(<SearchResults />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Act: Expand user details
      const expandButton = screen.getByTestId('expand-user-001');
      await user.click(expandButton);

      // Assert: Detailed user info API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/users/user-001/details',
          expect.any(Object)
        );
      });

      // Assert: Expanded details shown
      await waitFor(() => {
        expect(screen.getByText(/software developer with 5 years/i)).toBeInTheDocument();
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('@johndoe')).toBeInTheDocument();
        expect(screen.getByText(/145 total sessions/i)).toBeInTheDocument();
        expect(screen.getByText(/best programming languages 2024/i)).toBeInTheDocument();
      });

      // Assert: Quick actions available in expanded view
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view full profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /suspend user/i })).toBeInTheDocument();
    });
  });

  describe('Saved Searches and Search Management', () => {
    it('should enable saving and managing search queries', async () => {
      // This test will FAIL until saved searches are implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers, totalCount: 156 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: 'search-003',
              name: 'Premium Users in NY',
              query: {
                location: 'New York',
                userType: 'premium',
                status: 'active',
              },
            }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [...mockSavedSearches, {
            id: 'search-003',
            name: 'Premium Users in NY',
            resultCount: 156,
            createdAt: new Date().toISOString(),
          }] }),
        });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Act: Perform a search with filters
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'New York premium');

      const advancedFiltersButton = screen.getByRole('button', { name: /advanced filters/i });
      await user.click(advancedFiltersButton);

      // Apply filters
      await user.selectOptions(screen.getByLabelText(/location/i), 'New York');
      await user.selectOptions(screen.getByLabelText(/user type/i), 'premium');
      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      await waitFor(() => {
        expect(screen.getByText(/156 results/i)).toBeInTheDocument();
      });

      // Act: Save the search
      const saveSearchButton = screen.getByRole('button', { name: /save search/i });
      await user.click(saveSearchButton);

      // Assert: Save search dialog
      expect(screen.getByText(/save search query/i)).toBeInTheDocument();
      await user.type(screen.getByLabelText(/search name/i), 'Premium Users in NY');

      const confirmSaveButton = screen.getByRole('button', { name: /save/i });
      await user.click(confirmSaveButton);

      // Assert: Save search API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/saved-searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Premium Users in NY',
            query: {
              q: 'New York premium',
              location: 'New York',
              userType: 'premium',
            },
          }),
        });
      });

      // Assert: Success notification
      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalledWith('Search saved successfully');
      });
    });

    it('should provide access to saved searches with quick execution', async () => {
      // This test will FAIL until saved search execution is implemented

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSavedSearches }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers.slice(0, 2), totalCount: 156 }),
        });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Act: Open saved searches
      const savedSearchesButton = screen.getByRole('button', { name: /saved searches/i });
      await user.click(savedSearchesButton);

      // Assert: Saved searches loaded
      await waitFor(() => {
        expect(screen.getByText(/saved searches/i)).toBeInTheDocument();
        expect(screen.getByText('Premium Inactive Users')).toBeInTheDocument();
        expect(screen.getByText('New Users This Month')).toBeInTheDocument();
      });

      // Assert: Search metadata displayed
      expect(screen.getByText(/156 results/i)).toBeInTheDocument();
      expect(screen.getByText(/jan 10, 2024/i)).toBeInTheDocument(); // Created date

      // Act: Execute saved search
      const executeSavedSearch = screen.getByRole('button', { name: /run premium inactive users/i });
      await user.click(executeSavedSearch);

      // Assert: Saved search executed
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          '/api/admin/users/search?userType=premium&status=inactive&lastLoginBefore=2023-12-01&page=1&pageSize=20',
          expect.any(Object)
        );
      });

      // Assert: Search applied indicator
      expect(screen.getByText(/loaded: premium inactive users/i)).toBeInTheDocument();
    });

    it('should support search history and recent searches', async () => {
      // This test will FAIL until search history is implemented

      const searchHistory = [
        {
          id: 'history-001',
          query: 'john new york',
          filters: { location: 'New York' },
          timestamp: '2024-01-20T14:30:00.000Z',
          resultCount: 12,
        },
        {
          id: 'history-002',
          query: 'premium inactive',
          filters: { userType: 'premium', status: 'inactive' },
          timestamp: '2024-01-20T13:15:00.000Z',
          resultCount: 89,
        },
        {
          id: 'history-003',
          query: '',
          filters: { createdAfter: '2024-01-01' },
          timestamp: '2024-01-20T12:00:00.000Z',
          resultCount: 234,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: searchHistory }),
      });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Act: Open search history
      const historyButton = screen.getByRole('button', { name: /search history/i });
      await user.click(historyButton);

      // Assert: Search history loaded
      await waitFor(() => {
        expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
        expect(screen.getByText('"john new york"')).toBeInTheDocument();
        expect(screen.getByText('"premium inactive"')).toBeInTheDocument();
      });

      // Assert: Search metadata
      expect(screen.getByText(/12 results/i)).toBeInTheDocument();
      expect(screen.getByText(/today at 2:30 pm/i)).toBeInTheDocument();

      // Act: Repeat a recent search
      const repeatSearchButton = screen.getByRole('button', { name: /repeat search: john new york/i });
      await user.click(repeatSearchButton);

      // Assert: Search input populated
      const searchInput = screen.getByPlaceholderText(/search users/i);
      expect(searchInput).toHaveValue('john new york');

      // Assert: Filters applied
      expect(screen.getByTestId('active-filter-location')).toBeInTheDocument();
    });
  });

  describe('Search Performance and Optimization', () => {
    it('should implement search result caching and optimization', async () => {
      // This test will FAIL until search caching is implemented

      const cacheKey = 'search:john:page:1';

      // Mock first search call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers.slice(0, 1), totalCount: 1, cached: false }),
        headers: new Headers({
          'X-Cache-Status': 'MISS',
          'X-Search-Time': '245ms',
        }),
      });

      const user = userEvent.setup();
      render(<UserSearch />);

      // Act: First search
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'john');
      await user.click(screen.getByRole('button', { name: /search/i }));

      // Assert: First search completed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByTestId('search-performance')).toBeInTheDocument();
      });

      // Assert: Performance metrics shown
      expect(screen.getByText(/search time: 245ms/i)).toBeInTheDocument();
      expect(screen.getByText(/cache: miss/i)).toBeInTheDocument();

      // Act: Clear search and search again with same query
      await user.clear(searchInput);
      await user.type(searchInput, 'john');

      // Mock cached response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers.slice(0, 1), totalCount: 1, cached: true }),
        headers: new Headers({
          'X-Cache-Status': 'HIT',
          'X-Search-Time': '12ms',
        }),
      });

      await user.click(screen.getByRole('button', { name: /search/i }));

      // Assert: Cached results displayed
      await waitFor(() => {
        expect(screen.getByText(/search time: 12ms/i)).toBeInTheDocument();
        expect(screen.getByText(/cache: hit/i)).toBeInTheDocument();
      });

      // Assert: Cache performance indicator
      expect(screen.getByTestId('cache-hit-indicator')).toBeInTheDocument();
    });

    it('should handle large result sets with virtual scrolling and infinite loading', async () => {
      // This test will FAIL until virtual scrolling is implemented

      const generateMockUsers = (start: number, count: number) =>
        Array.from({ length: count }, (_, i) => ({
          id: `user-${start + i}`,
          email: `user${start + i}@example.com`,
          name: `User ${start + i}`,
          status: 'active',
          userType: 'free',
          createdAt: new Date(Date.now() - (start + i) * 86400000).toISOString(),
        }));

      // Mock initial load
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: generateMockUsers(1, 20),
            totalCount: 50000,
            page: 1,
            hasMore: true,
          }),
        })
        // Mock infinite scroll load
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: generateMockUsers(21, 20),
            totalCount: 50000,
            page: 2,
            hasMore: true,
          }),
        });

      const user = userEvent.setup();
      render(<SearchResults virtualScrolling infiniteScroll />);

      // Act: Initial search
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'user');
      await user.click(screen.getByRole('button', { name: /search/i }));

      // Assert: Initial results loaded
      await waitFor(() => {
        expect(screen.getByText(/50,000 results/i)).toBeInTheDocument();
        expect(screen.getByText('User 1')).toBeInTheDocument();
        expect(screen.getByText('User 20')).toBeInTheDocument();
      });

      // Assert: Virtual scrolling container
      expect(screen.getByTestId('virtual-scroll-container')).toBeInTheDocument();
      expect(screen.getByText(/showing 1-20 of 50,000/i)).toBeInTheDocument();

      // Act: Scroll to trigger infinite loading
      const scrollContainer = screen.getByTestId('virtual-scroll-container');
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });

      // Assert: Additional data loaded
      await waitFor(() => {
        expect(screen.getByText('User 21')).toBeInTheDocument();
        expect(screen.getByText(/showing 1-40 of 50,000/i)).toBeInTheDocument();
      });

      // Assert: Performance optimization indicators
      expect(screen.getByTestId('virtual-scroll-optimization')).toBeInTheDocument();
    });

    it('should provide search analytics and usage tracking', async () => {
      // This test will FAIL until search analytics are implemented

      const searchAnalytics = {
        searchCount: 1,
        searchTerms: ['john', 'new', 'york'],
        resultCount: 12,
        searchTime: 245,
        filtersUsed: ['location'],
        clickthrough: null, // Will be updated if user clicks on result
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUsers.slice(0, 1), totalCount: 12 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const user = userEvent.setup();
      render(<UserSearch analyticsEnabled />);

      // Act: Perform search
      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'john new york');

      const advancedFiltersButton = screen.getByRole('button', { name: /advanced filters/i });
      await user.click(advancedFiltersButton);
      await user.selectOptions(screen.getByLabelText(/location/i), 'New York');
      await user.click(screen.getByRole('button', { name: /apply filters/i }));

      // Assert: Search analytics tracked
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'search_performed',
            data: expect.objectContaining({
              searchTerms: ['john', 'new', 'york'],
              filtersUsed: ['location'],
              resultCount: 12,
            }),
          }),
        });
      });

      // Act: Click on a search result
      await user.click(screen.getByText('John Doe'));

      // Assert: Click-through tracked
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'result_clicked',
            data: expect.objectContaining({
              userId: 'user-001',
              position: 1,
              searchTerms: ['john', 'new', 'york'],
            }),
          }),
        });
      });
    });
  });
});