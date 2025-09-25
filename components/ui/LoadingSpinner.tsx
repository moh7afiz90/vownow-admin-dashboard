import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'white' | 'blue' | 'gray'
  fullScreen?: boolean
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  fullScreen = false,
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const colorClasses = {
    white: 'text-white',
    blue: 'text-blue-600',
    gray: 'text-gray-400'
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color]}`}>{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export const LoadingOverlay: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
      <LoadingSpinner size="lg" color="white" text={text} />
    </div>
  )
}

export const LoadingCard: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 flex items-center justify-center">
      <LoadingSpinner size="md" color="gray" text={text} />
    </div>
  )
}

export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="inline-flex items-center space-x-2">
      <LoadingSpinner size="sm" color="gray" />
      {text && <span className="text-sm text-gray-400">{text}</span>}
    </div>
  )
}