'use client'

import { Bell, Search, User, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface AdminHeaderProps {
  user: any
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className="hidden md:block flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-gray-400 hover:text-white p-2"
            aria-label="Toggle search"
          >
            {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto md:ml-6">
          <button className="relative text-gray-400 hover:text-white p-1 sm:p-0">
            <Bell className="h-5 sm:h-6 w-5 sm:w-6" />
            <span className="absolute -top-1 -right-1 h-2 sm:h-3 w-2 sm:w-3 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white"
            >
              <div className="h-7 sm:h-8 w-7 sm:w-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 sm:h-5 w-4 sm:w-5" />
              </div>
              <span className="hidden sm:inline text-sm font-medium truncate max-w-[150px]">
                {user?.email}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10 md:hidden"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-20">
                  <div className="sm:hidden px-4 py-2 border-b border-gray-700">
                    <p className="text-sm text-gray-300 truncate">{user?.email}</p>
                  </div>
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
                      fetch('/api/admin/auth/logout', { method: 'POST' })
                      window.location.href = '/admin/login'
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div ref={searchRef} className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </header>
  )
}