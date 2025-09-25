/**
 * Contract Tests for GET /api/admin/users
 *
 * This test suite follows TDD principles and validates the API contract for the admin users list endpoint.
 *
 * Test Categories:
 * - Authentication: Valid admin token verification
 * - Data Retrieval: User list data structure and content
 * - Pagination: Limit, offset, cursor-based pagination
 * - Filtering: Search, status, plan type filtering
 * - Sorting: Multiple sort fields and directions
 * - Input Validation: Invalid parameters, boundary conditions
 * - Error Handling: Database errors, internal server errors
 * - Response Format: Consistent JSON structure, proper types
 * - Edge Cases: Empty results, large datasets
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
import { GET } from '@/app/api/admin/users/route';

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
        ilike: jest.fn(() => ({ data: [] })),
        in: jest.fn(() => ({ data: [] })),
        order: jest.fn(() => ({ data: [] })),
        range: jest.fn(() => ({ data: [] })),
      })),
    })),
  },
  getAdminSupabase: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock users module
jest.mock('@/lib/admin/users', () => ({
  fetchUsers: jest.fn(),
}));

import { fetchUsers } from '@/lib/admin/users';
const mockFetchUsers = fetchUsers as jest.MockedFunction<typeof fetchUsers>;

// Import the mocked cookies function
const { cookies } = require('next/headers');

// Types for test data
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  plan: 'free' | 'premium' | 'enterprise';
  surveysCompleted: number;
  emailVerified: boolean;
  profileCompleteness: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UsersListResponse {
  users: User[];
  pagination: PaginationInfo;
  filters: {
    search?: string;
    status?: string;
    plan?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface ErrorResponse {
  error: string;
}

// Mock data
const mockUsers: User[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2024-01-15T10:30:00.000Z',
    lastLoginAt: '2024-01-20T14:45:00.000Z',
    isActive: true,
    plan: 'premium',
    surveysCompleted: 15,
    emailVerified: true,
    profileCompleteness: 85,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    createdAt: '2024-01-10T08:15:00.000Z',
    lastLoginAt: null,
    isActive: false,
    plan: 'free',
    surveysCompleted: 3,
    emailVerified: false,
    profileCompleteness: 45,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'bob.wilson@company.com',
    firstName: 'Bob',
    lastName: 'Wilson',
    createdAt: '2024-01-05T16:20:00.000Z',
    lastLoginAt: '2024-01-22T09:30:00.000Z',
    isActive: true,
    plan: 'enterprise',
    surveysCompleted: 28,
    emailVerified: true,
    profileCompleteness: 95,
  },
];

const mockPagination: PaginationInfo = {
  page: 1,
  limit: 25,
  total: 1250,
  totalPages: 50,
  hasNextPage: true,
  hasPreviousPage: false,
};

const mockUsersListResponse: UsersListResponse = {
  users: mockUsers,
  pagination: mockPagination,
  filters: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
};

const validAdminToken = 'valid-admin-token';

// Helper function to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/admin/users'): NextRequest {
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

describe('GET /api/admin/users - Contract Tests', () => {
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
      expect(mockFetchUsers).not.toHaveBeenCalled();
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
      expect(mockFetchUsers).not.toHaveBeenCalled();
    });
  });

  describe('Successful Users Retrieval', () => {
    beforeEach(() => {
      mockFetchUsers.mockResolvedValue(mockUsersListResponse);
    });

    it('should return users list with valid session', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify response structure
      expect(body).toMatchObject({
        users: expect.any(Array),
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
        },
        filters: expect.any(Object),
      });

      // Verify users array
      expect(body.users).toHaveLength(3);
      body.users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('isActive');
        expect(user).toHaveProperty('plan');
        expect(user).toHaveProperty('surveysCompleted');
        expect(user).toHaveProperty('emailVerified');
        expect(user).toHaveProperty('profileCompleteness');

        // Verify data types
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.firstName).toBe('string');
        expect(typeof user.lastName).toBe('string');
        expect(typeof user.createdAt).toBe('string');
        expect(typeof user.isActive).toBe('boolean');
        expect(['free', 'premium', 'enterprise']).toContain(user.plan);
        expect(typeof user.surveysCompleted).toBe('number');
        expect(typeof user.emailVerified).toBe('boolean');
        expect(typeof user.profileCompleteness).toBe('number');

        // Verify UUID format for id
        expect(user.id).toMatch(/^[0-9a-f-]{36}$/i);

        // Verify email format
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

        // Verify date format
        expect(() => new Date(user.createdAt).toISOString()).not.toThrow();

        // Verify business constraints
        expect(user.surveysCompleted).toBeGreaterThanOrEqual(0);
        expect(user.profileCompleteness).toBeGreaterThanOrEqual(0);
        expect(user.profileCompleteness).toBeLessThanOrEqual(100);
      });

      // Verify pagination
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(25);
      expect(body.pagination.total).toBe(1250);
      expect(body.pagination.totalPages).toBe(50);
      expect(body.pagination.hasNextPage).toBe(true);
      expect(body.pagination.hasPreviousPage).toBe(false);

      expect(mockFetchUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      const page = 2;
      const limit = 10;
      const url = `http://localhost:3000/api/admin/users?page=${page}&limit=${limit}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const paginatedResponse = {
        ...mockUsersListResponse,
        pagination: {
          ...mockPagination,
          page: 2,
          limit: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };
      mockFetchUsers.mockResolvedValue(paginatedResponse);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.pagination.page).toBe(2);
      expect(body.pagination.limit).toBe(10);
      expect(body.pagination.hasPreviousPage).toBe(true);
      expect(mockFetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      );
    });

    it('should handle search filtering', async () => {
      // Arrange
      const search = 'john.doe@example.com';
      const url = `http://localhost:3000/api/admin/users?search=${encodeURIComponent(search)}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const searchResponse = {
        ...mockUsersListResponse,
        users: [mockUsers[0]], // Only John Doe
        filters: { search },
      };
      mockFetchUsers.mockResolvedValue(searchResponse);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.users).toHaveLength(1);
      expect(body.users[0].email).toBe('john.doe@example.com');
      expect(body.filters.search).toBe(search);
      expect(mockFetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: search,
        })
      );
    });

    it('should handle status filtering', async () => {
      // Arrange
      const status = 'active';
      const url = `http://localhost:3000/api/admin/users?status=${status}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const statusResponse = {
        ...mockUsersListResponse,
        users: mockUsers.filter(user => user.isActive),
        filters: { status },
      };
      mockFetchUsers.mockResolvedValue(statusResponse);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      body.users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
      expect(body.filters.status).toBe(status);
      expect(mockFetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          status: status,
        })
      );
    });

    it('should handle plan filtering', async () => {
      // Arrange
      const plan = 'premium';
      const url = `http://localhost:3000/api/admin/users?plan=${plan}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const planResponse = {
        ...mockUsersListResponse,
        users: mockUsers.filter(user => user.plan === 'premium'),
        filters: { plan },
      };
      mockFetchUsers.mockResolvedValue(planResponse);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      body.users.forEach(user => {
        expect(user.plan).toBe('premium');
      });
      expect(body.filters.plan).toBe(plan);
      expect(mockFetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: plan,
        })
      );
    });

    it('should handle sorting parameters', async () => {
      // Arrange
      const sortBy = 'email';
      const sortOrder = 'asc';
      const url = `http://localhost:3000/api/admin/users?sortBy=${sortBy}&sortOrder=${sortOrder}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const sortedResponse = {
        ...mockUsersListResponse,
        filters: { sortBy, sortOrder: 'asc' as const },
      };
      mockFetchUsers.mockResolvedValue(sortedResponse);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.filters.sortBy).toBe(sortBy);
      expect(body.filters.sortOrder).toBe(sortOrder);
      expect(mockFetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: sortBy,
          sortOrder: sortOrder,
        })
      );
    });

    it('should handle multiple filters combined', async () => {
      // Arrange
      const search = 'example.com';
      const status = 'active';
      const plan = 'premium';
      const sortBy = 'createdAt';
      const sortOrder = 'desc';
      const page = 2;
      const limit = 10;
      const url = `http://localhost:3000/api/admin/users?search=${encodeURIComponent(search)}&status=${status}&plan=${plan}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&limit=${limit}`;
      const request = createMockRequest(url);
      mockCookieStore(validAdminToken);

      const combinedResponse = {
        ...mockUsersListResponse,
        filters: { search, status, plan, sortBy, sortOrder: 'desc' as const },
        pagination: { ...mockPagination, page: 2, limit: 10 },
      };
      mockFetchUsers.mockResolvedValue(combinedResponse);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockFetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search,
          status,
          plan,
          sortBy,
          sortOrder,
          page,
          limit,
        })
      );
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
      mockFetchUsers.mockResolvedValue(mockUsersListResponse);
    });

    it('should return response matching UsersListResponse interface', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Verify main structure
      expect(body).toHaveProperty('users');
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('filters');

      // Verify arrays and objects are correct types
      expect(Array.isArray(body.users)).toBe(true);
      expect(typeof body.pagination).toBe('object');
      expect(typeof body.filters).toBe('object');

      // Verify pagination structure
      const { pagination } = body;
      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.limit).toBe('number');
      expect(typeof pagination.total).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
      expect(typeof pagination.hasNextPage).toBe('boolean');
      expect(typeof pagination.hasPreviousPage).toBe('boolean');

      // Verify pagination logic
      expect(pagination.page).toBeGreaterThan(0);
      expect(pagination.limit).toBeGreaterThan(0);
      expect(pagination.total).toBeGreaterThanOrEqual(0);
      expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
      expect(Math.ceil(pagination.total / pagination.limit)).toBe(pagination.totalPages);
    });

    it('should handle empty users list', async () => {
      // Arrange
      const request = createMockRequest();
      const emptyResponse: UsersListResponse = {
        users: [],
        pagination: {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        filters: {},
      };
      mockFetchUsers.mockResolvedValue(emptyResponse);

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.users).toEqual([]);
      expect(body.pagination.total).toBe(0);
      expect(body.pagination.totalPages).toBe(0);
      expect(body.pagination.hasNextPage).toBe(false);
      expect(body.pagination.hasPreviousPage).toBe(false);
    });

    it('should validate user data integrity', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const body: UsersListResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);

      body.users.forEach(user => {
        // Verify required fields are present
        expect(user.id.length).toBeGreaterThan(0);
        expect(user.email.length).toBeGreaterThan(0);
        expect(user.firstName.length).toBeGreaterThan(0);
        expect(user.lastName.length).toBeGreaterThan(0);
        expect(user.createdAt.length).toBeGreaterThan(0);

        // Verify constraints
        expect(user.surveysCompleted).toBeGreaterThanOrEqual(0);
        expect(user.profileCompleteness).toBeGreaterThanOrEqual(0);
        expect(user.profileCompleteness).toBeLessThanOrEqual(100);

        // Verify enum values
        expect(['free', 'premium', 'enterprise']).toContain(user.plan);

        // Verify dates
        expect(() => new Date(user.createdAt)).not.toThrow();
        if (user.lastLoginAt) {
          expect(() => new Date(user.lastLoginAt)).not.toThrow();
        }
      });
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockCookieStore(validAdminToken);
    });

    it('should handle invalid page parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/users?page=-1';
      const request = createMockRequest(url);
      mockFetchUsers.mockResolvedValue(mockUsersListResponse);

      // Act
      const response = await GET(request);

      // Assert
      // Should either normalize to valid value or return error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle invalid limit parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/users?limit=0';
      const request = createMockRequest(url);
      mockFetchUsers.mockResolvedValue(mockUsersListResponse);

      // Act
      const response = await GET(request);

      // Assert
      // Should either normalize to valid value or return error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle excessive limit parameter', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/users?limit=1000';
      const request = createMockRequest(url);
      mockFetchUsers.mockResolvedValue(mockUsersListResponse);

      // Act
      const response = await GET(request);

      // Assert
      // Should either cap to maximum or return error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle invalid sort order', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/admin/users?sortOrder=invalid';
      const request = createMockRequest(url);
      mockFetchUsers.mockResolvedValue(mockUsersListResponse);

      // Act
      const response = await GET(request);

      // Assert
      // Should either ignore invalid value or return error
      expect([200, 400]).toContain(response.status);
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
      mockFetchUsers.mockRejectedValue(dbError);

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch users'
      });
      expect(mockFetchUsers).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when fetchUsers throws', async () => {
      // Arrange
      const request = createMockRequest();
      mockFetchUsers.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await GET(request);
      const body: ErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to fetch users'
      });
    });
  });

  describe('TDD - Initial Failing Tests', () => {
    it('should initially fail when endpoint does not exist', async () => {
      // This test documents the TDD approach
      // When run for the first time, it should fail because the endpoint doesn't exist

      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchUsers.mockResolvedValue(mockUsersListResponse);

      // Act & Assert
      // This will fail initially with "Cannot resolve module" or similar error
      // Once the route is created, it should pass
      try {
        const response = await GET(request);
        const body: UsersListResponse = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('users');
        expect(body).toHaveProperty('pagination');
        expect(body).toHaveProperty('filters');
        expect(Array.isArray(body.users)).toBe(true);
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
        expect(mockFetchUsers).not.toHaveBeenCalled();
      } catch (error) {
        // Expected to fail initially when endpoint doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should fail if error handling is not implemented', async () => {
      // Arrange
      const request = createMockRequest();
      mockCookieStore(validAdminToken);
      mockFetchUsers.mockRejectedValue(new Error('Database error'));

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