import React, { useState, useRef, useCallback, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, isWithinInterval, min, max
} from 'date-fns'
import type { CalendarEvent } from '../../lib/types'
import { TEAM_COLORS } from '../../lib/types'
import './CalendarMonth.css'

interface CalendarMonthProps {
  currentDate: Date
  events: CalendarEvent[]
  visibleTeams: Set<string>
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onDragSelect?: (start: Date, end: Date) => void
}

function getEventStyle(event: CalendarEvent): React.CSSProperties {
  const color = event.isMMA ? '#C9A84C' : TEAM_COLORS[event.team]
  if (event.isMMA) {
    return { background: 'rgba(201, 168, 76, 0.25)', borderLeft: `3px solid #C9A84C`, color: '#C9A84C' }
  }
  return { background: `${color}18`, borderLeft: `3px solid ${color}`, color }
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_EVENTS_PER_DAY = 3

export default function CalendarMonth({
  currentDate,
  events,
  visibleTeams,
  onDateClick,
  onEventClick,
  onDragSelect,
}: CalendarMonthProps) {
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStarted = useRef(false)
  const dragMoved = useRef(false)

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const start = startOfWeek(monthStart, { weekStartsOn: 1 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const filteredEvents = useMemo(
    () => events.filter((e) => visibleTeams.has(e.team)),
    [events, visibleTeams]
  )

  function getEventsForDay(day: Date) {
    return filteredEvents.filter(
      (e) => isSameDay(e.start, day) || (e.allDay && e.start <= day && e.end >= day)
    )
  }

  function isDayInDragRange(day: Date): boolean {
    if (!dragStart || !dragEnd || !isDragging) return false
    const rangeStart = min([dragStart, dragEnd])
    const rangeEnd = max([dragStart, dragEnd])
    return isWithinInterval(day, { start: rangeStart, end: rangeEnd })
  }

  function isDragStartDay(day: Date): boolean {
    return isDragging && !!dragStart && isSameDay(day, dragStart)
  }

  function isDragEndDay(day: Date): boolean {
    return isDragging && !!dragEnd && isSameDay(day, dragEnd)
  }

  const handleMouseDown = useCallback((day: Date, e: React.MouseEvent) => {
    e.preventDefault()
    dragStarted.current = true
    dragMoved.current = false
    setDragStart(day)
    setDragEnd(day)
    setIsDragging(false)
  }, [])

  const handleMouseEnter = useCallback((day: Date) => {
    if (!dragStarted.current) return
    dragMoved.current = true
    setIsDragging(true)
    setDragEnd(day)
  }, [])

  const handleMouseUp = useCallback((day: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!dragStarted.current) return
    dragStarted.current = false

    if (!dragMoved.current || !dragStart) {
      // Single click — just open modal for this day
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      onDateClick(day)
      return
    }

    // Drag finished — open modal with range
    const start = min([dragStart, day])
    const end = max([dragStart, day])
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)

    if (onDragSelect) {
      onDragSelect(start, end)
    } else {
      onDateClick(start)
    }
  }, [dragStart, onDateClick, onDragSelect])

  // Cancel drag if mouse leaves grid
  const handleGridMouseLeave = useCallback(() => {
    if (dragStarted.current && !dragMoved.current) {
      dragStarted.current = false
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
    }
  }, [])

  // Global mouseup to cancel drag if released outside
  const handleGlobalMouseUp = useCallback(() => {
    if (!dragStarted.current) return
    if (dragMoved.current && dragStart && dragEnd && onDragSelect) {
      const start = min([dragStart, dragEnd])
      const end = max([dragStart, dragEnd])
      onDragSelect(start, end)
    }
    dragStarted.current = false
    dragMoved.current = false
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [dragStart, dragEnd, onDragSelect])

  return (
    <div className="calendar-month" onMouseLeave={handleGridMouseLeave} onMouseUp={handleGlobalMouseUp}>
      {/* Day names header */}
      <div className="calendar-month-header">
        {DAY_NAMES.map((name) => (
          <div key={name} className="calendar-day-name">{name}</div>
        ))}
      </div>

      {/* Drag hint */}
      {!isDragging && (
        <div className="drag-hint">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
          Click a day or drag across days to create an event
        </div>
      )}

      {/* Grid */}
      <div className="calendar-month-grid">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDay = isToday(day)
          const overflow = dayEvents.length - MAX_EVENTS_PER_DAY
          const inRange = isDayInDragRange(day)
          const isStart = isDragStartDay(day)
          const isEnd = isDragEndDay(day)

          return (
            <div
              key={day.toISOString()}
              className={[
                'calendar-day-cell',
                !isCurrentMonth ? 'calendar-day-cell--other-month' : '',
                isTodayDay ? 'calendar-day-cell--today' : '',
                inRange ? 'calendar-day-cell--in-range' : '',
                isStart ? 'calendar-day-cell--drag-start' : '',
                isEnd ? 'calendar-day-cell--drag-end' : '',
                isDragging ? 'calendar-day-cell--dragging' : '',
              ].join(' ')}
              onMouseDown={(e) => handleMouseDown(day, e)}
              onMouseEnter={() => handleMouseEnter(day)}
              onMouseUp={(e) => handleMouseUp(day, e)}
              id={`day-${format(day, 'yyyy-MM-dd')}`}
            >
              <div className="calendar-day-number">
                <span className={isTodayDay ? 'today-badge' : ''}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="calendar-day-events">
                {dayEvents.slice(0, MAX_EVENTS_PER_DAY).map((event) => (
                  <button
                    key={event.id}
                    className={`calendar-event-pill ${event.isMMA ? 'calendar-event-pill--mma' : ''} ${event.team === 'direction' && !event.isMMA ? 'calendar-event-pill--direction' : ''}`}
                    style={getEventStyle(event)}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                    onMouseDown={(e) => e.stopPropagation()}
                    id={`event-${event.id}`}
                    title={event.title}
                  >
                    {event.isMMA && <span className="event-mma-star">⭐</span>}
                    <span className="event-pill-title">{event.title}</span>
                    {!event.allDay && (
                      <span className="event-pill-time">{format(event.start, 'HH:mm')}</span>
                    )}
                  </button>
                ))}

                {overflow > 0 && (
                  <button
                    className="calendar-event-more"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDateClick(day) }}
                  >
                    +{overflow} more
                  </button>
                )}
              </div>

              {/* Drag range indicator */}
              {inRange && <div className="drag-range-overlay" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
