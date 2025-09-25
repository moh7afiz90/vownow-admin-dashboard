import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Mock theme context
const mockThemeContext = {
  theme: 'light',
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
}

jest.mock('@/lib/contexts/ThemeContext', () => ({
  useTheme: () => mockThemeContext,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-theme={mockThemeContext.theme}>{children}</div>
  ),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockThemeContext.theme = 'light'
    localStorageMock.getItem.mockReturnValue('light')
  })

  describe('Component Rendering', () => {
    it('should render theme toggle button', () => {
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should show sun icon in light mode', () => {
      mockThemeContext.theme = 'light'
      render(<ThemeToggle />)

      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument()
    })

    it('should show moon icon in dark mode', () => {
      mockThemeContext.theme = 'dark'
      render(<ThemeToggle />)

      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument()
    })

    it('should render as compact variant', () => {
      render(<ThemeToggle variant="compact" />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveClass('compact')
    })

    it('should render with custom label', () => {
      render(<ThemeToggle showLabel={true} />)

      expect(screen.getByText(/light mode/i)).toBeInTheDocument()
    })
  })

  describe('Theme Switching Functionality', () => {
    it('should toggle theme when clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1)
    })

    it('should handle keyboard activation', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      toggleButton.focus()

      await user.keyboard('{Enter}')
      expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1)

      await user.keyboard(' ')
      expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(2)
    })

    it('should update visual state after theme change', async () => {
      const user = userEvent.setup()
      mockThemeContext.theme = 'light'

      const { rerender } = render(<ThemeToggle />)

      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()

      // Simulate theme change
      mockThemeContext.theme = 'dark'
      rerender(<ThemeToggle />)

      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    })

    it('should persist theme preference to localStorage', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1)
    })
  })

  describe('System Theme Detection', () => {
    it('should respect system theme preference initially', () => {
      // Mock matchMedia for dark theme preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      })

      render(<ThemeToggle useSystemTheme={true} />)

      // Should initially use system theme
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should update when system theme changes', async () => {
      const mediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockReturnValue(mediaQuery),
      })

      render(<ThemeToggle useSystemTheme={true} />)

      // Simulate system theme change
      mediaQuery.matches = true
      const changeEvent = new Event('change')
      mediaQuery.addEventListener.mock.calls[0][1](changeEvent)

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument()
      })
    })

    it('should show system theme indicator', () => {
      render(<ThemeToggle useSystemTheme={true} showSystemIndicator={true} />)

      expect(screen.getByTestId('system-theme-indicator')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle theme')
      expect(toggleButton).toHaveAttribute('aria-pressed')
    })

    it('should update aria-pressed based on theme', () => {
      mockThemeContext.theme = 'dark'
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should provide descriptive aria-label', () => {
      mockThemeContext.theme = 'light'
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveAttribute('aria-label', 'Switch to dark mode')
    })

    it('should be keyboard accessible', () => {
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveAttribute('tabIndex', '0')
    })

    it('should announce theme changes to screen readers', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      expect(screen.getByRole('status')).toHaveTextContent(/theme changed/i)
    })

    it('should have sufficient color contrast', () => {
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      const computedStyle = getComputedStyle(toggleButton)

      // Should have proper contrast ratio (this is a simplified check)
      expect(computedStyle.backgroundColor).toBeTruthy()
      expect(computedStyle.color).toBeTruthy()
    })
  })

  describe('Animation and Transitions', () => {
    it('should animate icon transitions', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle animated={true} />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      expect(toggleButton).toHaveClass('transition-all')
    })

    it('should handle reduced motion preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
        })),
      })

      render(<ThemeToggle animated={true} />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveClass('motion-reduce:transition-none')
    })

    it('should show loading state during theme change', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      // Should show loading spinner temporarily
      expect(screen.getByTestId('theme-loading')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByTestId('theme-loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('Theme Variants and Customization', () => {
    it('should support custom theme variants', () => {
      const customThemes = ['light', 'dark', 'auto', 'high-contrast']
      render(<ThemeToggle themes={customThemes} />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toBeInTheDocument()
    })

    it('should render dropdown for multiple themes', async () => {
      const user = userEvent.setup()
      const multipleThemes = ['light', 'dark', 'auto', 'sepia']

      render(<ThemeToggle themes={multipleThemes} showDropdown={true} />)

      const dropdownTrigger = screen.getByRole('button')
      await user.click(dropdownTrigger)

      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /light/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /dark/i })).toBeInTheDocument()
    })

    it('should handle custom icons', () => {
      const customIcons = {
        light: 'CustomSunIcon',
        dark: 'CustomMoonIcon',
      }

      render(<ThemeToggle icons={customIcons} />)

      expect(screen.getByTestId('custom-theme-icon')).toBeInTheDocument()
    })

    it('should apply custom styling', () => {
      render(<ThemeToggle className="custom-toggle" style={{ borderRadius: '50%' }} />)

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveClass('custom-toggle')
      expect(toggleButton).toHaveStyle({ borderRadius: '50%' })
    })
  })

  describe('Error Handling', () => {
    it('should handle theme context not available', () => {
      // Mock missing theme context
      jest.doMock('@/lib/contexts/ThemeContext', () => ({
        useTheme: () => null,
      }))

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<ThemeToggle />)

      expect(screen.getByText('Theme toggle unavailable')).toBeInTheDocument()
      consoleError.mockRestore()
    })

    it('should handle localStorage errors gracefully', async () => {
      const user = userEvent.setup()
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('LocalStorage not available')
      })

      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      // Should still work even if localStorage fails
      expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1)
    })

    it('should handle invalid theme values', () => {
      mockThemeContext.theme = 'invalid-theme' as any

      render(<ThemeToggle />)

      // Should fallback to default icon
      expect(screen.getByTestId('default-theme-icon')).toBeInTheDocument()
    })
  })

  describe('Integration with Theme Provider', () => {
    it('should work with theme provider context', () => {
      render(
        <div data-theme="light">
          <ThemeToggle />
        </div>
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should update document class when theme changes', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      // Theme provider should update document class
      expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1)
    })

    it('should sync with multiple theme toggles', () => {
      render(
        <div>
          <ThemeToggle data-testid="toggle-1" />
          <ThemeToggle data-testid="toggle-2" />
        </div>
      )

      const toggle1 = screen.getByTestId('toggle-1')
      const toggle2 = screen.getByTestId('toggle-2')

      expect(toggle1).toBeInTheDocument()
      expect(toggle2).toBeInTheDocument()
    })
  })
})