'use client';

import { useState } from 'react';
import { Save, Bell, Shield, Mail, Globe, Database, Key } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'database', label: 'Database', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400 mt-1">Configure application settings and preferences</p>
      </div>

      <div className="flex space-x-1 border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Application Name
              </label>
              <input
                type="text"
                defaultValue="VowNow"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="contact@vownow.com"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Zone
              </label>
              <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>UTC</option>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Maintenance Mode</p>
                <p className="text-gray-400 text-sm">Temporarily disable access to the application</p>
              </div>
              <button className="bg-gray-700 relative inline-flex h-6 w-11 items-center rounded-full">
                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-sm">Require 2FA for all admin accounts</p>
                </div>
                <button className="bg-indigo-600 relative inline-flex h-6 w-11 items-center rounded-full">
                  <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Session Timeout</p>
                  <p className="text-gray-400 text-sm">Automatically logout after inactivity</p>
                </div>
                <select className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>Never</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">IP Whitelist</p>
                  <p className="text-gray-400 text-sm">Restrict admin access to specific IPs</p>
                </div>
                <button className="bg-gray-700 relative inline-flex h-6 w-11 items-center rounded-full">
                  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                </button>
              </div>
            </div>

            <div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <Key className="h-4 w-4" />
                <span>Rotate API Keys</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>

            <div className="space-y-4">
              {[
                { title: 'New User Registration', desc: 'Get notified when new users sign up' },
                { title: 'Questionnaire Completion', desc: 'Notification for completed questionnaires' },
                { title: 'Error Alerts', desc: 'System errors and critical issues' },
                { title: 'Daily Summary', desc: 'Daily metrics and activity summary' },
                { title: 'Weekly Report', desc: 'Weekly performance report' },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                  <button className="bg-indigo-600 relative inline-flex h-6 w-11 items-center rounded-full">
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Email Configuration</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  placeholder="smtp.example.com"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  placeholder="587"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="username@example.com"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  defaultValue="noreply@vownow.com"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  defaultValue="VowNow"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              Test Email Configuration
            </button>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Database Settings</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">Database Status</p>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Connected</span>
                </div>
                <p className="text-gray-400 text-sm">PostgreSQL 14.5</p>
              </div>

              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">Database Size</p>
                  <span className="text-gray-300">124 MB</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                </div>
                <p className="text-gray-400 text-sm mt-1">12% of 1 GB used</p>
              </div>

              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-white font-medium mb-2">Backup Schedule</p>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                  <option>Daily at 2:00 AM</option>
                  <option>Weekly on Sunday</option>
                  <option>Monthly on 1st</option>
                  <option>Manual only</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Backup Now
              </button>
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Restore Backup
              </button>
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Optimize Database
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end">
          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}