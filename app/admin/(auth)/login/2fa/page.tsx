'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { TotpUtils } from '@/lib/auth/2fa';
// QR Code library would be imported here
// import { QRCodeSVG } from 'qrcode.react';

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'verify' | 'setup'>('verify');
  const [temporaryToken, setTemporaryToken] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
    backupCodes: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user needs 2FA verification or setup
  useEffect(() => {
    const checkTwoFactorStatus = async () => {
      try {
        // Get temporary token from URL params or localStorage
        const urlToken = searchParams.get('token');
        const storageToken = localStorage.getItem('temp-2fa-token');
        const token = urlToken || storageToken;

        if (token) {
          setTemporaryToken(token);
          setStep('verify');
        } else {
          // User needs to set up 2FA
          setStep('setup');
          await initializeTwoFactorSetup();
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error);
        setError('Failed to initialize two-factor authentication');
      } finally {
        setIsLoading(false);
      }
    };

    checkTwoFactorStatus();
  }, [searchParams]);

  const initializeTwoFactorSetup = useCallback(async () => {
    try {
      // Generate TOTP secret and QR code
      const userEmail = 'admin@example.com'; // This would come from session
      const totpSecret = TotpUtils.generateSecret(userEmail);

      setSetupData(totpSecret);
    } catch (error) {
      console.error('Error initializing 2FA setup:', error);
      setError('Failed to initialize 2FA setup');
    }
  }, []);

  const handleVerificationSuccess = useCallback((data: { user: any; token: string }) => {
    // Store session data
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-user', JSON.stringify(data.user));
      localStorage.setItem('admin-session-token', data.token);
      localStorage.removeItem('temp-2fa-token');
    }

    // Redirect to intended destination
    const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
    router.push(redirectTo);
  }, [searchParams, router]);

  const handleVerificationError = useCallback((error: string) => {
    console.error('2FA verification error:', error);
    setError(error);
  }, []);

  const handleSetupComplete = useCallback(async (verificationCode: string) => {
    if (!setupData) {
      setError('Setup data not available');
      return;
    }

    try {
      setIsLoading(true);

      // Validate the setup code
      const isValid = TotpUtils.validateTotpCode(setupData.secret, verificationCode);

      if (!isValid.isValid) {
        setError('Invalid verification code. Please try again.');
        return;
      }

      // Enable 2FA for the user (this would make an API call)
      const response = await fetch('/api/admin/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: setupData.secret,
          backupCodes: setupData.backupCodes,
          verificationCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enable 2FA');
      }

      // 2FA setup complete, redirect to dashboard
      const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
      router.push(redirectTo);
    } catch (error) {
      console.error('2FA setup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete 2FA setup');
    } finally {
      setIsLoading(false);
    }
  }, [setupData, searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-medium text-red-300 mb-2">Error</h2>
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button
            onClick={() => router.push('/admin/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Show verification form if user has temporary token
  if (step === 'verify' && temporaryToken) {
    return (
      <TwoFactorVerification
        temporaryToken={temporaryToken}
        onSuccess={handleVerificationSuccess}
        onError={handleVerificationError}
      />
    );
  }

  // Show 2FA setup form
  if (step === 'setup' && setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Set Up Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Secure your account with an additional layer of protection
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1: QR Code */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">1. Scan QR Code</h3>
              <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                {/* QR Code would be displayed here */}
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm text-center">
                  QR Code for:<br />
                  {setupData.qrCodeUrl.substring(0, 50)}...
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>

            {/* Step 2: Manual Entry */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">2. Or Enter Manually</h3>
              <div className="bg-gray-700 p-3 rounded font-mono text-sm text-gray-300 break-all">
                {setupData.manualEntryKey}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Enter this key manually if you can't scan the QR code
              </p>
            </div>

            {/* Step 3: Verification */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">3. Verify Setup</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const code = formData.get('code') as string;
                  handleSetupComplete(code);
                }}
                className="space-y-4"
              >
                <input
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  className="block w-full px-4 py-3 text-center text-lg font-mono border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-widest"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Complete Setup'}
                </button>
              </form>
            </div>

            {/* Backup Codes */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Backup Codes</h3>
              <p className="text-sm text-gray-400 mb-4">
                Save these backup codes in a safe place. You can use them to access your account if you lose your device.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 p-2 rounded text-sm font-mono text-center text-gray-300"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center">
        <p className="text-white">Loading two-factor authentication...</p>
      </div>
    </div>
  );
}