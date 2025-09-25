'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: (data: { user: any; requiresTwoFactor?: boolean; temporaryToken?: string }) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function LoginForm({ onSuccess, onError, className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const clearErrors = useCallback(() => {
    setError(null);
    setNetworkError(false);
  }, []);

  const handleLoginSubmit = useCallback(async (data: LoginFormData) => {
    setIsLoading(true);
    clearErrors();

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          const errorMessage = result.error || 'Invalid credentials';
          setError(errorMessage);
          onError?.(errorMessage);

          // Handle account lockout
          if (result.attemptsRemaining !== undefined) {
            setError(`${errorMessage}. ${result.attemptsRemaining} attempts remaining.`);
          }

          if (response.status === 429) {
            setError('Account temporarily locked. Please try again later.');
          }
        } else if (response.status === 400) {
          setError(result.error || 'Please check your input');
        } else {
          setError('Login failed. Please try again.');
        }
        return;
      }

      if (result.success) {
        if (result.requiresTwoFactor) {
          // Handle 2FA requirement
          onSuccess?.({
            user: result.user,
            requiresTwoFactor: true,
            temporaryToken: result.temporaryToken,
          });
        } else {
          // Regular login success
          onSuccess?.({ user: result.user });

          // Store user data in localStorage for client-side access
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('admin-user', JSON.stringify(result.user));
          }

          // Redirect to intended page or dashboard
          const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
          router.push(redirectTo);
        }
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setNetworkError(true);
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      onError?.(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [clearErrors, onError, onSuccess, router, searchParams]);

  const handleRetry = useCallback(() => {
    clearErrors();
    reset();
    setIsLoading(false);
  }, [clearErrors, reset]);

  return (
    <div className={className}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Sign in to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(handleLoginSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  {...register('password')}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="rounded-md bg-red-900/50 p-4 border border-red-700">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-300">{error}</p>
                    {networkError && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {/* Additional Links/Information */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}