# Theme System Usage Guide

The VowNow Admin Dashboard includes a comprehensive theme system that supports light, dark, and system-based themes with persistent storage and smooth transitions.

## Quick Start

### 1. Basic Setup

The theme system is already integrated into the root layout. No additional setup is required.

```tsx
// app/layout.tsx (already configured)
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider
          defaultTheme="system"
          enableSystem={true}
          storageKey="admin-dashboard-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Using the Theme Hook

```tsx
'use client';

import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme preference: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>

      <button onClick={toggleTheme}>
        Toggle Theme
      </button>

      <button onClick={() => setTheme('light')}>
        Light Mode
      </button>

      <button onClick={() => setTheme('dark')}>
        Dark Mode
      </button>

      <button onClick={() => setTheme('system')}>
        System Mode
      </button>
    </div>
  );
}
```

### 3. Using the Theme Toggle Component

```tsx
import { ThemeToggle } from '@/components/admin/ThemeToggle';

function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4">
      <h1>Admin Dashboard</h1>

      {/* Simple icon toggle */}
      <ThemeToggle variant="icon" size="md" />

      {/* Button with label */}
      <ThemeToggle variant="button" size="md" showLabel />

      {/* Dropdown with all options */}
      <ThemeToggle variant="dropdown" size="md" />
    </nav>
  );
}
```

## Advanced Usage

### 1. Theme-Aware Styling with CSS Variables

Use the provided CSS variables for consistent theming:

```tsx
function ThemedCard() {
  return (
    <div className="bg-card border border-default rounded-lg p-4 shadow-theme-md">
      <h2 className="text-foreground text-xl font-bold">Card Title</h2>
      <p className="text-secondary mt-2">Card description text</p>
      <button className="bg-primary hover:bg-primary-hover mt-4 px-4 py-2 rounded">
        Action Button
      </button>
    </div>
  );
}
```

### 2. Using Theme Utility Hooks

```tsx
import { useResolvedTheme, useIsDarkTheme, useThemeClasses } from '@/hooks/useTheme';

function AdvancedComponent() {
  const resolvedTheme = useResolvedTheme(); // 'light' | 'dark'
  const isDark = useIsDarkTheme(); // boolean
  const themeClasses = useThemeClasses(); // pre-built class names

  return (
    <div className={`${themeClasses.bg} ${themeClasses.text} p-4 rounded`}>
      <h1 className={themeClasses.heading}>
        Currently in {resolvedTheme} mode
      </h1>

      <div className={themeClasses.card}>
        {isDark ? '🌙 Dark mode content' : '☀️ Light mode content'}
      </div>

      <button className={`${themeClasses.hover} px-4 py-2 rounded`}>
        Hover me
      </button>
    </div>
  );
}
```

### 3. Preventing Hydration Mismatches

For components that render differently based on theme:

```tsx
import { ThemeMountedGuard } from '@/lib/theme/ThemeProvider';

function ThemeSpecificComponent() {
  return (
    <ThemeMountedGuard
      fallback={<div className="w-32 h-8 bg-gray-200 animate-pulse" />}
    >
      <ThemeToggle />
    </ThemeMountedGuard>
  );
}
```

### 4. Server-Safe Theme Detection

```tsx
'use client';

import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

function ServerSafeComponent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>; // Avoid hydration mismatch
  }

  return (
    <div>
      Theme-dependent content for {resolvedTheme} mode
    </div>
  );
}
```

## CSS Variables Reference

### Color Variables

```css
/* Light theme colors */
--color-background: 255 255 255;
--color-foreground: 17 24 39;
--color-text-primary: 17 24 39;
--color-text-secondary: 75 85 99;
--color-text-muted: 107 114 128;

/* Dark theme colors (automatically applied) */
--color-background: 17 24 39;
--color-foreground: 243 244 246;
--color-text-primary: 243 244 246;
--color-text-secondary: 209 213 219;
--color-text-muted: 156 163 175;
```

### Using Variables in Custom CSS

```css
.my-component {
  background-color: rgb(var(--color-background));
  color: rgb(var(--color-text-primary));
  border-color: rgb(var(--color-border));
  transition: all var(--transition-fast);
}

.my-button {
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary-foreground));
}

.my-button:hover {
  background-color: rgb(var(--color-primary-hover));
}
```

### Predefined Utility Classes

```tsx
function UtilityExample() {
  return (
    <div className="bg-background text-foreground">
      <div className="bg-background-secondary p-4 border border-default">
        <h1 className="text-foreground">Primary text</h1>
        <p className="text-secondary">Secondary text</p>
        <p className="text-muted">Muted text</p>

        <button className="bg-primary text-white px-4 py-2 rounded shadow-theme-md">
          Primary Button
        </button>

        <div className="bg-card border border-default rounded p-4 mt-4">
          Card content
        </div>
      </div>
    </div>
  );
}
```

## Theme System Features

### ✅ Implemented Features

- **Light/Dark/System Theme Support**: Full support for all three theme modes
- **Persistent Storage**: Theme preference saved to localStorage
- **System Preference Detection**: Automatically detects and responds to OS theme changes
- **Smooth Transitions**: CSS transitions for theme changes
- **Server-Side Rendering Compatible**: Works with Next.js SSR
- **Type-Safe**: Full TypeScript support
- **Accessibility**: ARIA labels and keyboard navigation
- **Multiple UI Variants**: Icon, button, and dropdown theme toggles
- **CSS Variables**: Comprehensive set of theme-aware CSS variables
- **Utility Classes**: Pre-built classes for common theming needs
- **Hydration Safe**: Prevents hydration mismatches

### 🎨 Customization Options

- **Custom Storage Key**: Use different localStorage keys for different apps
- **Disable System Detection**: Opt-out of system theme detection
- **Transition Control**: Enable/disable transitions during theme changes
- **Custom Default Theme**: Set any theme as the default
- **Theme Toggle Variants**: Multiple UI patterns for theme switching

## Best Practices

1. **Use CSS Variables**: Prefer CSS variables over hardcoded Tailwind classes for theme-aware styling
2. **Prevent Hydration Issues**: Use `ThemeMountedGuard` for theme-dependent rendering
3. **Consistent Naming**: Use semantic color names rather than specific color values
4. **Smooth Transitions**: Enable transitions for better UX, disable during programmatic changes
5. **Accessibility**: Always include proper ARIA labels for theme controls
6. **Performance**: Theme changes are optimized with RequestAnimationFrame
7. **Testing**: Test all themes during development to ensure consistent experience

## Troubleshooting

### Common Issues

1. **Hydration Mismatch**: Use `ThemeMountedGuard` or check `mounted` state
2. **Flickering**: Ensure CSS variables are properly defined for both themes
3. **System Theme Not Working**: Check if `enableSystem` is true in ThemeProvider
4. **Storage Issues**: Verify localStorage is available and accessible

### Debug Information

```tsx
import { useTheme } from '@/hooks/useTheme';

function DebugTheme() {
  const { theme, resolvedTheme } = useTheme();

  console.log({
    preference: theme,
    resolved: resolvedTheme,
    systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    stored: localStorage.getItem('admin-dashboard-theme')
  });

  return null;
}
```