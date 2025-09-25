import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral'
  value?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  trend,
  value,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return TrendingUp
      case 'down':
        return TrendingDown
      case 'neutral':
        return Minus
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getSize = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-3 h-3',
          text: 'text-xs',
          gap: 'gap-1',
        }
      case 'lg':
        return {
          icon: 'w-5 h-5',
          text: 'text-lg',
          gap: 'gap-2',
        }
      default:
        return {
          icon: 'w-4 h-4',
          text: 'text-sm',
          gap: 'gap-1.5',
        }
    }
  }

  const Icon = getTrendIcon(trend)
  const colorClass = getTrendColor(trend)
  const sizeClasses = getSize(size)

  const getTrendDirection = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'increasing'
      case 'down':
        return 'decreasing'
      case 'neutral':
        return 'stable'
    }
  }

  return (
    <div
      className={`inline-flex items-center ${sizeClasses.gap} ${colorClass} ${className}`}
      aria-label={`Trend is ${getTrendDirection(trend)}${value ? ` by ${value}` : ''}${label ? ` ${label}` : ''}`}
    >
      {showIcon && (
        <Icon
          className={sizeClasses.icon}
          data-testid="trend-icon"
          aria-hidden="true"
        />
      )}
      {value && (
        <span className={`font-medium ${sizeClasses.text}`} data-testid="trend-value">
          {value}
        </span>
      )}
      {label && (
        <span className={`${sizeClasses.text} opacity-75`} data-testid="trend-label">
          {label}
        </span>
      )}
    </div>
  )
}