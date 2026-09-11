import React, { useMemo } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  format, isToday, isSameDay, setHours
} from 'date-fns'
import type { CalendarEvent } from '../../lib/types'
import { TEAM_COLORS } from '../../lib/types'
import './CalendarWeek.css'

interface CalendarWeekProps {
  currentDate: Date
  events: CalendarEvent[]
  visibleTeams: Set<string>
  onSlotClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getEventTop(event: CalendarEvent): number {
  const hours = event.start.getHours() + event.start.getMinutes() / 60
  return hours * 60  // 60px per hour
}

function getEventHeight(event: CalendarEvent): number {
  const durationMs = event.end.getTime() - event.start.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)
  return Math.max(durationHours * 60, 20)  // min 20px
}

export default function CalendarWeek({
  currentDate,
  events,
  visibleTeams,
  onSlotClick,
  onEventClick,
}: CalendarWeekProps) {
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const filteredEvents = events.filter((e) => visibleTeams.has(e.team) && !e.allDay)
  const allDayEvents = events.filter((e) => visibleTeams.has(e.team) && e.allDay)

  function getEventsForDay(day: Date) {
    return filteredEvents.filter((e) => isSameDay(e.start, day))
  }

  function getAllDayEventsForDay(day: Date) {
    return allDayEvents.filter(
      (e) => isSameDay(e.start, day) || (e.start <= day && e.end >= day)
    )
  }

  return (
    <div className="calendar-week">
      {/* Header */}
      <div className="week-header">
        <div className="week-time-gutter" />
        {days.map((day, i) => (
          <div key={day.toISOString()} className="week-day-header">
            <span className="week-day-name">{DAY_NAMES_SHORT[i]}</span>
            <span className={`week-day-number ${isToday(day) ? 'today-badge' : ''}`}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {allDayEvents.length > 0 && (
        <div className="week-allday-row">
          <div className="week-time-gutter week-allday-label">All Day</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="week-allday-cell">
              {getAllDayEventsForDay(day).map((event) => {
                const color = event.isMMA ? '#C9A84C' : TEAM_COLORS[event.team]
                return (
                  <button
                    key={event.id}
                    className="week-allday-event"
                    style={{ background: `${color}25`, borderLeft: `3px solid ${color}`, color }}
                    onClick={() => onEventClick(event)}
                  >
                    {event.isMMA && '⭐ '}{event.title}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="week-body">
        {/* Time gutter */}
        <div className="week-time-gutter-col">
          {HOURS.map((hour) => (
            <div key={hour} className="week-hour-label">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)

          return (
            <div
              key={day.toISOString()}
              className={`week-day-col ${isToday(day) ? 'week-day-col--today' : ''}`}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                const y = e.clientY - rect.top
                const hour = Math.floor(y / 60)
                const clickedDate = setHours(day, Math.max(0, Math.min(23, hour)))
                onSlotClick(clickedDate)
              }}
            >
              {/* Hour lines */}
              {HOURS.map((hour) => (
                <div key={hour} className="week-hour-line" style={{ top: hour * 60 }} />
              ))}

              {/* Events */}
              {dayEvents.map((event) => {
                const color = event.isMMA ? '#C9A84C' : TEAM_COLORS[event.team]
                const top = getEventTop(event)
                const height = getEventHeight(event)

                return (
                  <button
                    key={event.id}
                    className={`week-event ${event.isMMA ? 'week-event--mma' : ''} ${event.team === 'direction' && !event.isMMA ? 'week-event--direction' : ''}`}
                    style={{
                      top,
                      height,
                      background: event.isMMA ? 'rgba(201,168,76,0.22)' : `${color}18`,
                      borderLeft: `3px solid ${color}`,
                      color,
                    }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                    id={`week-event-${event.id}`}
                  >
                    {event.isMMA && <span style={{ fontSize: 10 }}>⭐</span>}
                    <span className="week-event-title">{event.title}</span>
                    {height > 30 && (
                      <span className="week-event-time">
                        {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Current time indicator */}
              {isToday(day) && <CurrentTimeLine />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CurrentTimeLine() {
  const now = new Date()
  const top = (now.getHours() + now.getMinutes() / 60) * 60

  return (
    <div className="current-time-line" style={{ top }}>
      <div className="current-time-dot" />
    </div>
  )
}
