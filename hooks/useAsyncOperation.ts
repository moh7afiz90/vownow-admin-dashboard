import { useState, useCallback } from 'react'

interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseAsyncOperationReturn<T> extends AsyncOperationState<T> {
  execute: (...args: any[]) => Promise<T | void>
  reset: () => void
}

export function useAsyncOperation<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
    initialData?: T | null
  }
): UseAsyncOperationReturn<T> {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: options?.initialData || null,
    loading: false,
    error: null
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | void> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await asyncFunction(...args)
        setState({ data: result, loading: false, error: null })
        options?.onSuccess?.(result)
        return result
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error))
        setState(prev => ({ ...prev, loading: false, error: errorObj }))
        options?.onError?.(errorObj)
      }
    },
    [asyncFunction, options]
  )

  const reset = useCallback(() => {
    setState({
      data: options?.initialData || null,
      loading: false,
      error: null
    })
  }, [options?.initialData])

  return {
    ...state,
    execute,
    reset
  }
}

export function useAsyncEffect<T = any>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
): AsyncOperationState<T> {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: true,
    error: null
  })

  useCallback(() => {
    let cancelled = false

    const execute = async () => {
      setState({ data: null, loading: true, error: null })

      try {
        const result = await asyncFunction()
        if (!cancelled) {
          setState({ data: result, loading: false, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          const errorObj = error instanceof Error ? error : new Error(String(error))
          setState({ data: null, loading: false, error: errorObj })
        }
      }
    }

    execute()

    return () => {
      cancelled = true
    }
  }, dependencies)()

  return state
}