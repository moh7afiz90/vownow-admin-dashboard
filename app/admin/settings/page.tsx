'use client';

import { useState } from 'react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PaymentSettings from '@/components/settings/PaymentSettings';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

const tabs = [
  { name: 'General', icon: Cog6ToothIcon, component: GeneralSettings },
  { name: 'Security', icon: ShieldCheckIcon, component: SecuritySettings },
  { name: 'Notifications', icon: BellIcon, component: NotificationSettings },
  { name: 'Payments', icon: CreditCardIcon, component: PaymentSettings },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('General');

  const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component || GeneralSettings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          System Settings
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Configure your application settings and preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.name
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}