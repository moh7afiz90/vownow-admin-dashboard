'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, adminUser, role, loading } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                {adminUser && (
                  <div className="text-sm text-gray-700">
                    Welcome, {adminUser.email}
                  </div>
                )}
                {role && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children || (
            <div className="px-4 py-6 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Dashboard content will go here</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}