'use client';

import { useThemeContext } from '@/lib/theme/ThemeProvider';
import { Theme } from '@/lib/theme/system';

/**
 * Custom hook for managing theme state and operations
 *
 * This hook provides a convenient interface to interact with the theme system.
 * It must be used within a ThemeProvider context.
 *
 * @returns Object containing theme state and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
 *
 *   return (
 *     <div className={`theme-${resolvedTheme}`}>
 *       <p>Current theme: {theme}</p>
 *       <p>Resolved theme: {resolvedTheme}</p>
 *       <button onClick={toggleTheme}>Toggle Theme</button>
 *       <button onClick={() => setTheme('system')}>Use System</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme() {
  const context = useThemeContext();

  return {
    /**
     * The current theme preference ('light', 'dark', or 'system')
     */
    theme: context.theme,

    /**
     * The resolved theme ('light' or 'dark') - system preference is resolved to actual theme
     */
    resolvedTheme: context.resolvedTheme,

    /**
     * Function to set a new theme preference
     * @param theme - The theme to set ('light', 'dark', or 'system')
     */
    setTheme: context.setTheme,

    /**
     * Function to toggle between light and dark themes
     * When current theme is 'system', toggles to opposite of resolved theme
     * When current theme is 'light' or 'dark', toggles to the other
     */
    toggleTheme: context.toggleTheme,
  };
}

/**
 * Hook to get only the resolved theme (light or dark)
 * Useful when you only need to know the actual theme being applied
 *
 * @returns The resolved theme ('light' or 'dark')
 *
 * @example
 * ```tsx
 * function ThemeAwareComponent() {
 *   const resolvedTheme = useResolvedTheme();
 *
 *   return (
 *     <div className={`bg-${resolvedTheme === 'dark' ? 'gray-900' : 'white'}`}>
 *       Content styled based on resolved theme
 *     </div>
 *   );
 * }
 * ```
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
}

/**
 * Hook to check if a specific theme is currently active
 *
 * @param targetTheme - The theme to check ('light', 'dark', or 'system')
 * @returns Boolean indicating if the target theme is active
 *
 * @example
 * ```tsx
 * function ThemeIndicator() {
 *   const isDarkMode = useIsTheme('dark');
 *   const isSystemMode = useIsTheme('system');
 *
 *   return (
 *     <div>
 *       <span className={isDarkMode ? 'text-white' : 'text-black'}>
 *         {isDarkMode && '🌙'} {isSystemMode && '🖥️'}
 *       </span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsTheme(targetTheme: Theme): boolean {
  const { theme } = useTheme();
  return theme === targetTheme;
}

/**
 * Hook to check if the resolved theme is dark
 *
 * @returns Boolean indicating if dark theme is currently applied
 *
 * @example
 * ```tsx
 * function ConditionalComponent() {
 *   const isDark = useIsDarkTheme();
 *
 *   return (
 *     <div>
 *       {isDark ? <DarkModeIcon /> : <LightModeIcon />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsDarkTheme(): boolean {
  const resolvedTheme = useResolvedTheme();
  return resolvedTheme === 'dark';
}

/**
 * Hook to get theme-aware class names
 * Returns an object with common theme-aware Tailwind classes
 *
 * @returns Object containing theme-aware CSS classes
 *
 * @example
 * ```tsx
 * function StyledComponent() {
 *   const themeClasses = useThemeClasses();
 *
 *   return (
 *     <div className={`${themeClasses.bg} ${themeClasses.text} p-4 rounded`}>
 *       <h1 className={themeClasses.heading}>Title</h1>
 *       <p className={themeClasses.textMuted}>Description</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useThemeClasses() {
  const isDark = useIsDarkTheme();

  return {
    // Background classes
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    bgSecondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
    bgTertiary: isDark ? 'bg-gray-700' : 'bg-gray-100',

    // Text classes
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',

    // Border classes
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    borderSecondary: isDark ? 'border-gray-600' : 'border-gray-300',

    // Heading classes
    heading: isDark ? 'text-white' : 'text-gray-900',

    // Card classes
    card: isDark
      ? 'bg-gray-800 border-gray-700 text-white'
      : 'bg-white border-gray-200 text-gray-900',

    // Interactive classes
    hover: isDark
      ? 'hover:bg-gray-700 hover:text-gray-100'
      : 'hover:bg-gray-50 hover:text-gray-800',

    // Focus classes
    focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
  };
}

/**
 * Type definitions for theme-related interfaces
 */
export type { Theme } from '@/lib/theme/system';

/**
 * Re-export theme utilities for convenience
 */
export { resolveTheme, getSystemTheme } from '@/lib/theme/system';