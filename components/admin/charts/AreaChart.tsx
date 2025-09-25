import React, { useMemo } from 'react'
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface AreaDefinition {
  dataKey: string
  stroke: string
  fill: string
  name: string
  strokeWidth?: number
  fillOpacity?: number
  stackId?: string
}

export interface AreaChartProps {
  data: any[]
  xDataKey: string
  areas: AreaDefinition[]
  width?: number
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  stacked?: boolean
  curved?: boolean
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

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xDataKey,
  areas,
  width,
  height = 400,
  showLegend = false,
  showGrid = true,
  stacked = false,
  curved = true,
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

  if (areas.length === 0) {
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
          data-testid="area-chart"
          role="img"
          aria-label="Area chart with no data available"
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

  const areaNames = areas.map(area => area.name).join(', ')

  const chartProps = {
    'data-testid': 'area-chart',
    'role': 'img' as const,
    'aria-label': `Area chart showing ${areaNames} over time`,
    'tabIndex': 0,
    'data-animated': animated ? 'true' : 'false',
    'data-compact': compact ? 'true' : 'false',
    'data-mobile': mobile ? 'true' : 'false',
    'data-stacked': stacked ? 'true' : 'false',
    'data-curved': curved ? 'true' : 'false',
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={processedData}
          onClick={handleChartClick}
          {...chartProps}
        >
          <defs>
            {areas.map((area, index) => (
              <linearGradient key={area.dataKey} id={`gradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.stroke} stopOpacity={area.fillOpacity || 0.8} />
                <stop offset="95%" stopColor={area.stroke} stopOpacity={area.fillOpacity || 0.1} />
              </linearGradient>
            ))}
          </defs>

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

          {areas.map((area) => (
            <Area
              key={area.dataKey}
              type={curved ? "monotone" : "linear"}
              dataKey={area.dataKey}
              stackId={stacked ? area.stackId || 'stack' : undefined}
              stroke={area.stroke}
              fill={area.fill || `url(#gradient-${area.dataKey})`}
              strokeWidth={area.strokeWidth || 2}
              fillOpacity={area.fillOpacity || 0.6}
              name={area.name}
              data-testid={`area-${area.dataKey}`}
              data-stroke={area.stroke}
              data-fill={area.fill}
              animationBegin={animated ? 0 : undefined}
              animationDuration={animated ? 1500 : 0}
            />
          ))}
        </RechartsAreaChart>
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
                {areas.map((area) => (
                  <th
                    key={area.dataKey}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left"
                  >
                    {area.name}
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
                  {areas.map((area) => (
                    <td
                      key={area.dataKey}
                      className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                    >
                      {item[area.dataKey]}
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