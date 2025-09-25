'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ServerIcon,
  KeyIcon,
  DocumentTextIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  ip_address: string;
  user_agent: string;
  metadata: any;
  timestamp: string;
  status: 'success' | 'failed';
  error_message?: string;
}

interface AuditLogTableProps {
  logs: AuditLog[];
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
  const getActionIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'user':
        return <UserIcon className="h-5 w-5" />;
      case 'server':
      case 'system':
        return <ServerIcon className="h-5 w-5" />;
      case 'auth':
      case 'authentication':
        return <KeyIcon className="h-5 w-5" />;
      case 'document':
      case 'content':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'settings':
        return <CogIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) {
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
    }
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) {
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
      return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
    }
    if (action.toLowerCase().includes('login') || action.toLowerCase().includes('logout')) {
      return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
    }
    return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Action
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resource
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              IP Address
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Timestamp
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getActionIcon(log.resource_type)}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.resource_type}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {log.resource_id}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.user_name || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {log.user_email}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {log.ip_address}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {log.status === 'success' ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 dark:text-green-400">Success</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600 dark:text-red-400">Failed</span>
                    </>
                  )}
                </div>
                {log.error_message && (
                  <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {log.error_message}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}