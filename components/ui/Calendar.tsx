'use client'

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  isAfter
} from 'date-fns'

export interface CalendarProps {
  selected?: Date | Date[]
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
  mode?: 'single' | 'range'
  minDate?: Date
  maxDate?: Date
  className?: string
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  disabled,
  mode = 'single',
  minDate,
  maxDate,
  className = '',
  weekStartsOn = 0
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (selected && !Array.isArray(selected)) {
      return selected
    }
    if (Array.isArray(selected) && selected[0]) {
      return selected[0]
    }
    return new Date()
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart, { weekStartsOn })
  const endDate = endOfWeek(monthEnd, { weekStartsOn })

  const dateFormat = 'MMMM yyyy'
  const days = useMemo(() => {
    const dateArray = []
    let day = startDate

    while (day <= endDate) {
      dateArray.push(day)
      day = addDays(day, 1)
    }

    return dateArray
  }, [startDate, endDate])

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const isDateDisabled = (date: Date): boolean => {
    if (disabled && disabled(date)) return true
    if (minDate && isBefore(date, minDate)) return true
    if (maxDate && isAfter(date, maxDate)) return true
    return false
  }

  const isDateSelected = (date: Date): boolean => {
    if (!selected) return false
    if (Array.isArray(selected)) {
      return selected.some(selectedDate => isSameDay(date, selectedDate))
    }
    return isSameDay(date, selected)
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date) || !onSelect) return
    onSelect(date)
  }

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const adjustedWeekDays = [
    ...weekDays.slice(weekStartsOn),
    ...weekDays.slice(0, weekStartsOn)
  ]

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, dateFormat)}
        </h2>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {adjustedWeekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)
          const isSelected = isDateSelected(day)
          const isDisabled = isDateDisabled(day)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={`
                p-2 text-sm rounded-md transition-colors
                ${isCurrentMonth
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
                }
                ${isTodayDate && !isSelected
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                  : ''
                }
                ${isSelected
                  ? 'bg-blue-600 text-white font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                ${isDisabled
                  ? 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent'
                  : 'cursor-pointer'
                }
              `}
              aria-label={format(day, 'MMMM d, yyyy')}
              aria-selected={isSelected}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}