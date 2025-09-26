import { getSupabase } from '../supabase/client'

export interface SessionData {
  userId: string
  sessionStart: Date
  lastActivity: Date
  duration: number // in seconds
  isActive: boolean
}

/**
 * Calculate session duration from presence data
 */
export async function calculateSessionDuration(
  userId: string,
  sessionStart: Date
): Promise<number> {
  const now = new Date()
  const durationMs = now.getTime() - sessionStart.getTime()
  return Math.floor(durationMs / 1000)
}

/**
 * Get active sessions with duration
 */
export async function getActiveSessions(): Promise<SessionData[]> {
  try {
    const { data, error } = await getSupabase()
      .from('user_presence')
      .select('*')
      .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 minutes

    if (error) {
      console.error('Error fetching active sessions:', error)
      return []
    }

    if (!data) {
      return []
    }

    return data.map(presence => ({
      userId: presence.user_id,
      sessionStart: new Date(presence.session_start),
      lastActivity: new Date(presence.last_seen_at),
      duration: presence.session_duration_seconds || 0,
      isActive: new Date(presence.last_seen_at) > new Date(Date.now() - 60000), // Active in last minute
    }))
  } catch (error) {
    console.error('Error in getActiveSessions:', error)
    return []
  }
}

/**
 * Get average session duration for a time period
 */
export async function getAverageSessionDuration(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const { data, error } = await getSupabase()
      .from('admin_sessions')
      .select('duration_seconds')
      .not('duration_seconds', 'is', null)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())

    if (error) {
      console.error('Error fetching session durations:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    const totalDuration = data.reduce(
      (sum, session) => sum + (session.duration_seconds || 0),
      0
    )

    return Math.round(totalDuration / data.length)
  } catch (error) {
    console.error('Error in getAverageSessionDuration:', error)
    return 0
  }
}

/**
 * Get session statistics
 */
export async function getSessionStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalSessions: number
  averageDuration: number
  medianDuration: number
  shortestSession: number
  longestSession: number
  activeNow: number
}> {
  try {
    // Get all sessions in the period
    const { data: sessions, error } = await getSupabase()
      .from('admin_sessions')
      .select('duration_seconds')
      .not('duration_seconds', 'is', null)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())

    if (error) {
      console.error('Error fetching session statistics:', error)
      return {
        totalSessions: 0,
        averageDuration: 0,
        medianDuration: 0,
        shortestSession: 0,
        longestSession: 0,
        activeNow: 0,
      }
    }

    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        averageDuration: 0,
        medianDuration: 0,
        shortestSession: 0,
        longestSession: 0,
        activeNow: 0,
      }
    }

    const durations = sessions
      .map(s => s.duration_seconds)
      .filter(d => d !== null && d !== undefined)
      .sort((a, b) => a - b)

    // Calculate statistics
    const totalSessions = durations.length
    const averageDuration = Math.round(
      durations.reduce((sum, d) => sum + d, 0) / totalSessions
    )
    const medianDuration = durations[Math.floor(totalSessions / 2)]
    const shortestSession = durations[0]
    const longestSession = durations[durations.length - 1]

    // Get currently active sessions
    const { count: activeNow } = await getSupabase()
      .from('user_presence')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    return {
      totalSessions,
      averageDuration,
      medianDuration,
      shortestSession,
      longestSession,
      activeNow: activeNow || 0,
    }
  } catch (error) {
    console.error('Error in getSessionStatistics:', error)
    return {
      totalSessions: 0,
      averageDuration: 0,
      medianDuration: 0,
      shortestSession: 0,
      longestSession: 0,
      activeNow: 0,
    }
  }
}

/**
 * Track idle time and auto-logout
 */
export class IdleTracker {
  private idleTime = 0
  private maxIdleTime = 30 * 60 * 1000 // 30 minutes in milliseconds
  private idleTimer: NodeJS.Timeout | null = null
  private lastActivity = new Date()
  private onIdleCallback?: () => void

  constructor(maxIdleMinutes = 30, onIdle?: () => void) {
    this.maxIdleTime = maxIdleMinutes * 60 * 1000
    this.onIdleCallback = onIdle
  }

  start() {
    this.resetTimer()

    // Track user activity
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      events.forEach(event => {
        document.addEventListener(event, () => this.resetTimer(), true)
      })
    }

    // Check for idle every minute
    this.idleTimer = setInterval(() => {
      this.checkIdle()
    }, 60000)
  }

  private resetTimer() {
    this.idleTime = 0
    this.lastActivity = new Date()
  }

  private checkIdle() {
    const now = new Date()
    const timeSinceActivity = now.getTime() - this.lastActivity.getTime()

    if (timeSinceActivity >= this.maxIdleTime) {
      this.handleIdle()
    }
  }

  private handleIdle() {
    if (this.onIdleCallback) {
      this.onIdleCallback()
    }
    this.stop()
  }

  stop() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer)
      this.idleTimer = null
    }
  }

  getIdleTime(): number {
    return Date.now() - this.lastActivity.getTime()
  }

  isIdle(): boolean {
    return this.getIdleTime() >= this.maxIdleTime
  }
}