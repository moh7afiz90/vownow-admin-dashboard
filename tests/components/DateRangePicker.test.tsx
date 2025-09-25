import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { format, addDays, subDays } from 'date-fns'

// Mock date-fns functions
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn(),
  addDays: jest.fn(),
  subDays: jest.fn(),
  isValid: jest.fn(),
  isBefore: jest.fn(),
  isAfter: jest.fn(),
  differenceInDays: jest.fn(),
}))

const mockedFormat = format as jest.MockedFunction<typeof format>
const mockedAddDays = addDays as jest.MockedFunction<typeof addDays>
const mockedSubDays = subDays as jest.MockedFunction<typeof subDays>

// Mock calendar component
jest.mock('@/components/ui/Calendar', () => ({
  Calendar: ({ selected, onSelect, disabled, ...props }: any) => (
    <div data-testid="calendar" {...props}>
      <button
        data-testid="date-button"
        onClick={() => onSelect && onSelect(new Date('2024-01-15'))}
      >
        Select Date
      </button>
      {selected && <span data-testid="selected-date">{selected.toString()}</span>}
    </div>
  ),
}))

describe('DateRangePicker', () => {
  const defaultProps = {
    onDateRangeChange: jest.fn(),
    placeholder: 'Select date range',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedFormat.mockReturnValue('2024-01-15')
    mockedAddDays.mockImplementation((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000))
    mockedSubDays.mockImplementation((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000))
  })

  describe('Component Rendering', () => {
    it('should render date range picker with placeholder', () => {
      render(<DateRangePicker {...defaultProps} />)

      expect(screen.getByPlaceholderText('Select date range')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open calendar/i })).toBeInTheDocument()
    })

    it('should render with preset date range', () => {
      const presetRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      }

      render(<DateRangePicker {...defaultProps} value={presetRange} />)

      expect(screen.getByDisplayValue(/2024-01-01.*2024-01-31/)).toBeInTheDocument()
    })

    it('should render calendar icon', () => {
      render(<DateRangePicker {...defaultProps} />)

      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
    })

    it('should render with custom format', () => {
      mockedFormat.mockReturnValue('Jan 1, 2024')

      const dateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      }

      render(<DateRangePicker {...defaultProps} value={dateRange} dateFormat="MMM d, yyyy" />)

      expect(mockedFormat).toHaveBeenCalledWith(expect.any(Date), 'MMM d, yyyy')
    })
  })

  describe('Calendar Interaction', () => {
    it('should open calendar when input is clicked', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      expect(screen.getByTestId('calendar')).toBeInTheDocument()
    })

    it('should open calendar when button is clicked', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const button = screen.getByRole('button', { name: /open calendar/i })
      await user.click(button)

      expect(screen.getByTestId('calendar')).toBeInTheDocument()
    })

    it('should close calendar when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <DateRangePicker {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      expect(screen.getByTestId('calendar')).toBeInTheDocument()

      const outside = screen.getByTestId('outside')
      await user.click(outside)

      await waitFor(() => {
        expect(screen.queryByTestId('calendar')).not.toBeInTheDocument()
      })
    })

    it('should handle ESC key to close calendar', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      expect(screen.getByTestId('calendar')).toBeInTheDocument()

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('calendar')).not.toBeInTheDocument()
      })
    })
  })

  describe('Date Selection', () => {
    it('should handle single date selection for range start', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      const dateButton = screen.getByTestId('date-button')
      await user.click(dateButton)

      expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith({
        from: expect.any(Date),
        to: undefined,
      })
    })

    it('should handle range completion with second date selection', async () => {
      const user = userEvent.setup()
      const dateRange = { from: new Date('2024-01-01'), to: undefined }

      const { rerender } = render(<DateRangePicker {...defaultProps} value={dateRange} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      const dateButton = screen.getByTestId('date-button')
      await user.click(dateButton)

      rerender(
        <DateRangePicker
          {...defaultProps}
          value={{ from: new Date('2024-01-01'), to: new Date('2024-01-15') }}
        />
      )

      expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith({
        from: expect.any(Date),
        to: expect.any(Date),
      })
    })

    it('should clear selection when clear button is clicked', async () => {
      const user = userEvent.setup()
      const dateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      }

      render(<DateRangePicker {...defaultProps} value={dateRange} />)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith({
        from: undefined,
        to: undefined,
      })
    })

    it('should handle preset quick selections', async () => {
      const user = userEvent.setup()
      const presets = [
        { label: 'Last 7 days', value: 7 },
        { label: 'Last 30 days', value: 30 },
        { label: 'Last 90 days', value: 90 },
      ]

      render(<DateRangePicker {...defaultProps} presets={presets} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      const presetButton = screen.getByRole('button', { name: /last 7 days/i })
      await user.click(presetButton)

      expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith({
        from: expect.any(Date),
        to: expect.any(Date),
      })
    })
  })

  describe('Validation', () => {
    it('should validate date range with min/max dates', async () => {
      const user = userEvent.setup()
      const minDate = new Date('2024-01-01')
      const maxDate = new Date('2024-12-31')

      render(
        <DateRangePicker
          {...defaultProps}
          minDate={minDate}
          maxDate={maxDate}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      expect(screen.getByTestId('calendar')).toHaveAttribute('data-min-date')
      expect(screen.getByTestId('calendar')).toHaveAttribute('data-max-date')
    })

    it('should show error for invalid date range', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'invalid-date-range')

      expect(screen.getByText('Invalid date range')).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should validate that end date is after start date', async () => {
      const invalidRange = {
        from: new Date('2024-01-31'),
        to: new Date('2024-01-01'), // End before start
      }

      render(<DateRangePicker {...defaultProps} value={invalidRange} />)

      expect(screen.getByText('End date must be after start date')).toBeInTheDocument()
    })

    it('should validate maximum range duration', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} maxRangeDays={30} />)

      const largeRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-03-01'), // 60 days
      }

      const { rerender } = render(<DateRangePicker {...defaultProps} value={largeRange} maxRangeDays={30} />)

      expect(screen.getByText('Date range cannot exceed 30 days')).toBeInTheDocument()
    })

    it('should validate minimum range duration', async () => {
      const smallRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-02'), // 1 day
      }

      render(<DateRangePicker {...defaultProps} value={smallRange} minRangeDays={7} />)

      expect(screen.getByText('Date range must be at least 7 days')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', 'Select date range')
      expect(input).toHaveAttribute('aria-expanded', 'false')

      const button = screen.getByRole('button', { name: /open calendar/i })
      expect(button).toHaveAttribute('aria-label', 'Open calendar')
    })

    it('should update aria-expanded when calendar opens', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-expanded', 'false')

      await user.click(input)

      expect(input).toHaveAttribute('aria-expanded', 'true')
    })

    it('should have proper role and labeling for calendar', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      const calendar = screen.getByTestId('calendar')
      expect(calendar).toHaveAttribute('role', 'dialog')
      expect(calendar).toHaveAttribute('aria-label', 'Select date range')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      input.focus()

      await user.keyboard('{Enter}')
      expect(screen.getByTestId('calendar')).toBeInTheDocument()

      await user.keyboard('{Tab}')
      expect(screen.getByTestId('date-button')).toHaveFocus()
    })

    it('should announce selection changes to screen readers', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      const dateButton = screen.getByTestId('date-button')
      await user.click(dateButton)

      expect(screen.getByRole('status')).toHaveTextContent(/date range selected/i)
    })

    it('should provide error announcements', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'invalid')

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid date range')
    })
  })

  describe('Formatting and Display', () => {
    it('should format dates according to locale', () => {
      const dateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      }

      render(<DateRangePicker {...defaultProps} value={dateRange} locale="en-GB" />)

      expect(mockedFormat).toHaveBeenCalledWith(expect.any(Date), expect.any(String))
    })

    it('should display range separator correctly', () => {
      const dateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      }

      render(<DateRangePicker {...defaultProps} value={dateRange} separator=" to " />)

      expect(screen.getByDisplayValue(/ to /)).toBeInTheDocument()
    })

    it('should handle single date display', () => {
      const singleDate = {
        from: new Date('2024-01-01'),
        to: undefined,
      }

      render(<DateRangePicker {...defaultProps} value={singleDate} />)

      // Should show only start date
      expect(screen.getByDisplayValue(/2024-01-01/)).toBeInTheDocument()
    })

    it('should show relative dates when enabled', () => {
      const recentRange = {
        from: subDays(new Date(), 7),
        to: new Date(),
      }

      render(<DateRangePicker {...defaultProps} value={recentRange} showRelative={true} />)

      expect(screen.getByText(/last 7 days/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid date objects gracefully', () => {
      const invalidRange = {
        from: new Date('invalid-date'),
        to: new Date('2024-01-31'),
      }

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<DateRangePicker {...defaultProps} value={invalidRange} />)

      expect(screen.getByText('Invalid date range')).toBeInTheDocument()
      consoleError.mockRestore()
    })

    it('should handle missing callback gracefully', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker placeholder="Select date range" />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      const dateButton = screen.getByTestId('date-button')
      await user.click(dateButton)

      // Should not crash even without callback
      expect(screen.getByTestId('calendar')).toBeInTheDocument()
    })

    it('should recover from timezone-related errors', () => {
      const dateWithTimezone = new Date('2024-01-01T00:00:00-05:00')

      render(
        <DateRangePicker
          {...defaultProps}
          value={{ from: dateWithTimezone, to: undefined }}
        />
      )

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn()
      const MemoizedDateRangePicker = React.memo(() => {
        renderSpy()
        return <DateRangePicker {...defaultProps} />
      })

      const { rerender } = render(<MemoizedDateRangePicker />)

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(<MemoizedDateRangePicker />)

      expect(renderSpy).toHaveBeenCalledTimes(1)
    })

    it('should debounce input changes', async () => {
      const user = userEvent.setup()
      render(<DateRangePicker {...defaultProps} />)

      const input = screen.getByRole('textbox')

      await user.type(input, '2024-01-01')

      // Should debounce multiple onChange calls
      expect(defaultProps.onDateRangeChange).toHaveBeenCalledTimes(1)
    })
  })
})