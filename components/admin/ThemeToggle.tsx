'use client';

import React, { useState } from 'react';
import { useTheme, Theme } from '@/hooks/useTheme';
import { ThemeMountedGuard } from '@/lib/theme/ThemeProvider';

interface ThemeToggleProps {
  /**
   * Whether to show theme labels
   */
  showLabel?: boolean;
  /**
   * Size variant for the toggle
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Style variant for the toggle
   */
  variant?: 'button' | 'dropdown' | 'icon';
  /**
   * Custom CSS classes
   */
  className?: string;
}

/**
 * ThemeToggle Component
 *
 * Provides a UI control for toggling between light, dark, and system themes.
 * Supports multiple variants and sizes for different use cases.
 */
export function ThemeToggle({
  showLabel = false,
  size = 'md',
  variant = 'icon',
  className = ''
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'icon') {
    return (
      <ThemeMountedGuard fallback={<div className={`${sizeClasses[size]} ${iconSizeClasses[size]}`} />}>
        <button
          onClick={toggleTheme}
          className={`
            inline-flex items-center justify-center rounded-md
            transition-colors duration-200
            hover:bg-gray-100 dark:hover:bg-gray-800
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            ${sizeClasses[size]} ${className}
          `}
          title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
          aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
          {resolvedTheme === 'light' ? (
            <SunIcon className={iconSizeClasses[size]} />
          ) : (
            <MoonIcon className={iconSizeClasses[size]} />
          )}
          {showLabel && (
            <span className="ml-2 capitalize">
              {theme === 'system' ? 'System' : resolvedTheme}
            </span>
          )}
        </button>
      </ThemeMountedGuard>
    );
  }

  if (variant === 'button') {
    return (
      <ThemeMountedGuard fallback={<div className={`${sizeClasses[size]} px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700`} />}>
        <button
          onClick={toggleTheme}
          className={`
            inline-flex items-center px-4 py-2 rounded-md
            bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            transition-colors duration-200
            ${sizeClasses[size]} ${className}
          `}
        >
          {resolvedTheme === 'light' ? (
            <SunIcon className={`${iconSizeClasses[size]} mr-2`} />
          ) : (
            <MoonIcon className={`${iconSizeClasses[size]} mr-2`} />
          )}
          <span className="capitalize">
            {theme === 'system' ? 'System' : resolvedTheme}
          </span>
        </button>
      </ThemeMountedGuard>
    );
  }

  if (variant === 'dropdown') {
    return (
      <ThemeMountedGuard fallback={<div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />}>
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              inline-flex items-center w-full px-4 py-2 rounded-md
              bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              transition-colors duration-200
              ${sizeClasses[size]} ${className}
            `}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {getThemeIcon(theme, resolvedTheme, iconSizeClasses[size])}
            <span className="ml-2 capitalize flex-1 text-left">
              {theme === 'system' ? 'System' : theme}
            </span>
            <ChevronDownIcon className={`${iconSizeClasses[size]} ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown menu */}
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <div className="py-1">
                  {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => {
                        setTheme(themeOption);
                        setIsDropdownOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-4 py-2 text-sm
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        text-gray-700 dark:text-gray-300
                        transition-colors duration-150
                        ${theme === themeOption ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
                      `}
                    >
                      {getThemeIcon(themeOption, resolvedTheme, iconSizeClasses[size])}
                      <span className="ml-3 capitalize">{themeOption}</span>
                      {theme === themeOption && (
                        <CheckIcon className={`${iconSizeClasses[size]} ml-auto`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ThemeMountedGuard>
    );
  }

  return null;
}

/**
 * Get the appropriate icon for a theme
 */
function getThemeIcon(themeValue: Theme, resolvedTheme: 'light' | 'dark', className: string) {
  if (themeValue === 'system') {
    return <ComputerIcon className={className} />;
  }
  return themeValue === 'light' ? (
    <SunIcon className={className} />
  ) : (
    <MoonIcon className={className} />
  );
}

/**
 * Sun Icon Component
 */
function SunIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}

/**
 * Moon Icon Component
 */
function MoonIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  );
}

/**
 * Computer Icon Component
 */
function ComputerIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
      />
    </svg>
  );
}

/**
 * Chevron Down Icon Component
 */
function ChevronDownIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/**
 * Check Icon Component
 */
function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}