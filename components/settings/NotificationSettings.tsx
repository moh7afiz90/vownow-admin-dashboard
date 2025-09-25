'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface NotificationSettingsData {
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  
  email_provider: 'sendgrid' | 'ses' | 'smtp' | 'resend';
  email_from_address: string;
  email_from_name: string;
  email_reply_to: string;
  
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_secure?: boolean;
  
  sendgrid_api_key?: string;
  ses_access_key?: string;
  ses_secret_key?: string;
  ses_region?: string;
  
  push_provider: 'firebase' | 'onesignal' | 'pusher';
  push_api_key?: string;
  push_app_id?: string;
  
  sms_provider: 'twilio' | 'nexmo' | 'aws_sns';
  sms_from_number?: string;
  sms_api_key?: string;
  sms_api_secret?: string;
  
  notification_templates: {
    welcome_email: boolean;
    password_reset: boolean;
    account_verification: boolean;
    login_alert: boolean;
    payment_receipt: boolean;
    admin_alerts: boolean;
    moderation_alerts: boolean;
    system_maintenance: boolean;
  };
  
  digest_emails: boolean;
  digest_frequency: 'daily' | 'weekly' | 'monthly';
  digest_time: string;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsData>({
    email_notifications_enabled: true,
    push_notifications_enabled: false,
    sms_notifications_enabled: false,
    
    email_provider: 'smtp',
    email_from_address: '',
    email_from_name: '',
    email_reply_to: '',
    
    push_provider: 'firebase',
    sms_provider: 'twilio',
    
    notification_templates: {
      welcome_email: true,
      password_reset: true,
      account_verification: true,
      login_alert: true,
      payment_receipt: true,
      admin_alerts: true,
      moderation_alerts: true,
      system_maintenance: true,
    },
    
    digest_emails: false,
    digest_frequency: 'weekly',
    digest_time: '09:00',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

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
        .eq('category', 'notifications')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data.settings as NotificationSettingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load notification settings');
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
          category: 'notifications',
          settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof NotificationSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (template: keyof NotificationSettingsData['notification_templates'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notification_templates: {
        ...prev.notification_templates,
        [template]: value,
      },
    }));
  };

  const sendTestEmail = async () => {
    setTestingEmail(true);
    try {
      const { error } = await supabase.rpc('send_test_email', {
        to: (await supabase.auth.getUser()).data.user?.email,
        provider: settings.email_provider,
        settings: settings,
      });

      if (error) throw error;

      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
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
          Notification Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure email, push, and SMS notification settings.
        </p>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notification Channels</h4>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="email_notifications_enabled"
                type="checkbox"
                checked={settings.email_notifications_enabled}
                onChange={(e) => handleChange('email_notifications_enabled', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="email_notifications_enabled" className="font-medium text-gray-700 dark:text-gray-300">
                Email Notifications
              </label>
              <p className="text-gray-500 dark:text-gray-400">Send notifications via email</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="push_notifications_enabled"
                type="checkbox"
                checked={settings.push_notifications_enabled}
                onChange={(e) => handleChange('push_notifications_enabled', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="push_notifications_enabled" className="font-medium text-gray-700 dark:text-gray-300">
                Push Notifications
              </label>
              <p className="text-gray-500 dark:text-gray-400">Send browser/app push notifications</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="sms_notifications_enabled"
                type="checkbox"
                checked={settings.sms_notifications_enabled}
                onChange={(e) => handleChange('sms_notifications_enabled', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="sms_notifications_enabled" className="font-medium text-gray-700 dark:text-gray-300">
                SMS Notifications
              </label>
              <p className="text-gray-500 dark:text-gray-400">Send SMS text messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      {settings.email_notifications_enabled && (
        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email Configuration</h4>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email_provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Provider
              </label>
              <select
                id="email_provider"
                value={settings.email_provider}
                onChange={(e) => handleChange('email_provider', e.target.value as NotificationSettingsData['email_provider'])}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="ses">Amazon SES</option>
                <option value="resend">Resend</option>
              </select>
            </div>

            <div>
              <label htmlFor="email_from_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Name
              </label>
              <input
                type="text"
                id="email_from_name"
                value={settings.email_from_name}
                onChange={(e) => handleChange('email_from_name', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="email_from_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Address
              </label>
              <input
                type="email"
                id="email_from_address"
                value={settings.email_from_address}
                onChange={(e) => handleChange('email_from_address', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="email_reply_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reply-To Address
              </label>
              <input
                type="email"
                id="email_reply_to"
                value={settings.email_reply_to}
                onChange={(e) => handleChange('email_reply_to', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {settings.email_provider === 'smtp' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SMTP Host
                </label>
                <input
                  type="text"
                  id="smtp_host"
                  value={settings.smtp_host || ''}
                  onChange={(e) => handleChange('smtp_host', e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SMTP Port
                </label>
                <input
                  type="number"
                  id="smtp_port"
                  value={settings.smtp_port || 587}
                  onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="smtp_username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SMTP Username
                </label>
                <input
                  type="text"
                  id="smtp_username"
                  value={settings.smtp_username || ''}
                  onChange={(e) => handleChange('smtp_username', e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SMTP Password
                </label>
                <input
                  type="password"
                  id="smtp_password"
                  value={settings.smtp_password || ''}
                  onChange={(e) => handleChange('smtp_password', e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={sendTestEmail}
              disabled={testingEmail}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {testingEmail ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      )}

      {/* Notification Templates */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notification Templates</h4>
        
        <div className="space-y-2">
          {Object.entries(settings.notification_templates).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <input
                id={`template_${key}`}
                type="checkbox"
                checked={value}
                onChange={(e) => handleTemplateChange(key as keyof NotificationSettingsData['notification_templates'], e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor={`template_${key}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Digest Emails */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Digest Emails</h4>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="digest_emails"
              type="checkbox"
              checked={settings.digest_emails}
              onChange={(e) => handleChange('digest_emails', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="digest_emails" className="font-medium text-gray-700 dark:text-gray-300">
              Enable Digest Emails
            </label>
            <p className="text-gray-500 dark:text-gray-400">Send summary emails on a schedule</p>
          </div>
        </div>

        {settings.digest_emails && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ml-7">
            <div>
              <label htmlFor="digest_frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frequency
              </label>
              <select
                id="digest_frequency"
                value={settings.digest_frequency}
                onChange={(e) => handleChange('digest_frequency', e.target.value as NotificationSettingsData['digest_frequency'])}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label htmlFor="digest_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Send Time
              </label>
              <input
                type="time"
                id="digest_time"
                value={settings.digest_time}
                onChange={(e) => handleChange('digest_time', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
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