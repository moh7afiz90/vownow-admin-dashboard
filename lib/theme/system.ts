/**
 * System theme preference detection utilities
 * Handles detection of system theme preference and provides utilities
 * for working with system-level theme settings
 */

export type Theme = 'light' | 'dark' | 'system';

/**
 * Detects the current system theme preference
 * @returns 'light' or 'dark' based on system preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'; // Default for SSR
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolves a theme value to the actual theme to apply
 * @param theme - The theme preference ('light', 'dark', or 'system')
 * @returns The resolved theme ('light' or 'dark')
 */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Sets up a listener for system theme changes
 * @param callback - Function to call when system theme changes
 * @returns Cleanup function to remove the listener
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  // Use the modern addEventListener if available, fallback to addListener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
}

/**
 * Gets the initial theme preference from localStorage or system
 * @param storageKey - The localStorage key to check
 * @returns The theme preference
 */
export function getInitialTheme(storageKey: string = 'theme'): Theme {
  if (typeof window === 'undefined') {
    return 'system'; // Default for SSR
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }

  return 'system'; // Default to system preference
}

/**
 * Saves theme preference to localStorage
 * @param theme - The theme to save
 * @param storageKey - The localStorage key to use
 */
export function saveTheme(theme: Theme, storageKey: string = 'theme'): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(storageKey, theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
}

/**
 * Applies theme to document element
 * @param theme - The theme to apply ('light' or 'dark')
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('light', 'dark');

  // Add new theme class
  root.classList.add(theme);

  // Set data attribute for CSS selectors
  root.setAttribute('data-theme', theme);

  // Set color-scheme for native browser elements
  root.style.colorScheme = theme;
}