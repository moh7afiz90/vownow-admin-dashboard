'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface PaymentSettingsData {
  payment_enabled: boolean;
  payment_provider: 'stripe' | 'paypal' | 'square' | 'razorpay';
  test_mode: boolean;
  
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  stripe_webhook_secret?: string;
  
  paypal_client_id?: string;
  paypal_client_secret?: string;
  paypal_webhook_id?: string;
  
  square_application_id?: string;
  square_access_token?: string;
  square_location_id?: string;
  
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  razorpay_webhook_secret?: string;
  
  currency: string;
  currencies_supported: string[];
  
  tax_enabled: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
  tax_number?: string;
  
  payment_methods: {
    card: boolean;
    bank_transfer: boolean;
    paypal: boolean;
    apple_pay: boolean;
    google_pay: boolean;
    crypto: boolean;
  };
  
  subscription_enabled: boolean;
  trial_period_days: number;
  
  refund_policy: 'none' | '7_days' | '14_days' | '30_days' | 'custom';
  refund_policy_custom_days?: number;
  
  invoice_prefix: string;
  invoice_starting_number: number;
  invoice_footer?: string;
  
  webhook_urls: string[];
  webhook_events: string[];
}

export default function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettingsData>({
    payment_enabled: false,
    payment_provider: 'stripe',
    test_mode: true,
    
    currency: 'USD',
    currencies_supported: ['USD'],
    
    tax_enabled: false,
    tax_rate: 0,
    tax_inclusive: false,
    
    payment_methods: {
      card: true,
      bank_transfer: false,
      paypal: false,
      apple_pay: false,
      google_pay: false,
      crypto: false,
    },
    
    subscription_enabled: false,
    trial_period_days: 14,
    
    refund_policy: '30_days',
    
    invoice_prefix: 'INV',
    invoice_starting_number: 1000,
    
    webhook_urls: [],
    webhook_events: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const supabase = createClientComponentClient();

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'CNY', name: 'Chinese Yuan' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'payments')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data.settings as PaymentSettingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load payment settings');
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
          category: 'payments',
          settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Payment settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PaymentSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentMethodChange = (method: keyof PaymentSettingsData['payment_methods'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      payment_methods: {
        ...prev.payment_methods,
        [method]: value,
      },
    }));
  };

  const addWebhookUrl = () => {
    if (newWebhookUrl && !settings.webhook_urls.includes(newWebhookUrl)) {
      handleChange('webhook_urls', [...settings.webhook_urls, newWebhookUrl]);
      setNewWebhookUrl('');
    }
  };

  const removeWebhookUrl = (url: string) => {
    handleChange('webhook_urls', settings.webhook_urls.filter(u => u !== url));
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
          Payment Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure payment processing and billing settings.
        </p>
      </div>

      {/* Payment Configuration */}
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="payment_enabled"
              type="checkbox"
              checked={settings.payment_enabled}
              onChange={(e) => handleChange('payment_enabled', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="payment_enabled" className="font-medium text-gray-700 dark:text-gray-300">
              Enable Payments
            </label>
            <p className="text-gray-500 dark:text-gray-400">Accept payments from customers</p>
          </div>
        </div>

        {settings.payment_enabled && (
          <>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="test_mode"
                  type="checkbox"
                  checked={settings.test_mode}
                  onChange={(e) => handleChange('test_mode', e.target.checked)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="test_mode" className="font-medium text-gray-700 dark:text-gray-300">
                  Test Mode
                </label>
                <p className="text-gray-500 dark:text-gray-400">Use test API keys and sandbox environment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="payment_provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Provider
                </label>
                <select
                  id="payment_provider"
                  value={settings.payment_provider}
                  onChange={(e) => handleChange('payment_provider', e.target.value as PaymentSettingsData['payment_provider'])}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="square">Square</option>
                  <option value="razorpay">Razorpay</option>
                </select>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Currency
                </label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Provider API Keys */}
            {settings.payment_provider === 'stripe' && (
              <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Stripe Configuration</h4>
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {showApiKeys ? 'Hide' : 'Show'} API Keys
                  </button>
                </div>
                
                {showApiKeys && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="stripe_publishable_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Publishable Key
                      </label>
                      <input
                        type="text"
                        id="stripe_publishable_key"
                        value={settings.stripe_publishable_key || ''}
                        onChange={(e) => handleChange('stripe_publishable_key', e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white font-mono"
                        placeholder="pk_test_..."
                      />
                    </div>

                    <div>
                      <label htmlFor="stripe_secret_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Secret Key
                      </label>
                      <input
                        type="password"
                        id="stripe_secret_key"
                        value={settings.stripe_secret_key || ''}
                        onChange={(e) => handleChange('stripe_secret_key', e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white font-mono"
                        placeholder="sk_test_..."
                      />
                    </div>

                    <div>
                      <label htmlFor="stripe_webhook_secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Webhook Secret
                      </label>
                      <input
                        type="password"
                        id="stripe_webhook_secret"
                        value={settings.stripe_webhook_secret || ''}
                        onChange={(e) => handleChange('stripe_webhook_secret', e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white font-mono"
                        placeholder="whsec_..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Accepted Payment Methods</h4>
              
              <div className="space-y-2">
                {Object.entries(settings.payment_methods).map(([method, enabled]) => (
                  <div key={method} className="flex items-center">
                    <input
                      id={`payment_method_${method}`}
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handlePaymentMethodChange(method as keyof PaymentSettingsData['payment_methods'], e.target.checked)}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor={`payment_method_${method}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Settings */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Tax Settings</h4>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="tax_enabled"
                    type="checkbox"
                    checked={settings.tax_enabled}
                    onChange={(e) => handleChange('tax_enabled', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="tax_enabled" className="font-medium text-gray-700 dark:text-gray-300">
                    Enable Tax Calculation
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">Calculate and collect taxes on transactions</p>
                </div>
              </div>

              {settings.tax_enabled && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ml-7">
                  <div>
                    <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="tax_rate"
                      value={settings.tax_rate}
                      onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tax Number
                    </label>
                    <input
                      type="text"
                      id="tax_number"
                      value={settings.tax_number || ''}
                      onChange={(e) => handleChange('tax_number', e.target.value)}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="tax_inclusive"
                        type="checkbox"
                        checked={settings.tax_inclusive}
                        onChange={(e) => handleChange('tax_inclusive', e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="tax_inclusive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Prices include tax (tax-inclusive pricing)
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Settings */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Invoice Settings</h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="invoice_prefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    id="invoice_prefix"
                    value={settings.invoice_prefix}
                    onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="invoice_starting_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Starting Number
                  </label>
                  <input
                    type="number"
                    id="invoice_starting_number"
                    value={settings.invoice_starting_number}
                    onChange={(e) => handleChange('invoice_starting_number', parseInt(e.target.value))}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="invoice_footer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invoice Footer Text
                  </label>
                  <textarea
                    id="invoice_footer"
                    rows={2}
                    value={settings.invoice_footer || ''}
                    onChange={(e) => handleChange('invoice_footer', e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Thank you for your business!"
                  />
                </div>
              </div>
            </div>
          </>
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