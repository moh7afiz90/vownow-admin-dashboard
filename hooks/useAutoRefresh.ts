import useSWR, { SWRConfiguration, SWRResponse, mutate } from 'swr'
import { useCallback, useEffect, useState } from 'react'

// Default refresh interval: 5 minutes
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000

interface UseAutoRefreshOptions<T = any> extends SWRConfiguration<T> {
  /**
   * Enable/disable auto-refresh
   */
  enabled?: boolean
  /**
   * Custom refresh interval in milliseconds
   */
  interval?: number
  /**
   * Enable refresh on window focus
   */
  refreshOnFocus?: boolean
  /**
   * Enable refresh on reconnect
   */
  refreshOnReconnect?: boolean
  /**
   * Custom fetcher function
   */
  fetcher?: (url: string) => Promise<T>
  /**
   * Callback on successful refresh
   */
  onSuccess?: (data: T) => void
  /**
   * Callback on error
   */
  onError?: (error: Error) => void
}

interface UseAutoRefreshReturn<T = any> extends SWRResponse<T> {
  /**
   * Manually trigger a refresh
   */
  refresh: () => Promise<void>
  /**
   * Check if currently refreshing
   */
  isRefreshing: boolean
  /**
   * Last refresh timestamp
   */
  lastRefreshed: Date | null
  /**
   * Next scheduled refresh time
   */
  nextRefresh: Date | null
  /**
   * Pause auto-refresh
   */
  pause: () => void
  /**
   * Resume auto-refresh
   */
  resume: () => void
  /**
   * Is auto-refresh paused
   */
  isPaused: boolean
}

/**
 * Default fetcher for JSON APIs
 */
const defaultFetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

/**
 * Hook for auto-refreshing data with SWR
 */
export function useAutoRefresh<T = any>(
  url: string | null,
  options: UseAutoRefreshOptions<T> = {}
): UseAutoRefreshReturn<T> {
  const {
    enabled = true,
    interval = DEFAULT_REFRESH_INTERVAL,
    refreshOnFocus = true,
    refreshOnReconnect = true,
    fetcher = defaultFetcher,
    onSuccess,
    onError,
    ...swrOptions
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Configure SWR options
  const config: SWRConfiguration<T> = {
    ...swrOptions,
    refreshInterval: enabled && !isPaused ? interval : 0,
    revalidateOnFocus: enabled && !isPaused && refreshOnFocus,
    revalidateOnReconnect: enabled && !isPaused && refreshOnReconnect,
    onSuccess: (data) => {
      setLastRefreshed(new Date())
      setIsRefreshing(false)
      if (enabled && !isPaused) {
        setNextRefresh(new Date(Date.now() + interval))
      }
      onSuccess?.(data)
    },
    onError: (error) => {
      setIsRefreshing(false)
      onError?.(error)
    },
    fetcher,
  }

  // Use SWR hook
  const swr = useSWR<T>(enabled ? url : null, config)

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!url) return

    setIsRefreshing(true)
    try {
      await mutate(url)
    } finally {
      setIsRefreshing(false)
    }
  }, [url])

  // Pause auto-refresh
  const pause = useCallback(() => {
    setIsPaused(true)
    setNextRefresh(null)
  }, [])

  // Resume auto-refresh
  const resume = useCallback(() => {
    setIsPaused(false)
    if (enabled) {
      setNextRefresh(new Date(Date.now() + interval))
      refresh()
    }
  }, [enabled, interval, refresh])

  // Update next refresh time
  useEffect(() => {
    if (!enabled || isPaused || !lastRefreshed) return

    const timer = setInterval(() => {
      setNextRefresh(new Date(Date.now() + interval))
    }, 1000)

    return () => clearInterval(timer)
  }, [enabled, isPaused, interval, lastRefreshed])

  return {
    ...swr,
    refresh,
    isRefreshing,
    lastRefreshed,
    nextRefresh,
    pause,
    resume,
    isPaused,
  }
}

/**
 * Hook for auto-refreshing multiple endpoints
 */
export function useMultiAutoRefresh<T extends Record<string, any>>(
  endpoints: Record<string, string | null>,
  options: UseAutoRefreshOptions = {}
): Record<string, UseAutoRefreshReturn> {
  const results: Record<string, UseAutoRefreshReturn> = {}

  Object.entries(endpoints).forEach(([key, url]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useAutoRefresh(url, options)
  })

  return results
}

/**
 * Global refresh trigger for all SWR caches
 */
export async function refreshAll(): Promise<void> {
  await mutate(() => true, undefined, { revalidate: true })
}

/**
 * Refresh specific keys matching a pattern
 */
export async function refreshPattern(pattern: RegExp): Promise<void> {
  await mutate(
    (key) => typeof key === 'string' && pattern.test(key),
    undefined,
    { revalidate: true }
  )
}

/**
 * Hook for refresh indicator
 */
export function useRefreshIndicator() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [progress, setProgress] = useState(0)

  const startRefresh = useCallback(() => {
    setIsRefreshing(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 100)

    return () => {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        setIsRefreshing(false)
        setProgress(0)
      }, 500)
    }
  }, [])

  return {
    isRefreshing,
    progress,
    startRefresh,
  }
}