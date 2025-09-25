import React, { useMemo } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface BarDefinition {
  dataKey: string
  fill: string
  name: string
  stackId?: string
  radius?: number
}

export interface BarChartProps {
  data: any[]
  xDataKey: string
  bars: BarDefinition[]
  width?: number
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  stacked?: boolean
  horizontal?: boolean
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

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xDataKey,
  bars,
  width,
  height = 400,
  showLegend = false,
  showGrid = true,
  stacked = false,
  horizontal = false,
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

  if (bars.length === 0) {
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
          data-testid="bar-chart"
          role="img"
          aria-label="Bar chart with no data available"
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

  const barNames = bars.map(bar => bar.name).join(', ')
  const ChartComponent = RechartsBarChart

  const chartProps = {
    'data-testid': 'bar-chart',
    'role': 'img' as const,
    'aria-label': `Bar chart showing ${barNames}`,
    'tabIndex': 0,
    'data-animated': animated ? 'true' : 'false',
    'data-compact': compact ? 'true' : 'false',
    'data-mobile': mobile ? 'true' : 'false',
    'data-horizontal': horizontal ? 'true' : 'false',
    'data-stacked': stacked ? 'true' : 'false',
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={processedData}
          onClick={handleChartClick}
          layout={horizontal ? 'horizontal' : 'vertical'}
          {...chartProps}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" data-testid="cartesian-grid" />}
          {horizontal ? (
            <>
              <XAxis type="number" data-testid="x-axis" />
              <YAxis type="category" dataKey={xDataKey} data-testid="y-axis" data-key={xDataKey} />
            </>
          ) : (
            <>
              <XAxis dataKey={xDataKey} data-testid="x-axis" data-key={xDataKey} />
              <YAxis data-testid="y-axis" />
            </>
          )}
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            data-testid="tooltip"
          />
          {showLegend && <Legend data-testid="legend" />}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              stackId={stacked ? bar.stackId || 'stack' : undefined}
              radius={bar.radius || 0}
              data-testid={`bar-${bar.dataKey}`}
              data-fill={bar.fill}
              animationBegin={animated ? 0 : undefined}
              animationDuration={animated ? 1500 : 0}
            />
          ))}
        </ChartComponent>
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
                {bars.map((bar) => (
                  <th
                    key={bar.dataKey}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left"
                  >
                    {bar.name}
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
                  {bars.map((bar) => (
                    <td
                      key={bar.dataKey}
                      className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                    >
                      {item[bar.dataKey]}
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