'use client';

import { Bell, Search, User } from 'lucide-react';
import { useState } from 'react';

interface AdminHeaderProps {
  user: any;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 ml-6">
          <button className="relative text-gray-400 hover:text-white">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
            >
              <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{user?.email}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1">
                <a
                  href="/admin/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Profile
                </a>
                <a
                  href="/admin/settings"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Settings
                </a>
                <hr className="my-1 border-gray-700" />
                <button
                  onClick={() => {
                    fetch('/api/admin/auth/logout', { method: 'POST' });
                    window.location.href = '/admin/login';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}