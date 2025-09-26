import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { getSupabase } from '../supabase/client'

export interface PresenceData {
  user_id: string
  email: string
  role: string
  online_at: string
  session_start: string
  current_page?: string
  metadata?: Record<string, any>
}

export interface PresenceState {
  [key: string]: PresenceData[]
}

class AdminPresenceManager {
  private channel: RealtimeChannel | null = null
  private presenceState: PresenceState = {}
  private userId: string | null = null
  private sessionStart: Date = new Date()
  private heartbeatInterval: NodeJS.Timeout | null = null

  /**
   * Initialize presence tracking for an admin user
   */
  async initialize(userId: string, userEmail: string, userRole: string) {
    try {
      this.userId = userId
      this.sessionStart = new Date()

      // Create or join the admin presence channel
      this.channel = getSupabase().channel('admin-presence', {
        config: {
          presence: {
            key: userId,
          },
        },
      })

      // Set up presence sync handler
      this.channel.on('presence', { event: 'sync' }, () => {
        this.presenceState = this.channel!.presenceState() as PresenceState
        this.onPresenceSync()
      })

      // Subscribe to the channel
      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this admin's presence
          await this.trackPresence({
            user_id: userId,
            email: userEmail,
            role: userRole,
            online_at: new Date().toISOString(),
            session_start: this.sessionStart.toISOString(),
            current_page: window.location.pathname,
          })

          // Start heartbeat
          this.startHeartbeat()

          // Log session start
          await this.logSessionStart()
        }
      })

      // Track page changes
      if (typeof window !== 'undefined') {
        window.addEventListener('popstate', this.handlePageChange)
      }

      return true
    } catch (error) {
      console.error('Error initializing presence:', error)
      return false
    }
  }

  /**
   * Track presence data
   */
  private async trackPresence(data: PresenceData) {
    if (!this.channel) return

    try {
      await this.channel.track(data)
    } catch (error) {
      console.error('Error tracking presence:', error)
    }
  }

  /**
   * Update current page in presence data
   */
  async updateCurrentPage(page: string) {
    if (!this.channel || !this.userId) return

    const currentPresence = this.presenceState[this.userId]?.[0]
    if (currentPresence) {
      await this.trackPresence({
        ...currentPresence,
        current_page: page,
      })
    }
  }

  /**
   * Handle page changes
   */
  private handlePageChange = () => {
    if (typeof window !== 'undefined') {
      this.updateCurrentPage(window.location.pathname)
    }
  }

  /**
   * Start heartbeat to keep presence alive
   */
  private startHeartbeat() {
    // Clear any existing heartbeat
    this.stopHeartbeat()

    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat()
    }, 30000)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Send heartbeat to update last_seen
   */
  private async sendHeartbeat() {
    if (!this.userId) return

    try {
      await getSupabase()
        .from('user_presence')
        .upsert({
          user_id: this.userId,
          last_seen_at: new Date().toISOString(),
          session_duration_seconds: Math.floor(
            (new Date().getTime() - this.sessionStart.getTime()) / 1000
          ),
        })
    } catch (error) {
      console.error('Error sending heartbeat:', error)
    }
  }

  /**
   * Handle presence sync
   */
  private onPresenceSync() {
    // Emit custom event with online admin count
    const onlineAdmins = Object.keys(this.presenceState).length
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('admin-presence-update', {
          detail: { onlineAdmins, presenceState: this.presenceState },
        })
      )
    }
  }

  /**
   * Log session start
   */
  private async logSessionStart() {
    if (!this.userId) return

    try {
      await getSupabase().from('admin_sessions').insert({
        admin_id: this.userId,
        started_at: this.sessionStart.toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      })

      // Also create initial presence record
      await getSupabase().from('user_presence').upsert({
        user_id: this.userId,
        online_at: this.sessionStart.toISOString(),
        last_seen_at: new Date().toISOString(),
        session_start: this.sessionStart.toISOString(),
        session_duration_seconds: 0,
        page_path: window.location.pathname,
        metadata: {
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
    } catch (error) {
      console.error('Error logging session start:', error)
    }
  }

  /**
   * Log session end
   */
  private async logSessionEnd() {
    if (!this.userId) return

    try {
      const duration = Math.floor(
        (new Date().getTime() - this.sessionStart.getTime()) / 1000
      )

      // Update session record
      await getSupabase()
        .from('admin_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          last_activity_at: new Date().toISOString(),
        })
        .eq('admin_id', this.userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)

      // Update presence record
      await getSupabase()
        .from('user_presence')
        .update({
          last_seen_at: new Date().toISOString(),
          session_duration_seconds: duration,
        })
        .eq('user_id', this.userId)
    } catch (error) {
      console.error('Error logging session end:', error)
    }
  }

  /**
   * Get client IP (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  /**
   * Get online admins
   */
  getOnlineAdmins(): PresenceData[] {
    const admins: PresenceData[] = []
    Object.values(this.presenceState).forEach((presenceList) => {
      admins.push(...presenceList)
    })
    return admins
  }

  /**
   * Get online admin count
   */
  getOnlineAdminCount(): number {
    return Object.keys(this.presenceState).length
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup() {
    try {
      // Stop heartbeat
      this.stopHeartbeat()

      // Log session end
      await this.logSessionEnd()

      // Remove event listeners
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', this.handlePageChange)
      }

      // Untrack and unsubscribe
      if (this.channel) {
        await this.channel.untrack()
        await this.channel.unsubscribe()
        this.channel = null
      }

      // Clear state
      this.presenceState = {}
      this.userId = null
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }
}

// Export singleton instance
export const presenceManager = new AdminPresenceManager()

// Auto cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    presenceManager.cleanup()
  })
}