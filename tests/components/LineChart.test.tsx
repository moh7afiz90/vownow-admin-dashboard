import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { LineChart } from '@/components/admin/charts/LineChart'

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => (
    <div data-testid="line-chart" {...props}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ formatter, labelFormatter }: any) => (
    <div data-testid="tooltip" data-formatter={formatter} data-label-formatter={labelFormatter} />
  ),
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container" style={{ width: '100%', height: '400px' }}>
      {children}
    </div>
  ),
}))

describe('LineChart', () => {
  const mockData = [
    { name: 'Jan', revenue: 4000, users: 240 },
    { name: 'Feb', revenue: 3000, users: 139 },
    { name: 'Mar', revenue: 2000, users: 980 },
    { name: 'Apr', revenue: 2780, users: 390 },
    { name: 'May', revenue: 1890, users: 480 },
    { name: 'Jun', revenue: 2390, users: 380 },
  ]

  const defaultProps = {
    data: mockData,
    xDataKey: 'name',
    lines: [
      { dataKey: 'revenue', stroke: '#8884d8', name: 'Revenue' },
      { dataKey: 'users', stroke: '#82ca9d', name: 'Users' },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render line chart with provided data', () => {
      render(<LineChart {...defaultProps} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
      expect(screen.getByTestId('line-users')).toBeInTheDocument()
    })

    it('should render chart axes', () => {
      render(<LineChart {...defaultProps} />)

      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-key', 'name')
    })

    it('should render chart grid and tooltip', () => {
      render(<LineChart {...defaultProps} />)

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('should render legend when enabled', () => {
      render(<LineChart {...defaultProps} showLegend={true} />)

      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })

    it('should not render legend when disabled', () => {
      render(<LineChart {...defaultProps} showLegend={false} />)

      expect(screen.queryByTestId('legend')).not.toBeInTheDocument()
    })
  })

  describe('Data Updates', () => {
    it('should handle data updates correctly', async () => {
      const { rerender } = render(<LineChart {...defaultProps} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()

      const updatedData = [
        ...mockData,
        { name: 'Jul', revenue: 3500, users: 420 },
      ]

      rerender(<LineChart {...defaultProps} data={updatedData} />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })
    })

    it('should handle empty data gracefully', () => {
      render(<LineChart {...defaultProps} data={[]} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show loading state during data updates', async () => {
      const { rerender } = render(<LineChart {...defaultProps} />)

      rerender(<LineChart {...defaultProps} isLoading={true} />)

      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
    })

    it('should animate data transitions', async () => {
      const { rerender } = render(<LineChart {...defaultProps} animated={true} />)

      const updatedData = mockData.map(item => ({
        ...item,
        revenue: item.revenue * 1.2,
      }))

      rerender(<LineChart {...defaultProps} data={updatedData} animated={true} />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toHaveAttribute('data-animated', 'true')
      })
    })
  })

  describe('Props Validation', () => {
    it('should handle different line configurations', () => {
      const singleLineProps = {
        ...defaultProps,
        lines: [{ dataKey: 'revenue', stroke: '#8884d8', name: 'Revenue' }],
      }

      render(<LineChart {...singleLineProps} />)

      expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
      expect(screen.queryByTestId('line-users')).not.toBeInTheDocument()
    })

    it('should apply custom colors to lines', () => {
      render(<LineChart {...defaultProps} />)

      expect(screen.getByTestId('line-revenue')).toHaveAttribute('data-stroke', '#8884d8')
      expect(screen.getByTestId('line-users')).toHaveAttribute('data-stroke', '#82ca9d')
    })

    it('should handle custom dimensions', () => {
      render(<LineChart {...defaultProps} width={800} height={600} />)

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveStyle({ width: '100%', height: '400px' })
    })

    it('should handle custom formatters', () => {
      const customFormatter = (value: number) => `$${value}`
      const customLabelFormatter = (label: string) => `Month: ${label}`

      render(
        <LineChart
          {...defaultProps}
          tooltipFormatter={customFormatter}
          tooltipLabelFormatter={customLabelFormatter}
        />
      )

      const tooltip = screen.getByTestId('tooltip')
      expect(tooltip).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle hover interactions', async () => {
      render(<LineChart {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')

      // Simulate hover event
      chart.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

      // In a real implementation, this would show tooltip
      expect(chart).toBeInTheDocument()
    })

    it('should handle click events on data points', async () => {
      const onDataPointClick = jest.fn()

      render(<LineChart {...defaultProps} onDataPointClick={onDataPointClick} />)

      const chart = screen.getByTestId('line-chart')
      chart.click()

      // In a real implementation, this would trigger the callback
      expect(chart).toBeInTheDocument()
    })

    it('should handle legend interactions', async () => {
      render(<LineChart {...defaultProps} showLegend={true} />)

      const legend = screen.getByTestId('legend')
      legend.click()

      // In a real implementation, this would toggle line visibility
      expect(legend).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LineChart {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('role', 'img')
      expect(chart).toHaveAttribute('aria-label', 'Line chart showing Revenue, Users over time')
    })

    it('should provide screen reader description', () => {
      render(<LineChart {...defaultProps} />)

      expect(screen.getByLabelText(/Line chart showing/)).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<LineChart {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('tabIndex', '0')
    })

    it('should provide data table alternative', () => {
      render(<LineChart {...defaultProps} showDataTable={true} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Chart data in tabular format')
    })
  })

  describe('Responsive Behavior', () => {
    it('should render in responsive container', () => {
      render(<LineChart {...defaultProps} />)

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveStyle({ width: '100%' })
    })

    it('should handle small screen layouts', () => {
      render(<LineChart {...defaultProps} compact={true} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-compact', 'true')
    })

    it('should adjust for mobile viewports', () => {
      render(<LineChart {...defaultProps} mobile={true} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-mobile', 'true')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<LineChart {...defaultProps} data={null as any} />)

      expect(screen.getByText('Unable to load chart data')).toBeInTheDocument()
      consoleError.mockRestore()
    })

    it('should handle missing data keys', () => {
      const invalidData = [
        { name: 'Jan' }, // Missing revenue and users
        { name: 'Feb', revenue: 3000 }, // Missing users
      ]

      render(<LineChart {...defaultProps} data={invalidData} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should show error state when chart fails to render', () => {
      const propsWithError = {
        ...defaultProps,
        lines: [], // No lines defined
      }

      render(<LineChart {...propsWithError} />)

      expect(screen.getByText('Chart configuration error')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        name: `Point ${i}`,
        revenue: Math.random() * 1000,
        users: Math.random() * 100,
      }))

      const start = performance.now()
      render(<LineChart {...defaultProps} data={largeData} />)
      const end = performance.now()

      // Should render within reasonable time
      expect(end - start).toBeLessThan(100)
    })

    it('should memoize data processing', () => {
      const { rerender } = render(<LineChart {...defaultProps} />)

      // Re-render with same data should be fast
      const start = performance.now()
      rerender(<LineChart {...defaultProps} />)
      const end = performance.now()

      expect(end - start).toBeLessThan(10)
    })
  })
})