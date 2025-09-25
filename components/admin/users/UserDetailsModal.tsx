'use client';

import { X, Mail, Calendar, Activity, FileText, Shield, Ban, Clock } from 'lucide-react';
import { User } from './UserTable';

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onBanUser: (userId: string) => void;
  onUnbanUser: (userId: string) => void;
  onChangeRole: (userId: string, role: 'user' | 'admin') => void;
  onEmailUser: (userId: string) => void;
}

export default function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onBanUser,
  onUnbanUser,
  onChangeRole,
  onEmailUser,
}: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'inactive':
        return 'text-yellow-400';
      case 'banned':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">User Details</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* User Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(user.name || user.email)[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {user.name || 'No name provided'}
                  </h3>
                  <p className="text-gray-400">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-sm ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-400">
                      {user.role === 'admin' ? 'Administrator' : 'Regular User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Signed Up</span>
                </div>
                <p className="text-white">
                  {new Date(user.signedUp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Last Active</span>
                </div>
                <p className="text-white">
                  {new Date(user.lastActive).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Questionnaires Completed</span>
                </div>
                <p className="text-white text-2xl font-semibold">
                  {user.questionnairesCompleted}
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Account Age</span>
                </div>
                <p className="text-white">
                  {Math.floor(
                    (Date.now() - new Date(user.signedUp).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </p>
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm text-white">Account created</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.signedUp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {user.questionnairesCompleted > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        Completed {user.questionnairesCompleted} questionnaire
                        {user.questionnairesCompleted > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">Various dates</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm text-white">Last seen</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEmailUser(user.id)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Send Email</span>
                </button>
                <button
                  onClick={() => onChangeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>{user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}</span>
                </button>
              </div>
              {user.status === 'banned' ? (
                <button
                  onClick={() => onUnbanUser(user.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Ban className="h-4 w-4" />
                  <span>Unban User</span>
                </button>
              ) : (
                <button
                  onClick={() => onBanUser(user.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Ban className="h-4 w-4" />
                  <span>Ban User</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}