import React, { useMemo } from 'react'
import { format, isSameDay, isToday, setHours } from 'date-fns'
import type { CalendarEvent } from '../../lib/types'
import { TEAM_COLORS, TEAM_LABELS } from '../../lib/types'
import './CalendarDay.css'

interface CalendarDayProps {
  currentDate: Date
  events: CalendarEvent[]
  visibleTeams: Set<string>
  onSlotClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function CalendarDay({
  currentDate,
  events,
  visibleTeams,
  onSlotClick,
  onEventClick,
}: CalendarDayProps) {
  const dayEvents = useMemo(
    () => events.filter(
      (e) => visibleTeams.has(e.team) && !e.allDay && isSameDay(e.start, currentDate)
    ),
    [events, visibleTeams, currentDate]
  )

  const allDayEvents = useMemo(
    () => events.filter(
      (e) => visibleTeams.has(e.team) && e.allDay &&
        (isSameDay(e.start, currentDate) || (e.start <= currentDate && e.end >= currentDate))
    ),
    [events, visibleTeams, currentDate]
  )

  const isTodayDay = isToday(currentDate)
  const eventCount = dayEvents.length + allDayEvents.length

  return (
    <div className="calendar-day">
      {/* Day header */}
      <div className="day-header">
        <div className="day-header-info">
          <h3 className="day-header-name" style={{ textTransform: 'capitalize' }}>
            {format(currentDate, 'EEEE')}
          </h3>
          <span className={`day-header-number ${isTodayDay ? 'today-badge' : ''}`}>
            {format(currentDate, 'd')}
          </span>
          <span className="day-header-month">
            {format(currentDate, 'MMMM yyyy')}
          </span>
        </div>

        {/* Summary */}
        <div className="day-event-count">
          {eventCount === 0
            ? 'No events'
            : `${eventCount} event${eventCount !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="day-allday-section">
          <span className="day-allday-label">All Day</span>
          <div className="day-allday-events">
            {allDayEvents.map((event) => {
              const color = event.isMMA ? '#C9A84C' : TEAM_COLORS[event.team]
              return (
                <button
                  key={event.id}
                  className="day-allday-event"
                  style={{ background: `${color}20`, borderLeft: `4px solid ${color}`, color }}
                  onClick={() => onEventClick(event)}
                >
                  {event.isMMA && '⭐ '}
                  <strong>{event.title}</strong>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>{TEAM_LABELS[event.team]}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Hourly grid */}
      <div className="day-body">
        <div className="day-time-col">
          {HOURS.map((hour) => (
            <div key={hour} className="day-hour-label">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        <div
          className="day-events-col"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            const y = e.clientY - rect.top
            const hour = Math.floor(y / 64)
            const clickedDate = setHours(currentDate, Math.max(0, Math.min(23, hour)))
            onSlotClick(clickedDate)
          }}
        >
          {HOURS.map((hour) => (
            <div key={hour} className="day-hour-slot">
              <div className="day-hour-line" />
            </div>
          ))}

          {/* Events */}
          {dayEvents.map((event) => {
            const color = event.isMMA ? '#C9A84C' : TEAM_COLORS[event.team]
            const startHour = event.start.getHours() + event.start.getMinutes() / 60
            const endHour = event.end.getHours() + event.end.getMinutes() / 60
            const top = startHour * 64
            const height = Math.max((endHour - startHour) * 64, 32)

            return (
              <button
                key={event.id}
                className={`day-event ${event.isMMA ? 'day-event--mma' : ''} ${event.team === 'direction' && !event.isMMA ? 'day-event--direction' : ''}`}
                style={{
                  top,
                  height,
                  background: event.isMMA ? 'rgba(201,168,76,0.18)' : `${color}16`,
                  borderLeft: `4px solid ${color}`,
                  color,
                }}
                onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                id={`day-event-${event.id}`}
              >
                <div className="day-event-inner">
                  <div className="day-event-title">
                    {event.isMMA && '⭐ '}{event.title}
                  </div>
                  <div className="day-event-meta">
                    <span className="day-event-time">
                      {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}
                    </span>
                    <span className="day-event-team">{TEAM_LABELS[event.team]}</span>
                  </div>
                  {event.description && height > 60 && (
                    <p className="day-event-desc">{event.description}</p>
                  )}
                </div>
              </button>
            )
          })}

          {/* Current time */}
          {isTodayDay && <DayCurrentTimeLine />}
        </div>
      </div>
    </div>
  )
}

function DayCurrentTimeLine() {
  const now = new Date()
  const top = (now.getHours() + now.getMinutes() / 60) * 64

  return (
    <div className="day-current-time" style={{ top }}>
      <div className="day-current-time-dot" />
    </div>
  )
}
