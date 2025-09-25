import React from 'react'

export interface WidgetGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  responsive?: boolean
  isLoading?: boolean
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
  responsive = true,
  isLoading = false,
}) => {
  const getColumnClasses = (columns: number, responsive: boolean) => {
    if (!responsive) {
      return `grid-cols-${columns}`
    }

    // Responsive grid classes
    switch (columns) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-1 md:grid-cols-2'
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      case 6:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
      case 12:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-12'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  const getGapClasses = (gap: 'sm' | 'md' | 'lg' | 'xl') => {
    switch (gap) {
      case 'sm':
        return 'gap-2'
      case 'lg':
        return 'gap-8'
      case 'xl':
        return 'gap-12'
      default:
        return 'gap-6'
    }
  }

  const columnClasses = getColumnClasses(columns, responsive)
  const gapClasses = getGapClasses(gap)

  if (isLoading) {
    return (
      <div
        className={`grid ${columnClasses} ${gapClasses} ${className}`}
        data-testid="widget-grid-loading"
        aria-label="Loading widgets"
      >
        {Array.from({ length: columns }, (_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`grid ${columnClasses} ${gapClasses} ${className}`}
      data-testid="widget-grid"
      role="grid"
      aria-label={`Widget grid with ${columns} columns`}
    >
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          role="gridcell"
          className="min-w-0" // Prevents grid items from overflowing
        >
          {child}
        </div>
      ))}
    </div>
  )
}