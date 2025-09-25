/**
 * Contract Tests for POST /api/admin/auth/login
 *
 * This test suite follows TDD principles and validates the API contract for the admin authentication endpoint.
 *
 * Test Categories:
 * - Successful Authentication: Valid admin credentials
 * - Authentication Failures: Invalid credentials, non-admin users, Supabase errors
 * - Input Validation: Missing/empty email/password fields
 * - Error Handling: Internal server errors, malformed JSON
 * - Response Format: Consistent JSON structure, headers
 * - Edge Cases: Null values, extra fields, long strings
 *
 * Mocking Strategy:
 * - NextResponse for HTTP responses
 * - Supabase authentication via signInAdmin function
 * - Next.js cookies for session management
 *
 * The tests are designed to fail initially if the implementation is incomplete or incorrect,
 * demonstrating true TDD behavior.
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/auth/login/route';

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

// Mock the admin auth module
jest.mock('@/lib/admin/auth', () => ({
  signInAdmin: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

import { signInAdmin } from '@/lib/admin/auth';

const mockSignInAdmin = signInAdmin as jest.MockedFunction<typeof signInAdmin>;

// Types for test data
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginSuccessResponse {
  success: true;
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

interface LoginErrorResponse {
  error: string;
}

type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

// Test helper to create mock Next.js request
async function makeRequest(body: any): Promise<Response> {
  const request = {
    json: jest.fn().mockResolvedValue(body),
    url: 'http://localhost:3000/api/admin/auth/login',
    method: 'POST',
    headers: {
      get: jest.fn().mockReturnValue('application/json'),
    },
  } as unknown as NextRequest;

  return await POST(request);
}

// Test data
const validLoginData: LoginRequest = {
  email: 'admin@vownow.com',
  password: 'validPassword123',
};

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'admin@vownow.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('POST /api/admin/auth/login - Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Authentication', () => {
    it('should return success response with user data for valid admin credentials', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Act
      const response = await makeRequest(validLoginData);
      const responseData: LoginResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        user: mockUser,
      });
      expect(mockSignInAdmin).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
      expect(mockSignInAdmin).toHaveBeenCalledTimes(1);
    });

    it('should handle successful authentication with additional user properties', async () => {
      // Arrange
      const userWithExtraProps = {
        ...mockUser,
        role: 'admin',
        last_sign_in_at: '2024-01-01T12:00:00.000Z',
      };

      mockSignInAdmin.mockResolvedValue({
        success: true,
        user: userWithExtraProps,
      });

      // Act
      const response = await makeRequest(validLoginData);
      const responseData: LoginResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        user: userWithExtraProps,
      });
    });
  });

  describe('Authentication Failures', () => {
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        error: 'Invalid credentials',
      });

      const invalidCredentials: LoginRequest = {
        email: 'admin@vownow.com',
        password: 'wrongPassword',
      };

      // Act
      const response = await makeRequest(invalidCredentials);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        error: 'Invalid credentials',
      });
      expect(mockSignInAdmin).toHaveBeenCalledWith(
        invalidCredentials.email,
        invalidCredentials.password
      );
    });

    it('should return 401 for non-existent user', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        error: 'User not found',
      });

      const nonExistentUser: LoginRequest = {
        email: 'nonexistent@vownow.com',
        password: 'anyPassword',
      };

      // Act
      const response = await makeRequest(nonExistentUser);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        error: 'User not found',
      });
    });

    it('should return 401 for user without admin role', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        error: 'Unauthorized: Admin access only',
      });

      const regularUser: LoginRequest = {
        email: 'user@vownow.com',
        password: 'validPassword123',
      };

      // Act
      const response = await makeRequest(regularUser);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        error: 'Unauthorized: Admin access only',
      });
    });

    it('should return 401 for Supabase authentication errors', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        error: 'Email not confirmed',
      });

      // Act
      const response = await makeRequest(validLoginData);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        error: 'Email not confirmed',
      });
    });
  });

  describe('Input Validation', () => {
    it('should return 400 when email is missing', async () => {
      // Arrange
      const requestWithoutEmail = {
        password: 'validPassword123',
      };

      // Act
      const response = await makeRequest(requestWithoutEmail);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'Email and password are required',
      });
      expect(mockSignInAdmin).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      // Arrange
      const requestWithoutPassword = {
        email: 'admin@vownow.com',
      };

      // Act
      const response = await makeRequest(requestWithoutPassword);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'Email and password are required',
      });
      expect(mockSignInAdmin).not.toHaveBeenCalled();
    });

    it('should return 400 when both email and password are missing', async () => {
      // Arrange
      const emptyRequest = {};

      // Act
      const response = await makeRequest(emptyRequest);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'Email and password are required',
      });
      expect(mockSignInAdmin).not.toHaveBeenCalled();
    });

    it('should return 400 when email is empty string', async () => {
      // Arrange
      const requestWithEmptyEmail = {
        email: '',
        password: 'validPassword123',
      };

      // Act
      const response = await makeRequest(requestWithEmptyEmail);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'Email and password are required',
      });
      expect(mockSignInAdmin).not.toHaveBeenCalled();
    });

    it('should return 400 when password is empty string', async () => {
      // Arrange
      const requestWithEmptyPassword = {
        email: 'admin@vownow.com',
        password: '',
      };

      // Act
      const response = await makeRequest(requestWithEmptyPassword);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'Email and password are required',
      });
      expect(mockSignInAdmin).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for internal server errors', async () => {
      // Arrange
      mockSignInAdmin.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await makeRequest(validLoginData);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        error: 'Internal server error',
      });
      expect(mockSignInAdmin).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
    });

    it('should return 500 when signInAdmin throws unexpected error', async () => {
      // Arrange
      mockSignInAdmin.mockRejectedValue(new TypeError('Cannot read property of undefined'));

      // Act
      const response = await makeRequest(validLoginData);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        error: 'Internal server error',
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      // Arrange
      const malformedRequest = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token in JSON')),
        url: 'http://localhost:3000/api/admin/auth/login',
        method: 'POST',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      } as unknown as NextRequest;

      // Act
      const response = await POST(malformedRequest);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        error: 'Internal server error',
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response with correct Content-Type header', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Act
      const response = await makeRequest(validLoginData);

      // Assert
      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('should return consistent error response format', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        error: 'Some authentication error',
      });

      // Act
      const response = await makeRequest(validLoginData);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(responseData).toHaveProperty('error');
      expect(typeof responseData.error).toBe('string');
      expect(responseData).not.toHaveProperty('success');
      expect(responseData).not.toHaveProperty('user');
    });

    it('should return consistent success response format', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Act
      const response = await makeRequest(validLoginData);
      const responseData: LoginSuccessResponse = await response.json();

      // Assert
      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('user');
      expect(responseData.user).toHaveProperty('id');
      expect(responseData.user).toHaveProperty('email');
      expect(responseData).not.toHaveProperty('error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values in request body', async () => {
      // Arrange
      const requestWithNulls = {
        email: null,
        password: null,
      };

      // Act
      const response = await makeRequest(requestWithNulls);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'Email and password are required',
      });
    });

    it('should handle undefined values in request body', async () => {
      // Arrange
      const requestWithUndefined = {
        email: undefined,
        password: undefined,
      };

      // Act
      const response = await makeRequest(requestWithUndefined);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'Email and password are required',
      });
    });

    it('should ignore extra fields in request body', async () => {
      // Arrange
      mockSignInAdmin.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const requestWithExtraFields = {
        ...validLoginData,
        extraField: 'should be ignored',
        anotherField: 123,
      };

      // Act
      const response = await makeRequest(requestWithExtraFields);
      const responseData: LoginResponse = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        user: mockUser,
      });
      expect(mockSignInAdmin).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
    });

    it('should handle very long email and password strings', async () => {
      // Arrange
      const longString = 'a'.repeat(1000);
      mockSignInAdmin.mockResolvedValue({
        error: 'Invalid credentials',
      });

      const requestWithLongStrings = {
        email: `${longString}@example.com`,
        password: longString,
      };

      // Act
      const response = await makeRequest(requestWithLongStrings);
      const responseData: LoginErrorResponse = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        error: 'Invalid credentials',
      });
      expect(mockSignInAdmin).toHaveBeenCalledWith(
        requestWithLongStrings.email,
        requestWithLongStrings.password
      );
    });
  });
});