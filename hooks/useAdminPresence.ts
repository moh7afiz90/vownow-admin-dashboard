import { useEffect, useState } from 'react'
import { presenceManager, type PresenceData } from '@/lib/realtime/presence'

interface UseAdminPresenceOptions {
  userId: string
  email: string
  role: string
  enabled?: boolean
}

interface UseAdminPresenceReturn {
  isConnected: boolean
  onlineAdmins: PresenceData[]
  onlineCount: number
  error: Error | null
}

export function useAdminPresence({
  userId,
  email,
  role,
  enabled = true,
}: UseAdminPresenceOptions): UseAdminPresenceReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineAdmins, setOnlineAdmins] = useState<PresenceData[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      return
    }

    let mounted = true

    const initializePresence = async () => {
      try {
        const connected = await presenceManager.initialize(userId, email, role)
        if (mounted) {
          setIsConnected(connected)
          if (!connected) {
            setError(new Error('Failed to initialize presence tracking'))
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
          setIsConnected(false)
        }
      }
    }

    const handlePresenceUpdate = (event: CustomEvent) => {
      if (mounted) {
        const { onlineAdmins: admins, presenceState } = event.detail
        setOnlineCount(admins)
        setOnlineAdmins(presenceManager.getOnlineAdmins())
      }
    }

    // Initialize presence tracking
    initializePresence()

    // Listen for presence updates
    window.addEventListener(
      'admin-presence-update',
      handlePresenceUpdate as EventListener
    )

    // Cleanup on unmount
    return () => {
      mounted = false
      window.removeEventListener(
        'admin-presence-update',
        handlePresenceUpdate as EventListener
      )
      // Note: We don't call cleanup here as it should persist across component remounts
      // Only cleanup on logout or session end
    }
  }, [userId, email, role, enabled])

  // Update current page on route changes
  useEffect(() => {
    if (!isConnected) return

    const updatePage = () => {
      presenceManager.updateCurrentPage(window.location.pathname)
    }

    // Update immediately
    updatePage()

    // Listen for route changes (Next.js specific)
    const handleRouteChange = () => updatePage()

    // For Next.js navigation
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleRouteChange)
      }
    }
  }, [isConnected])

  return {
    isConnected,
    onlineAdmins,
    onlineCount,
    error,
  }
}

/**
 * Hook to cleanup presence on logout
 */
export function usePresenceCleanup() {
  const cleanup = async () => {
    await presenceManager.cleanup()
  }

  return { cleanup }
}