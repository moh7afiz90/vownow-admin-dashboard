'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Theme, getInitialTheme, resolveTheme, saveTheme, applyTheme, watchSystemTheme } from './system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

/**
 * ThemeProvider component that manages theme state and provides theme context
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initialTheme = getInitialTheme(storageKey);
    setThemeState(initialTheme);
    setMounted(true);
  }, [storageKey]);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (!mounted) return;

    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    // Temporarily disable transitions if requested
    if (disableTransitionOnChange) {
      const root = document.documentElement;
      const currentTransition = root.style.transition;
      root.style.transition = 'none';

      requestAnimationFrame(() => {
        applyTheme(resolved);
        requestAnimationFrame(() => {
          root.style.transition = currentTransition;
        });
      });
    } else {
      applyTheme(resolved);
    }

    // Save theme preference
    saveTheme(theme, storageKey);
  }, [theme, mounted, storageKey, disableTransitionOnChange]);

  // Watch for system theme changes
  useEffect(() => {
    if (!mounted || !enableSystem || theme !== 'system') return;

    const cleanup = watchSystemTheme((systemTheme) => {
      setResolvedTheme(systemTheme);
      applyTheme(systemTheme);
    });

    return cleanup;
  }, [theme, mounted, enableSystem]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // When toggling from system, go to the opposite of current resolved theme
      setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    } else {
      // When toggling between light/dark, switch to the other
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  }, [theme, resolvedTheme, setTheme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Higher-order component to wrap components with theme provider
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & Partial<ThemeProviderProps>> {
  return function ThemeWrappedComponent({ children, ...props }) {
    const { children: _, ...themeProps } = props as ThemeProviderProps;
    return (
      <ThemeProvider {...themeProps}>
        <Component {...(props as P)} />
      </ThemeProvider>
    );
  };
}

/**
 * Component that renders content only after theme is mounted
 * Useful for preventing hydration mismatches in theme-dependent components
 */
export function ThemeMountedGuard({
  children,
  fallback = null
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}