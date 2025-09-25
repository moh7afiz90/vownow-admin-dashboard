import React from 'react'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/admin/MetricCard'

// Mock theme provider for dark mode testing
const mockThemeProvider = ({ children, theme = 'light' }: { children: React.ReactNode, theme?: 'light' | 'dark' }) => {
  return (
    <div data-theme={theme} className={theme === 'dark' ? 'dark' : ''}>
      {children}
    </div>
  )
}

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Total Users',
    value: '1,234',
    change: '+5.2%',
    trend: 'up' as const,
    icon: 'Users',
  }

  beforeEach(() => {
    // Clear any mocks between tests
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render metric card with all required props', () => {
      render(<MetricCard {...defaultProps} />)

      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText('+5.2%')).toBeInTheDocument()
    })

    it('should render metric card with custom description', () => {
      const propsWithDescription = {
        ...defaultProps,
        description: 'Active users in the last 30 days'
      }

      render(<MetricCard {...propsWithDescription} />)

      expect(screen.getByText('Active users in the last 30 days')).toBeInTheDocument()
    })

    it('should render metric card without change value', () => {
      const propsWithoutChange = {
        title: 'Revenue',
        value: '$45,678',
        icon: 'DollarSign',
      }

      render(<MetricCard {...propsWithoutChange} />)

      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('$45,678')).toBeInTheDocument()
      expect(screen.queryByText(/[+-]/)).not.toBeInTheDocument()
    })
  })

  describe('Props Validation', () => {
    it('should handle different trend values correctly', () => {
      const { rerender } = render(<MetricCard {...defaultProps} trend="up" change="+5.2%" />)
      let changeElement = screen.getByText('+5.2%')
      expect(changeElement).toHaveClass('text-green-600')

      rerender(<MetricCard {...defaultProps} trend="down" change="-2.1%" />)
      changeElement = screen.getByText('-2.1%')
      expect(changeElement).toHaveClass('text-red-600')

      rerender(<MetricCard {...defaultProps} trend="neutral" change="0%" />)
      changeElement = screen.getByText('0%')
      expect(changeElement).toHaveClass('text-gray-600')
    })

    it('should handle different icon types', () => {
      const { rerender } = render(<MetricCard {...defaultProps} icon="Users" />)
      expect(screen.getByTestId('metric-icon')).toBeInTheDocument()

      rerender(<MetricCard {...defaultProps} icon="DollarSign" />)
      expect(screen.getByTestId('metric-icon')).toBeInTheDocument()

      rerender(<MetricCard {...defaultProps} icon="TrendingUp" />)
      expect(screen.getByTestId('metric-icon')).toBeInTheDocument()
    })

    it('should handle loading state', () => {
      render(<MetricCard {...defaultProps} isLoading={true} />)

      expect(screen.getByTestId('metric-skeleton')).toBeInTheDocument()
      expect(screen.queryByText('Total Users')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<MetricCard {...defaultProps} />)

      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 'Total Users metric')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('should have accessible change indicator', () => {
      render(<MetricCard {...defaultProps} trend="up" change="+5.2%" />)

      const changeElement = screen.getByText('+5.2%')
      expect(changeElement).toHaveAttribute('aria-label', 'Increase of 5.2%')
    })

    it('should support keyboard navigation', () => {
      render(<MetricCard {...defaultProps} onClick={jest.fn()} />)

      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('tabIndex', '0')
      expect(card).toHaveAttribute('role', 'button')
    })

    it('should provide screen reader friendly content', () => {
      render(<MetricCard {...defaultProps} />)

      expect(screen.getByLabelText('Total Users metric')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Dark Mode', () => {
    it('should apply dark mode styles correctly', () => {
      const MockedMetricCard = () => (
        <div className="dark">
          <MetricCard {...defaultProps} />
        </div>
      )

      render(<MockedMetricCard />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('dark:bg-gray-800')
      expect(card).toHaveClass('dark:border-gray-700')
    })

    it('should maintain contrast in dark mode', () => {
      const MockedMetricCard = () => (
        <div className="dark">
          <MetricCard {...defaultProps} />
        </div>
      )

      render(<MockedMetricCard />)

      const title = screen.getByText('Total Users')
      expect(title).toHaveClass('dark:text-gray-200')

      const value = screen.getByText('1,234')
      expect(value).toHaveClass('dark:text-white')
    })

    it('should handle trend colors in dark mode', () => {
      const MockedMetricCard = () => (
        <div className="dark">
          <MetricCard {...defaultProps} trend="up" change="+5.2%" />
        </div>
      )

      render(<MockedMetricCard />)

      const changeElement = screen.getByText('+5.2%')
      expect(changeElement).toHaveClass('dark:text-green-400')
    })
  })

  describe('User Interactions', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn()
      render(<MetricCard {...defaultProps} onClick={handleClick} />)

      const card = screen.getByRole('button')
      card.click()

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle keyboard events', () => {
      const handleClick = jest.fn()
      render(<MetricCard {...defaultProps} onClick={handleClick} />)

      const card = screen.getByRole('button')
      card.focus()

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      card.dispatchEvent(enterEvent)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should show hover effects', () => {
      render(<MetricCard {...defaultProps} onClick={jest.fn()} />)

      const card = screen.getByRole('button')
      expect(card).toHaveClass('hover:shadow-md')
      expect(card).toHaveClass('transition-shadow')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing required props gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      // This should not crash the component
      render(<MetricCard title="" value="" />)

      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('should handle invalid trend values', () => {
      render(<MetricCard {...defaultProps} trend="invalid" as any />)

      // Should fallback to neutral styling
      const changeElement = screen.getByText('+5.2%')
      expect(changeElement).toHaveClass('text-gray-600')
    })
  })
})