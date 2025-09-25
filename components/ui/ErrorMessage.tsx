'use client'

import React from 'react'
import { AlertCircle, XCircle, RefreshCw, Home } from 'lucide-react'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  onGoHome?: () => void
  type?: 'error' | 'warning' | 'info'
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  onGoHome,
  type = 'error'
}) => {
  const iconClasses = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  }

  const borderClasses = {
    error: 'border-red-800',
    warning: 'border-yellow-800',
    info: 'border-blue-800'
  }

  const bgClasses = {
    error: 'bg-red-900/20',
    warning: 'bg-yellow-900/20',
    info: 'bg-blue-900/20'
  }

  return (
    <div className={`${bgClasses[type]} border ${borderClasses[type]} rounded-lg p-6`}>
      <div className="flex items-start">
        <AlertCircle className={`h-6 w-6 ${iconClasses[type]} mr-3 flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
          <p className="text-gray-300">{message}</p>
          {(onRetry || onGoHome) && (
            <div className="mt-4 flex space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              )}
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ErrorCard: React.FC<{
  error: Error | string
  onRetry?: () => void
}> = ({ error, onRetry }) => {
  const message = typeof error === 'string' ? error : error.message

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">Something went wrong</h3>
      <p className="text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  )
}

export const EmptyState: React.FC<{
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: {
    label: string
    onClick: () => void
  }
}> = ({ title, description, icon: Icon, action }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
      {Icon && <Icon className="h-12 w-12 text-gray-500 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 mb-4 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}