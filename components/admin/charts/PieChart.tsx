import React, { useMemo } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface PieChartProps {
  data: any[]
  dataKey: string
  nameKey: string
  colors?: string[]
  width?: number
  height?: number
  showLegend?: boolean
  showLabels?: boolean
  innerRadius?: number
  outerRadius?: number
  tooltipFormatter?: (value: any, name?: string, props?: any) => [React.ReactNode, string]
  onDataPointClick?: (data: any, index: number) => void
  isLoading?: boolean
  animated?: boolean
  compact?: boolean
  mobile?: boolean
  showDataTable?: boolean
  showPercentages?: boolean
  className?: string
}

const DEFAULT_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
  '#ffb347',
  '#87d4a3',
  '#ffa07a',
  '#98fb98',
  '#dda0dd',
  '#f0e68c'
]

export const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
  width,
  height = 400,
  showLegend = true,
  showLabels = true,
  innerRadius = 0,
  outerRadius,
  tooltipFormatter,
  onDataPointClick,
  isLoading = false,
  animated = false,
  compact = false,
  mobile = false,
  showDataTable = false,
  showPercentages = true,
  className = '',
}) => {
  // Error handling
  if (!data) {
    return (
      <div
        className={`flex items-center justify-center h-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}
        data-testid="chart-error"
      >
        <p className="text-red-500 dark:text-red-400">Unable to load chart data</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
        <div
          className="flex items-center justify-center h-64"
          data-testid="pie-chart"
          role="img"
          aria-label="Pie chart with no data available"
          tabIndex={0}
        >
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse ${className}`}
        data-testid="chart-skeleton"
        aria-label="Loading chart data"
      >
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="flex items-center justify-center">
            <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate total for percentages
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + (item[dataKey] || 0), 0)
  }, [data, dataKey])

  // Memoize processed data with percentages
  const processedData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      index,
      percentage: total > 0 ? ((item[dataKey] / total) * 100).toFixed(1) : '0',
    }))
  }, [data, dataKey, total])

  const handleChartClick = (data: any) => {
    if (onDataPointClick && data) {
      const payload = data.payload || data
      onDataPointClick(payload, payload.index)
    }
  }

  // Custom label formatter
  const renderCustomizedLabel = (entry: any) => {
    if (!showLabels) return null

    if (showPercentages) {
      return `${entry.percentage}%`
    }

    return entry[nameKey]
  }

  const chartProps = {
    'data-testid': 'pie-chart',
    'role': 'img' as const,
    'aria-label': `Pie chart showing distribution of ${nameKey}`,
    'tabIndex': 0,
    'data-animated': animated ? 'true' : 'false',
    'data-compact': compact ? 'true' : 'false',
    'data-mobile': mobile ? 'true' : 'false',
  }

  const effectiveOuterRadius = outerRadius || (mobile ? 60 : compact ? 80 : 120)
  const effectiveInnerRadius = innerRadius

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart {...chartProps}>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderCustomizedLabel : false}
            outerRadius={effectiveOuterRadius}
            innerRadius={effectiveInnerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            onClick={handleChartClick}
            data-testid="pie-segment"
            animationBegin={animated ? 0 : undefined}
            animationDuration={animated ? 1500 : 0}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                data-testid={`pie-cell-${index}`}
                data-fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={tooltipFormatter || ((value: any, name: any) => [value, String(name)])}
            data-testid="tooltip"
          />
          {showLegend && (
            <Legend
              data-testid="legend"
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value} {showPercentages && entry.payload ? `(${(entry.payload as any).percentage}%)` : ''}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>

      {showDataTable && (
        <div className="mt-4">
          <table
            className="w-full text-sm border-collapse"
            role="table"
            aria-label="Chart data in tabular format"
            data-testid="data-table"
          >
            <thead>
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">
                  {nameKey}
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">
                  {dataKey}
                </th>
                {showPercentages && (
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">
                    Percentage
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {processedData.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      {item[nameKey]}
                    </div>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                    {item[dataKey]}
                  </td>
                  {showPercentages && (
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                      {item.percentage}%
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}