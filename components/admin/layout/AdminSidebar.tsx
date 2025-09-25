'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Shield,
  FileText,
  LogOut
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Moderation',
    href: '/admin/moderation',
    icon: Shield,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">VowNow Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}