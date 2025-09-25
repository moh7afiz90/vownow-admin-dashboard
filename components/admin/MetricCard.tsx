import React from 'react'
import { LucideIcon, Users, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string
  icon?: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  isLoading?: boolean
  onClick?: () => void
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  change,
  trend,
  description,
  isLoading = false,
  onClick,
}) => {
  if (isLoading) {
    return (
      <div
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse"
        data-testid="metric-skeleton"
        aria-label="Loading metric data"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const IconComponent = icon ? iconMap[icon] || Users : null

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getAriaLabel = (change?: string, trend?: 'up' | 'down' | 'neutral') => {
    if (!change || !trend) return undefined

    const percentage = change.replace(/[^0-9.]/g, '')
    const direction = trend === 'up' ? 'Increase' : trend === 'down' ? 'Decrease' : 'No change'
    return `${direction} of ${percentage}%`
  }

  // Validate props and log errors if needed
  React.useEffect(() => {
    if (!title || !value) {
      console.error('MetricCard: title and value are required props')
    }
  }, [title, value])

  // Use ref to handle native DOM events for testing
  const cardRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        onClick()
      }
    }

    const card = cardRef.current
    if (card) {
      card.addEventListener('keydown', handleKeyDown)
      return () => {
        card.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [onClick])

  const handleReactKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick()
    }
  }

  const cardProps = onClick
    ? {
        ref: cardRef,
        className: `
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-lg p-6
          transition-shadow duration-200
          cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        `,
        'aria-label': `${title} metric`,
        tabIndex: 0,
        role: 'button' as const,
        onClick,
        onKeyDown: handleReactKeyDown,
      }
    : {
        ref: cardRef,
        className: `
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-lg p-6
          transition-shadow duration-200
        `,
        'aria-label': `${title} metric`,
        tabIndex: 0,
        role: 'article' as const,
      }

  return (
    <div {...cardProps}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-200 mb-2">
            {title}
          </h3>
          <p
            className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
            aria-live="polite"
          >
            {value}
          </p>
          {change && (
            <p
              className={`text-sm ${getTrendColor(trend)}`}
              aria-label={getAriaLabel(change, trend)}
            >
              {change}
            </p>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {description}
            </p>
          )}
        </div>
        {IconComponent && (
          <div className="ml-4 flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <IconComponent
                className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                data-testid="metric-icon"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}