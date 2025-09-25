/**
 * T024: Integration Tests for Admin Authentication Flow with 2FA
 *
 * This test suite validates the complete admin authentication workflow including 2FA.
 * Tests the integration between login endpoint, 2FA verification, and session management.
 *
 * Test Scenarios:
 * - Complete successful authentication flow with 2FA
 * - 2FA verification failures and retries
 * - Session management after successful authentication
 * - Authentication state persistence across page loads
 * - Automatic logout on session expiry
 * - Multiple failed login attempts and lockout
 * - Cross-tab session synchronization
 * - Recovery from network failures during auth flow
 *
 * Integration Points:
 * - POST /api/admin/auth/login
 * - POST /api/admin/auth/2fa/verify
 * - GET /api/admin/auth/session
 * - POST /api/admin/auth/logout
 * - Cookie management
 * - Local storage for auth state
 * - Real-time session updates
 *
 * This test follows TDD principles and will FAIL initially until the complete
 * authentication flow is implemented.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { LoginForm } from '@/components/auth/LoginForm';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  usePathname: () => '/admin/login',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock local storage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock cookies
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

import Cookies from 'js-cookie';
const mockCookies = Cookies as jest.Mocked<typeof Cookies>;

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
  close = jest.fn(() => {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  });
}

// @ts-ignore
global.WebSocket = MockWebSocket;

// Test data
const validCredentials = {
  email: 'admin@vownow.com',
  password: 'validPassword123',
};

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'admin@vownow.com',
  role: 'admin',
  twoFactorEnabled: true,
};

const mockSessionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('T024: Admin Authentication Flow with 2FA - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockCookies.get.mockClear();
    mockCookies.set.mockClear();
    mockCookies.remove.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete successful login flow with 2FA verification', async () => {
      // This test will FAIL until the complete auth flow is implemented

      // Setup: Mock successful login response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            requiresTwoFactor: true,
            temporaryToken: 'temp_token_123',
          }),
        })
        // Mock successful 2FA verification
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            user: mockUser,
            token: mockSessionToken,
          }),
        })
        // Mock session validation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            valid: true,
            user: mockUser,
          }),
        });

      // Act: Render login form and submit credentials
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: validCredentials.email } });
      fireEvent.change(passwordInput, { target: { value: validCredentials.password } });
      fireEvent.click(loginButton);

      // Assert: Login API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validCredentials),
        });
      });

      // Act: 2FA form should appear
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      const twoFactorInput = screen.getByLabelText(/verification code/i);
      const verifyButton = screen.getByRole('button', { name: /verify/i });

      fireEvent.change(twoFactorInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      // Assert: 2FA verification API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/auth/2fa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temporaryToken: 'temp_token_123',
            code: '123456',
          }),
        });
      });

      // Assert: Session token stored and redirect occurs
      await waitFor(() => {
        expect(mockCookies.set).toHaveBeenCalledWith('admin-session', mockSessionToken, {
          expires: 7,
          secure: true,
          sameSite: 'strict',
        });
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin-user', JSON.stringify(mockUser));
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should handle 2FA verification failure and allow retry', async () => {
      // This test will FAIL until retry logic is implemented

      // Setup: Mock login success but 2FA failure
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            requiresTwoFactor: true,
            temporaryToken: 'temp_token_123',
          }),
        })
        // First 2FA attempt fails
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Invalid verification code',
          }),
        })
        // Second 2FA attempt succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            user: mockUser,
            token: mockSessionToken,
          }),
        });

      render(<LoginForm />);

      // Complete login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(emailInput, { target: { value: validCredentials.email } });
      fireEvent.change(passwordInput, { target: { value: validCredentials.password } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for 2FA form
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      // First 2FA attempt with wrong code
      const twoFactorInput = screen.getByLabelText(/verification code/i);
      fireEvent.change(twoFactorInput, { target: { value: '000000' } });
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Assert: Error message appears
      await waitFor(() => {
        expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
      });

      // Second attempt with correct code
      fireEvent.change(twoFactorInput, { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      // Assert: Success and redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });
  });

  describe('Session Management', () => {
    it('should validate existing session on app load', async () => {
      // This test will FAIL until session validation is implemented

      // Setup: Existing session cookie
      mockCookies.get.mockReturnValue(mockSessionToken);
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Mock session validation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          user: mockUser,
        }),
      });

      // Act: Render dashboard (which should validate session)
      render(<DashboardLayout />);

      // Assert: Session validation called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/auth/session', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockSessionToken}`,
          },
        });
      });

      // Assert: User remains authenticated
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });

    it('should handle session expiry and redirect to login', async () => {
      // This test will FAIL until session expiry handling is implemented

      // Setup: Existing session cookie but expired
      mockCookies.get.mockReturnValue(mockSessionToken);

      // Mock expired session response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Session expired',
        }),
      });

      // Act: Render dashboard
      render(<DashboardLayout />);

      // Assert: Session cleared and redirect to login
      await waitFor(() => {
        expect(mockCookies.remove).toHaveBeenCalledWith('admin-session');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin-user');
        expect(mockReplace).toHaveBeenCalledWith('/admin/login');
      });
    });

    it('should synchronize session across multiple tabs', async () => {
      // This test will FAIL until cross-tab sync is implemented

      // Setup: Mock storage event (another tab logged out)
      const storageEvent = new StorageEvent('storage', {
        key: 'admin-user',
        oldValue: JSON.stringify(mockUser),
        newValue: null,
        url: 'http://localhost:3000',
      });

      render(<DashboardLayout />);

      // Act: Simulate storage event from another tab
      window.dispatchEvent(storageEvent);

      // Assert: Current tab redirects to login
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin/login');
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should recover from network errors during authentication', async () => {
      // This test will FAIL until network error recovery is implemented

      // Setup: Network error then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            requiresTwoFactor: true,
            temporaryToken: 'temp_token_123',
          }),
        });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(emailInput, { target: { value: validCredentials.email } });
      fireEvent.change(passwordInput, { target: { value: validCredentials.password } });

      // First attempt fails
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Assert: Error message and retry option
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Act: Retry
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      // Assert: Second attempt proceeds to 2FA
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      // This test will FAIL until lockout mechanism is implemented

      // Setup: Multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'Invalid credentials',
            attemptsRemaining: 4 - i,
          }),
        });
      }

      // Final attempt returns lockout
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Account temporarily locked',
          lockoutExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        fireEvent.change(emailInput, { target: { value: validCredentials.email } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
      }

      // Final attempt
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      // Assert: Lockout message and disabled form
      await waitFor(() => {
        expect(screen.getByText(/account temporarily locked/i)).toBeInTheDocument();
        expect(loginButton).toBeDisabled();
      });
    });

    it('should maintain real-time session status updates via WebSocket', async () => {
      // This test will FAIL until WebSocket session management is implemented

      // Setup: Valid session
      mockCookies.get.mockReturnValue(mockSessionToken);
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      render(<DashboardLayout />);

      // Simulate WebSocket session invalidation message
      const wsInstance = MockWebSocket.prototype;
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/ws/admin/session')
        );
      });

      // Simulate receiving session invalidation message
      const sessionInvalidMessage = {
        type: 'session_invalidated',
        reason: 'admin_action',
        message: 'Your session has been terminated by another administrator',
      };

      // Mock WebSocket message
      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(sessionInvalidMessage),
        }));
      }

      // Assert: Session cleared and redirect
      await waitFor(() => {
        expect(mockCookies.remove).toHaveBeenCalledWith('admin-session');
        expect(mockReplace).toHaveBeenCalledWith('/admin/login');
      });
    });
  });

  describe('Cleanup and Teardown', () => {
    afterEach(() => {
      // Clean up any WebSocket connections
      if (global.WebSocket) {
        const instances = (global.WebSocket as any).__instances || [];
        instances.forEach((ws: MockWebSocket) => ws.close());
      }
    });
  });
});