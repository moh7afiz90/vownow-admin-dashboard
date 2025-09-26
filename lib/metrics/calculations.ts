import { getSupabase } from '../supabase/client'

/**
 * Calculate average session duration from user presence data
 */
export async function calculateAverageSessionDuration(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const query = getSupabase()
      .from('user_presence')
      .select('session_duration_seconds')
      .not('session_duration_seconds', 'is', null)

    if (startDate) {
      query.gte('online_at', startDate.toISOString())
    }
    if (endDate) {
      query.lte('last_seen_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error calculating average session duration:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    const totalDuration = data.reduce(
      (sum, session) => sum + (session.session_duration_seconds || 0),
      0
    )

    return Math.round(totalDuration / data.length)
  } catch (error) {
    console.error('Error in calculateAverageSessionDuration:', error)
    return 0
  }
}

/**
 * Calculate user retention rate based on activity
 */
export async function calculateRetentionRate(
  cohortStartDate: Date,
  measurementDate: Date
): Promise<number> {
  try {
    // Get users who joined in the cohort period
    const cohortEndDate = new Date(cohortStartDate)
    cohortEndDate.setDate(cohortEndDate.getDate() + 7) // Weekly cohort

    const { count: cohortSize } = await getSupabase()
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cohortStartDate.toISOString())
      .lt('created_at', cohortEndDate.toISOString())

    if (!cohortSize || cohortSize === 0) {
      return 0
    }

    // Get users from cohort who were active on measurement date
    const measurementStart = new Date(measurementDate)
    measurementStart.setHours(0, 0, 0, 0)
    const measurementEnd = new Date(measurementDate)
    measurementEnd.setHours(23, 59, 59, 999)

    const { data: cohortUsers } = await getSupabase()
      .from('profiles')
      .select('id')
      .gte('created_at', cohortStartDate.toISOString())
      .lt('created_at', cohortEndDate.toISOString())

    if (!cohortUsers) {
      return 0
    }

    const cohortUserIds = cohortUsers.map(u => u.id)

    const { count: activeUsers } = await getSupabase()
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .in('user_id', cohortUserIds)
      .gte('created_at', measurementStart.toISOString())
      .lte('created_at', measurementEnd.toISOString())

    const retentionRate = ((activeUsers || 0) / cohortSize) * 100
    return Math.round(retentionRate * 10) / 10 // Round to 1 decimal place
  } catch (error) {
    console.error('Error calculating retention rate:', error)
    return 0
  }
}

/**
 * Calculate survey distribution by category from actual data
 */
export async function calculateSurveysByCategory(
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, number>> {
  try {
    const query = getSupabase()
      .from('questionnaire_responses')
      .select('category')

    if (startDate) {
      query.gte('created_at', startDate.toISOString())
    }
    if (endDate) {
      query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error calculating surveys by category:', error)
      return {
        personal: 0,
        professional: 0,
        lifestyle: 0,
        health: 0,
      }
    }

    if (!data) {
      return {
        personal: 0,
        professional: 0,
        lifestyle: 0,
        health: 0,
      }
    }

    // Count by category
    const categoryCount = data.reduce((acc: Record<string, number>, response: any) => {
      const category = response.category || 'other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    // Ensure all expected categories are present
    return {
      personal: categoryCount.personal || 0,
      professional: categoryCount.professional || 0,
      lifestyle: categoryCount.lifestyle || 0,
      health: categoryCount.health || 0,
      ...categoryCount, // Include any other categories
    }
  } catch (error) {
    console.error('Error in calculateSurveysByCategory:', error)
    return {
      personal: 0,
      professional: 0,
      lifestyle: 0,
      health: 0,
    }
  }
}

/**
 * Calculate average completion time from timestamps
 */
export async function calculateAverageCompletionTime(
  type: 'questionnaire' | 'profile' | 'onboarding',
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    let tableName = 'questionnaire_responses'
    let startField = 'started_at'
    let endField = 'completed_at'

    if (type === 'profile') {
      tableName = 'profiles'
      startField = 'created_at'
      endField = 'profile_completed_at'
    } else if (type === 'onboarding') {
      tableName = 'user_onboarding'
      startField = 'started_at'
      endField = 'completed_at'
    }

    const query = getSupabase()
      .from(tableName)
      .select(`${startField}, ${endField}`)
      .not(endField, 'is', null)

    if (startDate) {
      query.gte(startField, startDate.toISOString())
    }
    if (endDate) {
      query.lte(endField, endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error calculating average completion time:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    const totalTime = data.reduce((sum, record) => {
      const start = new Date(record[startField]).getTime()
      const end = new Date(record[endField]).getTime()
      const duration = (end - start) / 1000 // Convert to seconds
      return sum + duration
    }, 0)

    return Math.round(totalTime / data.length)
  } catch (error) {
    console.error('Error in calculateAverageCompletionTime:', error)
    return 0
  }
}

/**
 * Get response distribution for surveys
 */
export async function getSurveyResponseDistribution(
  limit = 10
): Promise<Array<{
  surveyId: string
  title: string
  completions: number
  averageRating: number
}>> {
  try {
    const { data, error } = await getSupabase()
      .from('questionnaire_responses')
      .select(`
        questionnaire_id,
        completed,
        rating,
        questionnaires (
          id,
          title
        )
      `)
      .eq('completed', true)

    if (error) {
      console.error('Error getting survey response distribution:', error)
      return []
    }

    if (!data) {
      return []
    }

    // Group by questionnaire and calculate metrics
    const grouped = data.reduce((acc: Record<string, any>, response: any) => {
      const id = response.questionnaire_id
      if (!acc[id]) {
        acc[id] = {
          surveyId: id,
          title: response.questionnaires?.title || 'Unknown Survey',
          completions: 0,
          totalRating: 0,
          ratingCount: 0,
        }
      }
      acc[id].completions++
      if (response.rating) {
        acc[id].totalRating += response.rating
        acc[id].ratingCount++
      }
      return acc
    }, {})

    // Calculate averages and format
    const distribution = Object.values(grouped)
      .map((survey: any) => ({
        surveyId: survey.surveyId,
        title: survey.title,
        completions: survey.completions,
        averageRating: survey.ratingCount > 0
          ? Math.round((survey.totalRating / survey.ratingCount) * 10) / 10
          : 0,
      }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, limit)

    return distribution
  } catch (error) {
    console.error('Error in getSurveyResponseDistribution:', error)
    return []
  }
}

/**
 * Calculate conversion trend over time
 */
export async function getConversionTrend(
  days = 30
): Promise<Array<{
  date: string
  conversions: number
  conversionRate: number
}>> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const trend: Array<{
      date: string
      conversions: number
      conversionRate: number
    }> = []

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayStart = new Date(dateStr)
      const dayEnd = new Date(dateStr)
      dayEnd.setHours(23, 59, 59, 999)

      // Get visitors for the day
      const { count: visitors } = await getSupabase()
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'landing_page_visit')
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())

      // Get conversions for the day
      const { count: conversions } = await getSupabase()
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())

      const rate = visitors && visitors > 0
        ? Math.round(((conversions || 0) / visitors) * 1000) / 10
        : 0

      trend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        conversions: conversions || 0,
        conversionRate: rate,
      })
    }

    return trend.reverse()
  } catch (error) {
    console.error('Error calculating conversion trend:', error)
    return []
  }
}

/**
 * Calculate segment analysis for new vs returning users
 */
export async function calculateSegmentAnalysis(
  startDate: Date,
  endDate: Date
): Promise<{
  newUsers: {
    entries: number
    completions: number
    conversionRate: number
  }
  returningUsers: {
    entries: number
    completions: number
    conversionRate: number
  }
}> {
  try {
    // Define "new" as users created within the period
    const { count: newUserEntries } = await getSupabase()
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'landing_page_visit')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('user_id',
        getSupabase()
          .from('profiles')
          .select('id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      )

    const { count: newUserCompletions } = await getSupabase()
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('user_id',
        getSupabase()
          .from('profiles')
          .select('id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      )

    // Returning users are those created before the period
    const { count: returningUserEntries } = await getSupabase()
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'landing_page_visit')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('user_id',
        getSupabase()
          .from('profiles')
          .select('id')
          .lt('created_at', startDate.toISOString())
      )

    const { count: returningUserCompletions } = await getSupabase()
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('user_id',
        getSupabase()
          .from('profiles')
          .select('id')
          .lt('created_at', startDate.toISOString())
      )

    const newUsersData = {
      entries: newUserEntries || 0,
      completions: newUserCompletions || 0,
      conversionRate: newUserEntries && newUserEntries > 0
        ? Math.round(((newUserCompletions || 0) / newUserEntries) * 1000) / 10
        : 0,
    }

    const returningUsersData = {
      entries: returningUserEntries || 0,
      completions: returningUserCompletions || 0,
      conversionRate: returningUserEntries && returningUserEntries > 0
        ? Math.round(((returningUserCompletions || 0) / returningUserEntries) * 1000) / 10
        : 0,
    }

    return {
      newUsers: newUsersData,
      returningUsers: returningUsersData,
    }
  } catch (error) {
    console.error('Error calculating segment analysis:', error)
    return {
      newUsers: { entries: 0, completions: 0, conversionRate: 0 },
      returningUsers: { entries: 0, completions: 0, conversionRate: 0 },
    }
  }
}