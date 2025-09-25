'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface SecuritySettingsData {
  two_factor_auth: boolean;
  two_factor_required_for_admins: boolean;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  ip_whitelist_enabled: boolean;
  ip_whitelist: string[];
  ip_blacklist_enabled: boolean;
  ip_blacklist: string[];
  force_https: boolean;
  cors_enabled: boolean;
  cors_origins: string[];
}

export default function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettingsData>({
    two_factor_auth: false,
    two_factor_required_for_admins: true,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_special: false,
    password_expiry_days: 90,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    session_timeout_minutes: 60,
    ip_whitelist_enabled: false,
    ip_whitelist: [],
    ip_blacklist_enabled: false,
    ip_blacklist: [],
    force_https: true,
    cors_enabled: false,
    cors_origins: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newWhitelistIp, setNewWhitelistIp] = useState('');
  const [newBlacklistIp, setNewBlacklistIp] = useState('');
  const [newCorsOrigin, setNewCorsOrigin] = useState('');

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'security')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data.settings as SecuritySettingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          category: 'security',
          settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Security settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SecuritySettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const addIpToWhitelist = () => {
    if (newWhitelistIp && !settings.ip_whitelist.includes(newWhitelistIp)) {
      handleChange('ip_whitelist', [...settings.ip_whitelist, newWhitelistIp]);
      setNewWhitelistIp('');
    }
  };

  const removeFromWhitelist = (ip: string) => {
    handleChange('ip_whitelist', settings.ip_whitelist.filter(i => i !== ip));
  };

  const addIpToBlacklist = () => {
    if (newBlacklistIp && !settings.ip_blacklist.includes(newBlacklistIp)) {
      handleChange('ip_blacklist', [...settings.ip_blacklist, newBlacklistIp]);
      setNewBlacklistIp('');
    }
  };

  const removeFromBlacklist = (ip: string) => {
    handleChange('ip_blacklist', settings.ip_blacklist.filter(i => i !== ip));
  };

  const addCorsOrigin = () => {
    if (newCorsOrigin && !settings.cors_origins.includes(newCorsOrigin)) {
      handleChange('cors_origins', [...settings.cors_origins, newCorsOrigin]);
      setNewCorsOrigin('');
    }
  };

  const removeCorsOrigin = (origin: string) => {
    handleChange('cors_origins', settings.cors_origins.filter(o => o !== origin));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Security Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure security policies and authentication settings.
        </p>
      </div>

      {/* Authentication Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Authentication</h4>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="two_factor_auth"
                type="checkbox"
                checked={settings.two_factor_auth}
                onChange={(e) => handleChange('two_factor_auth', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="two_factor_auth" className="font-medium text-gray-700 dark:text-gray-300">
                Enable Two-Factor Authentication
              </label>
              <p className="text-gray-500 dark:text-gray-400">Allow users to enable 2FA for their accounts</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="two_factor_required_for_admins"
                type="checkbox"
                checked={settings.two_factor_required_for_admins}
                onChange={(e) => handleChange('two_factor_required_for_admins', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="two_factor_required_for_admins" className="font-medium text-gray-700 dark:text-gray-300">
                Require 2FA for Administrators
              </label>
              <p className="text-gray-500 dark:text-gray-400">Force all admin users to enable 2FA</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="max_login_attempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Max Login Attempts
            </label>
            <input
              type="number"
              id="max_login_attempts"
              value={settings.max_login_attempts}
              onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="lockout_duration_minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Lockout Duration (minutes)
            </label>
            <input
              type="number"
              id="lockout_duration_minutes"
              value={settings.lockout_duration_minutes}
              onChange={(e) => handleChange('lockout_duration_minutes', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="session_timeout_minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              id="session_timeout_minutes"
              value={settings.session_timeout_minutes}
              onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Password Policy</h4>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password_min_length" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Minimum Password Length
            </label>
            <input
              type="number"
              id="password_min_length"
              value={settings.password_min_length}
              onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="password_expiry_days" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password Expiry (days)
            </label>
            <input
              type="number"
              id="password_expiry_days"
              value={settings.password_expiry_days}
              onChange={(e) => handleChange('password_expiry_days', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="password_require_uppercase"
              type="checkbox"
              checked={settings.password_require_uppercase}
              onChange={(e) => handleChange('password_require_uppercase', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="password_require_uppercase" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Require uppercase letters
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="password_require_lowercase"
              type="checkbox"
              checked={settings.password_require_lowercase}
              onChange={(e) => handleChange('password_require_lowercase', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="password_require_lowercase" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Require lowercase letters
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="password_require_numbers"
              type="checkbox"
              checked={settings.password_require_numbers}
              onChange={(e) => handleChange('password_require_numbers', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="password_require_numbers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Require numbers
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="password_require_special"
              type="checkbox"
              checked={settings.password_require_special}
              onChange={(e) => handleChange('password_require_special', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="password_require_special" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Require special characters
            </label>
          </div>
        </div>
      </div>

      {/* Network Security */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Network Security</h4>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="force_https"
              type="checkbox"
              checked={settings.force_https}
              onChange={(e) => handleChange('force_https', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="force_https" className="font-medium text-gray-700 dark:text-gray-300">
              Force HTTPS
            </label>
            <p className="text-gray-500 dark:text-gray-400">Redirect all HTTP traffic to HTTPS</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}