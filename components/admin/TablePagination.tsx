'use client'

import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'

export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelector?: boolean
  showPageInfo?: boolean
  maxVisiblePages?: number
  className?: string
  disabled?: boolean
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showPageInfo = true,
  maxVisiblePages = 5,
  className = '',
  disabled = false
}) => {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Calculate visible page numbers
  const getVisiblePages = (): number[] => {
    const pages: number[] = []

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Calculate start and end of visible range
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages, start + maxVisiblePages - 1)

      // Adjust start if end is at the boundary
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }

      // Always include first and last pages with ellipsis if needed
      if (start > 1) {
        pages.push(1)
        if (start > 2) {
          pages.push(-1) // Ellipsis marker
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push(-1) // Ellipsis marker
        }
        pages.push(totalPages)
      }
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  const buttonClass = `
    px-3 py-2 text-sm font-medium rounded-md border
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed
    border-gray-300 dark:border-gray-600
    text-gray-700 dark:text-gray-300
    bg-white dark:bg-gray-800
    hover:bg-gray-50 dark:hover:bg-gray-700
    disabled:hover:bg-white dark:disabled:hover:bg-gray-800
  `

  const activeButtonClass = `
    px-3 py-2 text-sm font-medium rounded-md border
    bg-blue-600 border-blue-600 text-white
    hover:bg-blue-700 hover:border-blue-700
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
  `

  if (totalPages <= 1) {
    return null // Don't show pagination for single page
  }

  return (
    <nav
      role="navigation"
      aria-label="Table pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Page size selector and info */}
      <div className="flex items-center gap-4">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-gray-300">
              Show:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="px-3 py-1 text-sm border rounded-md
                       border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800
                       text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
          </div>
        )}

        {showPageInfo && (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of {totalItems.toLocaleString()}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || disabled}
          className={buttonClass}
          aria-label="Go to first page"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className={buttonClass}
          aria-label="Go to previous page"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === -1) {
              // Ellipsis
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-gray-400 dark:text-gray-600"
                  aria-hidden="true"
                >
                  ...
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={disabled}
                className={page === currentPage ? activeButtonClass : buttonClass}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className={buttonClass}
          aria-label="Go to next page"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || disabled}
          className={buttonClass}
          aria-label="Go to last page"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  )
}