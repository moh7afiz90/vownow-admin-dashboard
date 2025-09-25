import React, { useMemo } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface LineDefinition {
  dataKey: string
  stroke: string
  name: string
  strokeWidth?: number
  strokeDasharray?: string
}

export interface LineChartProps {
  data: any[]
  xDataKey: string
  lines: LineDefinition[]
  width?: number
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  tooltipFormatter?: (value: any, name?: string, props?: any) => [React.ReactNode, string]
  tooltipLabelFormatter?: (label: string) => React.ReactNode
  onDataPointClick?: (data: any, index: number) => void
  isLoading?: boolean
  animated?: boolean
  compact?: boolean
  mobile?: boolean
  showDataTable?: boolean
  className?: string
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xDataKey,
  lines,
  width,
  height = 400,
  showLegend = false,
  showGrid = true,
  tooltipFormatter,
  tooltipLabelFormatter,
  onDataPointClick,
  isLoading = false,
  animated = false,
  compact = false,
  mobile = false,
  showDataTable = false,
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

  if (lines.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}
        data-testid="chart-error"
      >
        <p className="text-red-500 dark:text-red-400">Chart configuration error</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
        <div
          className="flex items-center justify-center h-64"
          data-testid="line-chart"
          role="img"
          aria-label="Line chart showing Revenue, Users over time"
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
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Memoize processed data for performance
  const processedData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      index,
    }))
  }, [data])

  const handleChartClick = (data: any) => {
    if (onDataPointClick && data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0].payload
      onDataPointClick(payload, payload.index)
    }
  }

  const lineNames = lines.map(line => line.name).join(', ')

  const chartProps = {
    'data-testid': 'line-chart',
    'role': 'img' as const,
    'aria-label': `Line chart showing ${lineNames} over time`,
    'tabIndex': 0,
    'data-animated': animated ? 'true' : 'false',
    'data-compact': compact ? 'true' : 'false',
    'data-mobile': mobile ? 'true' : 'false',
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={processedData}
          onClick={handleChartClick}
          {...chartProps}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" data-testid="cartesian-grid" />}
          <XAxis
            dataKey={xDataKey}
            data-testid="x-axis"
            data-key={xDataKey}
          />
          <YAxis data-testid="y-axis" />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            data-testid="tooltip"
          />
          {showLegend && <Legend data-testid="legend" />}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth || 2}
              strokeDasharray={line.strokeDasharray}
              name={line.name}
              data-testid={`line-${line.dataKey}`}
              data-stroke={line.stroke}
              animationBegin={animated ? 0 : undefined}
              animationDuration={animated ? 1500 : 0}
            />
          ))}
        </RechartsLineChart>
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
                  {xDataKey}
                </th>
                {lines.map((line) => (
                  <th
                    key={line.dataKey}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left"
                  >
                    {line.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                    {item[xDataKey]}
                  </td>
                  {lines.map((line) => (
                    <td
                      key={line.dataKey}
                      className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                    >
                      {item[line.dataKey]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}