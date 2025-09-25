import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '@/components/ui/DataTable'

// Mock data for testing
const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Moderator', status: 'Active' },
]

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  { key: 'role', label: 'Role', sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true },
]

describe('DataTable', () => {
  const defaultProps = {
    data: mockData,
    columns: mockColumns,
    keyField: 'id',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render data table with headers and data', () => {
      render(<DataTable {...defaultProps} />)

      // Check headers
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()

      // Check data rows
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should render empty state when no data provided', () => {
      render(<DataTable {...defaultProps} data={[]} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.getByTestId('empty-table-state')).toBeInTheDocument()
    })

    it('should render loading state', () => {
      render(<DataTable {...defaultProps} isLoading={true} />)

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('should render pagination when enabled', () => {
      render(<DataTable {...defaultProps} pagination={{ pageSize: 2, showPagination: true }} />)

      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument()
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort data when clicking sortable column headers', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} />)

      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      expect(nameHeader).toHaveAttribute('aria-sort', 'none')

      await user.click(nameHeader)

      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

      // Check if data is sorted (first item should be Alice Brown alphabetically)
      const rows = screen.getAllByRole('row')
      const firstDataRow = rows[1] // Skip header row
      expect(within(firstDataRow).getByText('Alice Brown')).toBeInTheDocument()
    })

    it('should toggle sort direction on repeated clicks', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} />)

      const nameHeader = screen.getByRole('columnheader', { name: /name/i })

      // First click - ascending
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

      // Second click - descending
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending')

      // Third click - none
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'none')
    })

    it('should display sort indicators', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} />)

      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      await user.click(nameHeader)

      expect(screen.getByTestId('sort-asc-icon')).toBeInTheDocument()
    })

    it('should handle multi-column sorting', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} multiSort={true} />)

      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      const roleHeader = screen.getByRole('columnheader', { name: /role/i })

      await user.click(nameHeader)
      await user.click(roleHeader, { ctrlKey: true })

      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      expect(roleHeader).toHaveAttribute('aria-sort', 'ascending')
    })
  })

  describe('Filtering Functionality', () => {
    it('should show filter controls when filtering is enabled', () => {
      render(<DataTable {...defaultProps} showFilters={true} />)

      expect(screen.getByPlaceholderText(/filter by name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/filter by email/i)).toBeInTheDocument()
    })

    it('should filter data based on text input', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} showFilters={true} />)

      const nameFilter = screen.getByPlaceholderText(/filter by name/i)
      await user.type(nameFilter, 'John')

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('should show filtered result count', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} showFilters={true} />)

      const nameFilter = screen.getByPlaceholderText(/filter by name/i)
      await user.type(nameFilter, 'John')

      await waitFor(() => {
        expect(screen.getByText(/showing 1 of 4 results/i)).toBeInTheDocument()
      })
    })

    it('should handle multiple filter conditions', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} showFilters={true} />)

      const roleFilter = screen.getByPlaceholderText(/filter by role/i)
      const statusFilter = screen.getByPlaceholderText(/filter by status/i)

      await user.type(roleFilter, 'User')
      await user.type(statusFilter, 'Active')

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument() // Inactive User
      })
    })

    it('should clear filters', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} showFilters={true} />)

      const nameFilter = screen.getByPlaceholderText(/filter by name/i)
      await user.type(nameFilter, 'John')

      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearButton)

      expect(nameFilter).toHaveValue('')
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  describe('Selection Functionality', () => {
    it('should handle row selection', async () => {
      const onSelectionChange = jest.fn()
      const user = userEvent.setup()

      render(<DataTable {...defaultProps} selectable={true} onSelectionChange={onSelectionChange} />)

      const firstCheckbox = screen.getByRole('checkbox', { name: /select row 1/i })
      await user.click(firstCheckbox)

      expect(onSelectionChange).toHaveBeenCalledWith([1])
    })

    it('should handle select all functionality', async () => {
      const onSelectionChange = jest.fn()
      const user = userEvent.setup()

      render(<DataTable {...defaultProps} selectable={true} onSelectionChange={onSelectionChange} />)

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all rows/i })
      await user.click(selectAllCheckbox)

      expect(onSelectionChange).toHaveBeenCalledWith([1, 2, 3, 4])
    })

    it('should show selection count', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} selectable={true} />)

      const firstCheckbox = screen.getByRole('checkbox', { name: /select row 1/i })
      await user.click(firstCheckbox)

      expect(screen.getByText(/1 row selected/i)).toBeInTheDocument()
    })

    it('should handle bulk actions on selected rows', async () => {
      const onBulkAction = jest.fn()
      const user = userEvent.setup()

      const bulkActions = [
        { key: 'delete', label: 'Delete', action: onBulkAction },
        { key: 'activate', label: 'Activate', action: onBulkAction },
      ]

      render(
        <DataTable
          {...defaultProps}
          selectable={true}
          bulkActions={bulkActions}
        />
      )

      const firstCheckbox = screen.getByRole('checkbox', { name: /select row 1/i })
      await user.click(firstCheckbox)

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(onBulkAction).toHaveBeenCalledWith('delete', [1])
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure with ARIA attributes', () => {
      render(<DataTable {...defaultProps} />)

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Data table')

      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders).toHaveLength(4)

      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(5) // 1 header + 4 data rows
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} />)

      const table = screen.getByRole('table')
      table.focus()

      await user.keyboard('{ArrowDown}')
      // Should navigate to first data row
      expect(document.activeElement).toHaveAttribute('role', 'row')
    })

    it('should provide screen reader announcements for sorting', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} />)

      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      await user.click(nameHeader)

      expect(screen.getByRole('status')).toHaveTextContent(/sorted by name ascending/i)
    })

    it('should provide screen reader announcements for filtering', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} showFilters={true} />)

      const nameFilter = screen.getByPlaceholderText(/filter by name/i)
      await user.type(nameFilter, 'John')

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/showing 1 of 4 results/i)
      })
    })

    it('should have proper focus management', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} showFilters={true} />)

      const nameFilter = screen.getByPlaceholderText(/filter by name/i)
      nameFilter.focus()

      await user.keyboard('{Tab}')
      expect(screen.getByPlaceholderText(/filter by email/i)).toHaveFocus()
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle mobile layout', () => {
      render(<DataTable {...defaultProps} responsive={true} />)

      const table = screen.getByRole('table')
      expect(table).toHaveClass('responsive-table')
    })

    it('should stack columns on small screens', () => {
      render(<DataTable {...defaultProps} stackOnMobile={true} />)

      const table = screen.getByRole('table')
      expect(table).toHaveClass('stack-on-mobile')
    })

    it('should show horizontal scroll on overflow', () => {
      render(<DataTable {...defaultProps} />)

      const tableContainer = screen.getByTestId('table-container')
      expect(tableContainer).toHaveClass('overflow-x-auto')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed data gracefully', () => {
      const malformedData = [
        { id: 1, name: 'John' }, // Missing fields
        { id: 2 }, // Only ID
        null, // Null entry
      ]

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<DataTable {...defaultProps} data={malformedData as any} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      consoleError.mockRestore()
    })

    it('should handle missing key field', () => {
      const dataWithoutKeys = mockData.map(({ id, ...rest }) => rest)

      render(<DataTable {...defaultProps} data={dataWithoutKeys as any} />)

      expect(screen.getByText('Table configuration error')).toBeInTheDocument()
    })

    it('should handle column configuration errors', () => {
      const invalidColumns = [
        { key: '', label: 'Invalid' }, // Empty key
        { label: 'Missing Key' }, // No key field
      ]

      render(<DataTable {...defaultProps} columns={invalidColumns as any} />)

      expect(screen.getByText('Column configuration error')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: i % 3 === 0 ? 'Admin' : 'User',
        status: i % 2 === 0 ? 'Active' : 'Inactive',
      }))

      const start = performance.now()
      render(<DataTable {...defaultProps} data={largeData} pagination={{ pageSize: 50 }} />)
      const end = performance.now()

      expect(end - start).toBeLessThan(100)
    })

    it('should virtualize rows for very large datasets', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'User',
        status: 'Active',
      }))

      render(<DataTable {...defaultProps} data={largeData} virtualized={true} />)

      // Should only render visible rows
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeLessThan(100)
    })
  })
})