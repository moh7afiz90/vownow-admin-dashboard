'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const twoFactorSchema = z.object({
  code: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

interface TwoFactorVerificationProps {
  temporaryToken?: string;
  onSuccess?: (data: { user: any; token: string }) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function TwoFactorVerification({
  temporaryToken,
  onSuccess,
  onError,
  className,
}: TwoFactorVerificationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  const codeValue = watch('code');

  // Timer for TOTP code refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  const handleCodeInput = useCallback((value: string) => {
    // Remove non-digit characters and limit to 6 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setValue('code', cleanValue);

    // Auto-focus next input or submit when code is complete
    if (cleanValue.length === 6) {
      // Auto-submit when 6 digits are entered
      setTimeout(() => {
        handleSubmit(handleVerificationSubmit)();
      }, 100);
    }
  }, [setValue, handleSubmit]);

  const handleVerificationSubmit = useCallback(async (data: TwoFactorFormData) => {
    if (!temporaryToken) {
      setError('No temporary token available. Please login again.');
      return;
    }

    setIsLoading(true);
    clearErrors();

    try {
      const response = await fetch('/api/admin/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temporaryToken,
          code: data.code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError(result.error || 'Invalid verification code');
        } else if (response.status === 429) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError('Verification failed. Please try again.');
        }

        onError?.(result.error || 'Verification failed');

        // Clear the form for retry
        reset();
        return;
      }

      if (result.success) {
        onSuccess?.({
          user: result.user,
          token: result.token,
        });

        // Store session data
        if (typeof window !== 'undefined' && result.user && result.token) {
          window.localStorage.setItem('admin-user', JSON.stringify(result.user));
          // Store 2FA verification status
          window.localStorage.setItem('admin-2fa-verified', JSON.stringify({
            userId: result.user.id,
            timestamp: Date.now(),
            verified: true,
          }));
        }

        // Redirect to intended page or dashboard
        const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
        router.push(redirectTo);
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Network error. Please try again.');
      onError?.(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [temporaryToken, clearErrors, onError, onSuccess, searchParams, router, reset]);

  const handleBackupCode = useCallback(() => {
    // TODO: Implement backup code verification
    setError('Backup code verification not yet implemented');
  }, []);

  const handleBackToLogin = useCallback(() => {
    router.push('/admin/login');
  }, [router]);

  // Format the remaining time display
  const formatTime = useCallback((seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={className}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleSubmit(handleVerificationSubmit)} className="mt-8 space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                {...register('code')}
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                className="block w-full px-4 py-3 text-center text-2xl font-mono border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-widest"
                placeholder="000000"
                onChange={(e) => handleCodeInput(e.target.value)}
                value={codeValue}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-400">{errors.code.message}</p>
              )}
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Code refreshes in{' '}
                <span className="font-mono text-blue-400">{formatTime(remainingTime)}</span>
              </p>
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
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || isSubmitting || codeValue.length !== 6}
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
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            {/* Alternative Options */}
            <div className="space-y-3">
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackupCode}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Use backup code instead
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm text-gray-400 hover:text-gray-300"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          </form>

          {/* Help Information */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Open your authenticator app and enter the 6-digit code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}