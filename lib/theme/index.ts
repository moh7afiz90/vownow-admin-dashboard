/**
 * Theme System Exports
 *
 * Complete theme system for the admin dashboard with support for:
 * - Light/Dark/System theme modes
 * - Persistent storage in localStorage
 * - System preference detection
 * - Smooth transitions
 * - Server-side rendering compatibility
 * - Accessibility features
 */

// Core theme provider and context
export {
  ThemeProvider,
  useThemeContext,
  withTheme,
  ThemeMountedGuard,
  type ThemeProviderProps,
} from './ThemeProvider';

// System utilities
export {
  getSystemTheme,
  resolveTheme,
  watchSystemTheme,
  getInitialTheme,
  saveTheme,
  applyTheme,
  type Theme,
} from './system';

// Convenience hook (re-export from hooks)
export { useTheme } from '@/hooks/useTheme';