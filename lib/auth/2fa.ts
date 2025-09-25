import crypto from 'crypto';

/**
 * Two-Factor Authentication (2FA) utilities using TOTP (Time-based One-Time Password)
 *
 * This module provides utilities for generating and validating TOTP codes
 * compatible with apps like Google Authenticator, Authy, etc.
 */

export interface TotpSecret {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface TotpValidationResult {
  isValid: boolean;
  window?: number;
  usedWindow?: number;
}

/**
 * TOTP Configuration
 */
const TOTP_CONFIG = {
  // Time window size in seconds (typically 30 seconds)
  timeWindow: 30,
  // Number of time windows to check (allows for clock skew)
  windowSize: 2,
  // Secret key length in bytes
  secretLength: 32,
  // Number of digits in TOTP code
  digits: 6,
  // Hash algorithm
  algorithm: 'sha1' as const,
  // Service name for QR codes
  issuer: 'VowNow Admin',
};

/**
 * TOTP Utility Class
 */
export class TotpUtils {
  /**
   * Generate a new TOTP secret for a user
   */
  static generateSecret(userEmail: string): TotpSecret {
    // Generate random secret (using hex for simplicity in demo)
    const secret = crypto.randomBytes(TOTP_CONFIG.secretLength).toString('hex');

    // Create manual entry key (formatted secret)
    const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;

    // Generate QR code URL for authenticator apps
    const qrCodeUrl = this.generateQrCodeUrl(userEmail, secret);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret,
      qrCodeUrl,
      manualEntryKey,
      backupCodes,
    };
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  private static generateQrCodeUrl(userEmail: string, secret: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: TOTP_CONFIG.issuer,
      algorithm: TOTP_CONFIG.algorithm.toUpperCase(),
      digits: TOTP_CONFIG.digits.toString(),
      period: TOTP_CONFIG.timeWindow.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(TOTP_CONFIG.issuer)}:${encodeURIComponent(userEmail)}?${params.toString()}`;
  }

  /**
   * Generate backup codes for 2FA recovery
   */
  private static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
      codes.push(formattedCode);
    }

    return codes;
  }

  /**
   * Validate TOTP code against secret
   */
  static validateTotpCode(
    secret: string,
    code: string,
    timestamp?: number
  ): TotpValidationResult {
    if (!code || code.length !== TOTP_CONFIG.digits) {
      return { isValid: false };
    }

    const currentTime = timestamp || Math.floor(Date.now() / 1000);
    const timeWindow = Math.floor(currentTime / TOTP_CONFIG.timeWindow);

    // Check current window and adjacent windows for clock skew tolerance
    for (let i = -TOTP_CONFIG.windowSize; i <= TOTP_CONFIG.windowSize; i++) {
      const windowTime = timeWindow + i;
      const expectedCode = this.generateTotpCode(secret, windowTime);

      if (this.constantTimeCompare(code, expectedCode)) {
        return {
          isValid: true,
          window: windowTime,
          usedWindow: i,
        };
      }
    }

    return { isValid: false };
  }

  /**
   * Decode secret (for demo purposes, using hex)
   */
  private static decodeSecret(input: string): Buffer {
    // For production, use a proper base32 library
    // This demo uses hex encoding for simplicity
    try {
      return Buffer.from(input, 'hex');
    } catch {
      // Fallback to a simple conversion
      return Buffer.from(input.slice(0, 32));
    }
  }

  /**
   * Generate TOTP code for given time window
   */
  private static generateTotpCode(secret: string, timeWindow: number): string {
    const secretBuffer = this.decodeSecret(secret);
    const timeBuffer = Buffer.alloc(8);

    // Write time window as big-endian 64-bit integer
    timeBuffer.writeUInt32BE(0, 0);
    timeBuffer.writeUInt32BE(timeWindow, 4);

    // Generate HMAC
    const hmac = crypto.createHmac(TOTP_CONFIG.algorithm, secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const truncatedHash = hash.slice(offset, offset + 4);

    // Convert to integer
    let code = truncatedHash.readUInt32BE(0) & 0x7fffffff;

    // Generate N-digit code
    code = code % Math.pow(10, TOTP_CONFIG.digits);

    return code.toString().padStart(TOTP_CONFIG.digits, '0');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Validate backup code
   */
  static validateBackupCode(
    backupCodes: string[],
    providedCode: string
  ): { isValid: boolean; remainingCodes: string[] } {
    const normalizedProvided = providedCode.toUpperCase().replace(/\s/g, '');
    const codeIndex = backupCodes.findIndex(code =>
      code.replace('-', '') === normalizedProvided.replace('-', '')
    );

    if (codeIndex === -1) {
      return { isValid: false, remainingCodes: backupCodes };
    }

    // Remove used backup code
    const remainingCodes = [...backupCodes];
    remainingCodes.splice(codeIndex, 1);

    return { isValid: true, remainingCodes };
  }

  /**
   * Get current TOTP code for testing purposes
   */
  static getCurrentCode(secret: string): string {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeWindow = Math.floor(currentTime / TOTP_CONFIG.timeWindow);
    return this.generateTotpCode(secret, timeWindow);
  }

  /**
   * Get remaining time in current window
   */
  static getRemainingTime(): number {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeInWindow = currentTime % TOTP_CONFIG.timeWindow;
    return TOTP_CONFIG.timeWindow - timeInWindow;
  }

  /**
   * Format secret for display
   */
  static formatSecretForDisplay(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  }
}

/**
 * 2FA Manager Class for database operations
 */
export class TwoFactorManager {
  /**
   * Enable 2FA for a user
   */
  static async enableTwoFactor(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This would typically update the database
      // For now, we'll simulate the operation

      // In a real implementation, you would:
      // 1. Update admin_users table to set two_factor_enabled = true
      // 2. Store the encrypted secret and backup codes
      // 3. Log the action in audit trail

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to enable 2FA' };
    }
  }

  /**
   * Disable 2FA for a user
   */
  static async disableTwoFactor(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This would typically update the database
      // For now, we'll simulate the operation

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }

  /**
   * Get user's 2FA status
   */
  static async getTwoFactorStatus(
    userId: string
  ): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
    error?: string;
  }> {
    try {
      // This would query the database for user's 2FA status
      // For now, we'll return a default response

      return {
        enabled: false,
        backupCodesRemaining: 0,
      };
    } catch (error) {
      return {
        enabled: false,
        backupCodesRemaining: 0,
        error: 'Failed to get 2FA status',
      };
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(
    userId: string
  ): Promise<{
    success: boolean;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      const newBackupCodes = TotpUtils.generateBackupCodes();

      // This would update the database with new backup codes
      // For now, we'll return the generated codes

      return {
        success: true,
        backupCodes: newBackupCodes,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to regenerate backup codes',
      };
    }
  }
}