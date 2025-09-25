'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AuditFilters {
  action?: string;
  resource_type?: string;
  user?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface AuditLogFiltersProps {
  filters: AuditFilters;
  onFilterChange: (filters: AuditFilters) => void;
  onClose: () => void;
}

export default function AuditLogFilters({ filters, onFilterChange, onClose }: AuditLogFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AuditFilters>(filters);

  const actionTypes = [
    'login', 'logout', 'create', 'update', 'delete',
    'approve', 'reject', 'export', 'import', 'view'
  ];

  const resourceTypes = [
    'user', 'content', 'settings', 'auth', 'system',
    'payment', 'report', 'moderation', 'notification'
  ];

  const handleChange = (field: keyof AuditFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value || undefined }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Filter Audit Logs
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Action
          </label>
          <select
            id="action"
            value={localFilters.action || ''}
            onChange={(e) => handleChange('action', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="resource_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Resource Type
          </label>
          <select
            id="resource_type"
            value={localFilters.resource_type || ''}
            onChange={(e) => handleChange('resource_type', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Resources</option>
            {resourceTypes.map(resource => (
              <option key={resource} value={resource}>
                {resource.charAt(0).toUpperCase() + resource.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            id="status"
            value={localFilters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            User (Email or Name)
          </label>
          <input
            type="text"
            id="user"
            value={localFilters.user || ''}
            onChange={(e) => handleChange('user', e.target.value)}
            placeholder="Search by email or name"
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date From
          </label>
          <input
            type="datetime-local"
            id="date_from"
            value={localFilters.date_from || ''}
            onChange={(e) => handleChange('date_from', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date To
          </label>
          <input
            type="datetime-local"
            id="date_to"
            value={localFilters.date_to || ''}
            onChange={(e) => handleChange('date_to', e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={localFilters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search in logs..."
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}