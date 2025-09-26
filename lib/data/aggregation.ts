import { getSupabase } from '../supabase/client'

/**
 * Aggregate data by time period
 */
export type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'year'

export interface AggregationResult {
  period: string
  count: number
  sum?: number
  avg?: number
  min?: number
  max?: number
}

/**
 * Aggregate data by time period
 */
export async function aggregateByTimePeriod(
  table: string,
  dateField: string,
  period: TimePeriod,
  startDate: Date,
  endDate: Date,
  valueField?: string
): Promise<AggregationResult[]> {
  try {
    const query = getSupabase()
      .from(table)
      .select(`${dateField}${valueField ? `, ${valueField}` : ''}`)
      .gte(dateField, startDate.toISOString())
      .lte(dateField, endDate.toISOString())
      .order(dateField)

    const { data, error } = await query

    if (error) {
      console.error('Error aggregating data:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const aggregated = new Map<string, AggregationResult>()

    data.forEach(record => {
      const date = new Date(record[dateField])
      const periodKey = getPeriodKey(date, period)

      if (!aggregated.has(periodKey)) {
        aggregated.set(periodKey, {
          period: periodKey,
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
        })
      }

      const agg = aggregated.get(periodKey)!
      agg.count++

      if (valueField && record[valueField] !== null) {
        const value = Number(record[valueField])
        agg.sum! += value
        agg.min = Math.min(agg.min!, value)
        agg.max = Math.max(agg.max!, value)
      }
    })

    // Calculate averages
    const results = Array.from(aggregated.values()).map(agg => {
      if (valueField && agg.sum !== undefined && agg.count > 0) {
        agg.avg = agg.sum / agg.count
      }
      if (agg.min === Infinity) agg.min = undefined
      if (agg.max === -Infinity) agg.max = undefined
      return agg
    })

    return results
  } catch (error) {
    console.error('Error in aggregateByTimePeriod:', error)
    return []
  }
}

/**
 * Get period key for grouping
 */
function getPeriodKey(date: Date, period: TimePeriod): string {
  switch (period) {
    case 'hour':
      return `${date.toISOString().slice(0, 13)}:00`
    case 'day':
      return date.toISOString().slice(0, 10)
    case 'week':
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      return `Week of ${weekStart.toISOString().slice(0, 10)}`
    case 'month':
      return date.toISOString().slice(0, 7)
    case 'year':
      return date.toISOString().slice(0, 4)
    default:
      return date.toISOString().slice(0, 10)
  }
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number
): number[] {
  if (data.length < windowSize) {
    return data
  }

  const result: number[] = []
  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize)
    const avg = window.reduce((sum, val) => sum + val, 0) / windowSize
    result.push(avg)
  }

  return result
}

/**
 * Calculate percentile
 */
export function calculatePercentile(
  data: number[],
  percentile: number
): number {
  if (data.length === 0) return 0

  const sorted = [...data].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Group data by field
 */
export async function groupByField<T extends Record<string, any>>(
  table: string,
  groupField: string,
  aggregations: {
    field: string
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max'
  }[],
  filters?: {
    field: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
    value: any
  }[]
): Promise<Record<string, any>[]> {
  try {
    let query = getSupabase().from(table).select('*')

    // Apply filters
    if (filters) {
      filters.forEach(filter => {
        query = query[filter.operator](filter.field, filter.value)
      })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error grouping data:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by field
    const grouped = new Map<string, any[]>()
    data.forEach(record => {
      const key = record[groupField]
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(record)
    })

    // Calculate aggregations
    const results: Record<string, any>[] = []
    grouped.forEach((records, key) => {
      const result: Record<string, any> = { [groupField]: key }

      aggregations.forEach(agg => {
        const values = records
          .map(r => r[agg.field])
          .filter(v => v !== null && v !== undefined)
          .map(v => Number(v))

        switch (agg.operation) {
          case 'count':
            result[`${agg.field}_count`] = values.length
            break
          case 'sum':
            result[`${agg.field}_sum`] = values.reduce((a, b) => a + b, 0)
            break
          case 'avg':
            result[`${agg.field}_avg`] = values.length > 0
              ? values.reduce((a, b) => a + b, 0) / values.length
              : 0
            break
          case 'min':
            result[`${agg.field}_min`] = values.length > 0
              ? Math.min(...values)
              : null
            break
          case 'max':
            result[`${agg.field}_max`] = values.length > 0
              ? Math.max(...values)
              : null
            break
        }
      })

      results.push(result)
    })

    return results
  } catch (error) {
    console.error('Error in groupByField:', error)
    return []
  }
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 10000) / 100
}

/**
 * Calculate cumulative sum
 */
export function calculateCumulativeSum(data: number[]): number[] {
  const result: number[] = []
  let sum = 0

  for (const value of data) {
    sum += value
    result.push(sum)
  }

  return result
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(data: number[]): {
  outliers: number[]
  lowerBound: number
  upperBound: number
} {
  if (data.length < 4) {
    return { outliers: [], lowerBound: 0, upperBound: 0 }
  }

  const sorted = [...data].sort((a, b) => a - b)
  const q1 = calculatePercentile(sorted, 25)
  const q3 = calculatePercentile(sorted, 75)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const outliers = data.filter(value => value < lowerBound || value > upperBound)

  return { outliers, lowerBound, upperBound }
}

/**
 * Fill missing data points
 */
export function fillMissingDataPoints<T extends { date: string; value: number }>(
  data: T[],
  startDate: Date,
  endDate: Date,
  fillValue: number = 0
): T[] {
  const filled: T[] = []
  const dataMap = new Map(data.map(d => [d.date, d]))

  const current = new Date(startDate)
  while (current <= endDate) {
    const dateKey = current.toISOString().slice(0, 10)
    if (dataMap.has(dateKey)) {
      filled.push(dataMap.get(dateKey)!)
    } else {
      filled.push({ date: dateKey, value: fillValue } as T)
    }
    current.setDate(current.getDate() + 1)
  }

  return filled
}