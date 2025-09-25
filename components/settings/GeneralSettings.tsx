'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface GeneralSettingsData {
  site_name: string;
  site_description: string;
  site_url: string;
  support_email: string;
  timezone: string;
  date_format: string;
  language: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_registration: boolean;
  require_email_verification: boolean;
  session_timeout: number;
  max_upload_size: number;
}

export default function GeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettingsData>({
    site_name: '',
    site_description: '',
    site_url: '',
    support_email: '',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    language: 'en',
    maintenance_mode: false,
    maintenance_message: '',
    allow_registration: true,
    require_email_verification: true,
    session_timeout: 60,
    max_upload_size: 10,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .eq('category', 'general')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data.settings as GeneralSettingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
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
          category: 'general',
          settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof GeneralSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
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
          General Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure basic application settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Site Name
          </label>
          <input
            type="text"
            id="site_name"
            value={settings.site_name}
            onChange={(e) => handleChange('site_name', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="site_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Site URL
          </label>
          <input
            type="url"
            id="site_url"
            value={settings.site_url}
            onChange={(e) => handleChange('site_url', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="site_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Site Description
          </label>
          <textarea
            id="site_description"
            rows={3}
            value={settings.site_description}
            onChange={(e) => handleChange('site_description', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="support_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Support Email
          </label>
          <input
            type="email"
            id="support_email"
            value={settings.support_email}
            onChange={(e) => handleChange('support_email', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Timezone
          </label>
          <select
            id="timezone"
            value={settings.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>

        <div>
          <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date Format
          </label>
          <select
            id="date_format"
            value={settings.date_format}
            onChange={(e) => handleChange('date_format', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Default Language
          </label>
          <select
            id="language"
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        <div>
          <label htmlFor="session_timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            id="session_timeout"
            value={settings.session_timeout}
            onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="max_upload_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Max Upload Size (MB)
          </label>
          <input
            type="number"
            id="max_upload_size"
            value={settings.max_upload_size}
            onChange={(e) => handleChange('max_upload_size', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">System Options</h4>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="maintenance_mode"
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="maintenance_mode" className="font-medium text-gray-700 dark:text-gray-300">
                Maintenance Mode
              </label>
              <p className="text-gray-500 dark:text-gray-400">Enable maintenance mode to prevent user access</p>
            </div>
          </div>

          {settings.maintenance_mode && (
            <div className="ml-7">
              <label htmlFor="maintenance_message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maintenance Message
              </label>
              <textarea
                id="maintenance_message"
                rows={2}
                value={settings.maintenance_message}
                onChange={(e) => handleChange('maintenance_message', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="We are currently performing maintenance..."
              />
            </div>
          )}

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="allow_registration"
                type="checkbox"
                checked={settings.allow_registration}
                onChange={(e) => handleChange('allow_registration', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="allow_registration" className="font-medium text-gray-700 dark:text-gray-300">
                Allow Registration
              </label>
              <p className="text-gray-500 dark:text-gray-400">Allow new users to register</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="require_email_verification"
                type="checkbox"
                checked={settings.require_email_verification}
                onChange={(e) => handleChange('require_email_verification', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="require_email_verification" className="font-medium text-gray-700 dark:text-gray-300">
                Require Email Verification
              </label>
              <p className="text-gray-500 dark:text-gray-400">New users must verify their email address</p>
            </div>
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