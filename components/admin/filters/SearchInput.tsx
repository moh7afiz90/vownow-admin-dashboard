'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

export interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  debounceMs?: number
  disabled?: boolean
  loading?: boolean
  clearable?: boolean
  showSearchIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled'
  className?: string
  error?: string
  minLength?: number
  maxLength?: number
  autoFocus?: boolean
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  disabled = false,
  loading = false,
  clearable = true,
  showSearchIcon = true,
  size = 'md',
  variant = 'default',
  className = '',
  error,
  minLength = 0,
  maxLength,
  autoFocus = false
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const [isDebouncing, setIsDebouncing] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Sync internal state with prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Debounced change handler
  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      setIsDebouncing(true)

      debounceTimeoutRef.current = setTimeout(() => {
        onChange(newValue)
        setIsDebouncing(false)

        // Trigger search callback if provided
        if (onSearch && newValue.length >= minLength) {
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
          }
          searchTimeoutRef.current = setTimeout(() => {
            onSearch(newValue)
          }, 50) // Small delay to ensure state updates
        }
      }, debounceMs)
    },
    [onChange, onSearch, debounceMs, minLength]
  )

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value

      // Apply max length constraint
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength)
      }

      setInputValue(newValue)
      debouncedOnChange(newValue)
    },
    [debouncedOnChange, maxLength]
  )

  // Handle clear
  const handleClear = useCallback(() => {
    if (disabled) return

    setInputValue('')

    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    setIsDebouncing(false)
    onChange('')

    if (onSearch) {
      onSearch('')
    }

    // Focus input after clearing
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled, onChange, onSearch])

  // Handle key down events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          // Immediately trigger search on Enter
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
          }
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
          }
          setIsDebouncing(false)
          onChange(inputValue)
          if (onSearch && inputValue.length >= minLength) {
            onSearch(inputValue)
          }
          break

        case 'Escape':
          if (inputValue) {
            handleClear()
          } else {
            inputRef.current?.blur()
          }
          break
      }
    },
    [inputValue, onChange, onSearch, minLength, handleClear]
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  // Base input classes
  const baseInputClasses = `
    w-full border rounded-md transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:bg-gray-100 dark:disabled:bg-gray-700
    ${sizeClasses[size]}
  `

  // Variant classes
  const variantClasses = variant === 'filled'
    ? 'bg-gray-50 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-gray-300 dark:focus:border-gray-600'
    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'

  // Error classes
  const errorClasses = error
    ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
    : 'focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500'

  // Focus classes
  const focusClasses = isFocused && !error
    ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-500 dark:border-blue-500'
    : ''

  const inputClasses = `
    ${baseInputClasses}
    ${variantClasses}
    ${errorClasses}
    ${focusClasses}
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    ${showSearchIcon ? 'pl-10' : ''}
    ${(clearable && inputValue) || loading ? 'pr-10' : ''}
    ${className}
  `

  const showLoading = loading || isDebouncing
  const showClear = clearable && inputValue && !showLoading && !disabled

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      {showSearchIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className={`${iconSizeClasses[size]} text-gray-400`} />
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={inputClasses}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'search-input-error' : undefined}
      />

      {/* Loading indicator or Clear button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {showLoading && (
          <Loader2 className={`${iconSizeClasses[size]} text-gray-400 animate-spin`} />
        )}

        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className={`
              p-1 rounded-full transition-colors
              hover:bg-gray-200 dark:hover:bg-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            `}
            aria-label="Clear search"
          >
            <X className={iconSizeClasses[size]} />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div id="search-input-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Character count (if maxLength is set) */}
      {maxLength && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          {inputValue.length} / {maxLength}
        </div>
      )}

      {/* Search status for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {isDebouncing && 'Searching...'}
        {inputValue.length > 0 && inputValue.length < minLength && `Enter at least ${minLength} characters to search`}
      </div>
    </div>
  )
}